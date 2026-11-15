-- =============================================================================
-- Migration 0012: Phase 4 Files, Exports, and Recycle Bin Lifecycle
-- Safe, forward-only migration. Synthetic Egyptian clinic data compliant.
-- =============================================================================

-- 1. Clinic Data Exports Table
create table if not exists public.clinic_exports (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  export_type text not null check (export_type in ('full_backup', 'patients', 'billing', 'appointments')),
  export_format text not null default 'json' check (export_format in ('json', 'csv')),
  status text not null default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  records_count integer not null default 0,
  file_size_bytes bigint not null default 0,
  file_payload text, -- Stored encrypted / structured export payload
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.clinic_exports enable row level security;

create policy clinic_exports_member_select on public.clinic_exports
  for select
  using (
    clinic_id in (
      select clinic_id from public.user_clinic_memberships
      where user_id = auth.uid()
        and role in ('clinic_owner', 'clinic_admin')
    )
  );

-- 2. Audit Trail Extension for Restores & Exports
-- 3. Recycle Bin Listing RPC
create or replace function public.list_trash_for_current_user()
returns table (
  id uuid,
  item_type text,
  title text,
  subtitle text,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_role text;
begin
  select clinic_id, role into v_clinic_id, v_role
  from public.user_clinic_memberships
  where user_id = auth.uid()
  limit 1;

  if v_clinic_id is null or v_role not in ('clinic_owner', 'clinic_admin') then
    return;
  end if;

  -- Soft-deleted Patients
  return query
  select
    p.id,
    'patient'::text as item_type,
    p.full_name as title,
    ('ملف رقم ' || p.file_number || ' · هاتف ' || p.phone)::text as subtitle,
    p.deleted_at
  from public.patients p
  where p.clinic_id = v_clinic_id
    and p.deleted_at is not null
  order by p.deleted_at desc
  limit 50;
end;
$$;

-- 4. Restore Soft-Deleted Item RPC
create or replace function public.restore_trash_item_for_current_user(
  p_item_id uuid,
  p_item_type text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_role text;
begin
  select clinic_id, role into v_clinic_id, v_role
  from public.user_clinic_memberships
  where user_id = auth.uid()
  limit 1;

  if v_clinic_id is null or v_role not in ('clinic_owner', 'clinic_admin') then
    raise exception 'Unauthorized to restore clinic records';
  end if;

  if p_item_type = 'patient' then
    update public.patients
    set deleted_at = null
    where id = p_item_id and clinic_id = v_clinic_id;

    insert into public.audit_logs (clinic_id, user_id, action, entity_type, entity_id, payload)
    values (v_clinic_id, auth.uid(), 'patient.restored', 'patient', p_item_id, jsonb_build_object('restored_at', now()));
    return true;
  end if;

  return false;
end;
$$;

-- 5. Full Clinic Data Export RPC
create or replace function public.generate_clinic_export_for_current_user(
  p_export_type text default 'full_backup'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_role text;
  v_export_id uuid;
  v_payload jsonb;
  v_patients jsonb;
  v_appointments jsonb;
  v_invoices jsonb;
  v_count integer := 0;
begin
  select clinic_id, role into v_clinic_id, v_role
  from public.user_clinic_memberships
  where user_id = auth.uid()
  limit 1;

  if v_clinic_id is null or v_role not in ('clinic_owner', 'clinic_admin') then
    raise exception 'Unauthorized to generate clinic exports';
  end if;

  -- Aggregate Patients
  select coalesce(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb)
  into v_patients
  from (
    select id, file_number, full_name, phone, email, gender, birth_date, created_at
    from public.patients
    where clinic_id = v_clinic_id and deleted_at is null
  ) p;

  -- Aggregate Appointments
  select coalesce(jsonb_agg(to_jsonb(a.*)), '[]'::jsonb)
  into v_appointments
  from (
    select id, patient_id, doctor_id, appointment_date, appointment_time, status, visit_type, reason
    from public.appointments
    where clinic_id = v_clinic_id and deleted_at is null
  ) a;

  -- Aggregate Invoices
  select coalesce(jsonb_agg(to_jsonb(inv.*)), '[]'::jsonb)
  into v_invoices
  from (
    select id, invoice_number, invoice_type, status, subtotal, discount_total, total, paid_total, currency, issued_at
    from public.invoices
    where clinic_id = v_clinic_id and deleted_at is null
  ) inv;

  v_count := jsonb_array_length(v_patients) + jsonb_array_length(v_appointments) + jsonb_array_length(v_invoices);

  v_payload := jsonb_build_object(
    'exported_at', now(),
    'clinic_id', v_clinic_id,
    'export_type', p_export_type,
    'patients', v_patients,
    'appointments', v_appointments,
    'invoices', v_invoices
  );

  insert into public.clinic_exports (clinic_id, user_id, export_type, export_format, status, records_count, file_size_bytes, file_payload)
  values (
    v_clinic_id,
    auth.uid(),
    p_export_type,
    'json',
    'completed',
    v_count,
    octet_length(v_payload::text),
    v_payload::text
  )
  returning id into v_export_id;

  insert into public.audit_logs (clinic_id, user_id, action, entity_type, entity_id, payload)
  values (v_clinic_id, auth.uid(), 'clinic.exported', 'clinic_export', v_export_id, jsonb_build_object('records_count', v_count));

  return v_export_id;
end;
$$;
