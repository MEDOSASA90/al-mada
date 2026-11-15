-- =============================================================================
-- Migration 0013: Structured E-Prescriptions, Expenses, Cashier Shifts & Doctor Commissions
-- Forward-only, compliant with Egyptian private clinic workflows and Law 151/2020.
-- =============================================================================

-- 1. Add prescription_items to medical_records if not exists
alter table public.medical_records
  add column if not exists prescription_items jsonb not null default '[]'::jsonb;

-- 2. Clinic Expenses Table (المصروفات النثرية والتشغيلية)
create table if not exists public.clinic_expenses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.clinic_branches(id) on delete set null,
  category text not null check (category in ('supplies', 'utilities', 'hospitality', 'rent', 'maintenance', 'salaries', 'other')),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EGP',
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'instapay', 'vodafone_cash', 'bank_transfer')),
  recipient_name text,
  paid_by uuid references auth.users(id),
  expense_date date not null default current_date,
  receipt_ref text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.clinic_expenses enable row level security;

create policy clinic_expenses_member_select on public.clinic_expenses
  for select
  using (
    clinic_id in (
      select clinic_id from public.user_clinic_memberships
      where user_id = auth.uid()
        and role in ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist')
    )
  );

-- 3. Daily Cashier Shifts & Register Closing (تقفيل الخزينة والوردية)
create table if not exists public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.clinic_branches(id) on delete set null,
  cashier_id uuid not null references auth.users(id),
  shift_date date not null default current_date,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_balance numeric(12, 2) not null default 0,
  cash_collected numeric(12, 2) not null default 0,
  electronic_collected numeric(12, 2) not null default 0,
  expenses_paid numeric(12, 2) not null default 0,
  expected_cash numeric(12, 2) not null default 0,
  actual_cash numeric(12, 2),
  discrepancy numeric(12, 2) default 0,
  notes text,
  status text not null default 'open' check (status in ('open', 'closed', 'verified')),
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.cashier_shifts enable row level security;

create policy cashier_shifts_select on public.cashier_shifts
  for select
  using (
    clinic_id in (
      select clinic_id from public.user_clinic_memberships
      where user_id = auth.uid()
        and role in ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist')
    )
  );

-- 4. Doctor Commission Percentage on Staff Profiles
alter table public.staff_profiles
  add column if not exists commission_percentage numeric(5, 2) default 70.00 check (commission_percentage between 0 and 100),
  add column if not exists consultation_fee numeric(10, 2) default 350.00;

-- 5. RPC: Record Clinic Expense
create or replace function public.record_clinic_expense_for_current_user(
  p_category text,
  p_description text,
  p_amount numeric,
  p_payment_method text default 'cash',
  p_recipient text default null,
  p_branch_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_role text;
  v_expense_id uuid;
begin
  select clinic_id, role into v_clinic_id, v_role
  from public.user_clinic_memberships
  where user_id = auth.uid()
  limit 1;

  if v_clinic_id is null or v_role not in ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist') then
    raise exception 'Unauthorized to record clinic expenses';
  end if;

  if p_amount <= 0 or length(btrim(p_description)) < 2 then
    raise exception 'Invalid expense amount or description';
  end if;

  insert into public.clinic_expenses (
    clinic_id, branch_id, category, description, amount, payment_method, recipient_name, paid_by
  ) values (
    v_clinic_id, p_branch_id, p_category, btrim(p_description), p_amount, p_payment_method, p_recipient, auth.uid()
  ) returning id into v_expense_id;

  insert into public.audit_logs (clinic_id, user_id, action, entity_type, entity_id, payload)
  values (v_clinic_id, auth.uid(), 'expense.recorded', 'clinic_expense', v_expense_id, jsonb_build_object('amount', p_amount, 'category', p_category));

  return v_expense_id;
end;
$$;

-- 6. RPC: Close Cashier Shift
create or replace function public.close_cashier_shift_for_current_user(
  p_actual_cash numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_role text;
  v_shift_id uuid;
  v_cash_in numeric := 0;
  v_elec_in numeric := 0;
  v_exp_out numeric := 0;
  v_expected numeric := 0;
  v_diff numeric := 0;
begin
  select clinic_id, role into v_clinic_id, v_role
  from public.user_clinic_memberships
  where user_id = auth.uid()
  limit 1;

  if v_clinic_id is null or v_role not in ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist') then
    raise exception 'Unauthorized to close cashier shift';
  end if;

  -- Calculate today's cash collections
  select coalesce(sum(p.amount), 0) into v_cash_in
  from public.invoice_payments p
  join public.invoices inv on inv.id = p.invoice_id
  where inv.clinic_id = v_clinic_id
    and p.payment_method = 'cash'
    and p.created_at::date = current_date;

  -- Calculate electronic collections
  select coalesce(sum(p.amount), 0) into v_elec_in
  from public.invoice_payments p
  join public.invoices inv on inv.id = p.invoice_id
  where inv.clinic_id = v_clinic_id
    and p.payment_method != 'cash'
    and p.created_at::date = current_date;

  -- Calculate today's cash expenses paid
  select coalesce(sum(amount), 0) into v_exp_out
  from public.clinic_expenses
  where clinic_id = v_clinic_id
    and payment_method = 'cash'
    and expense_date = current_date;

  v_expected := v_cash_in - v_exp_out;
  v_diff := p_actual_cash - v_expected;

  insert into public.cashier_shifts (
    clinic_id, cashier_id, shift_date, closed_at,
    opening_balance, cash_collected, electronic_collected,
    expenses_paid, expected_cash, actual_cash, discrepancy, notes, status
  ) values (
    v_clinic_id, auth.uid(), current_date, now(),
    0, v_cash_in, v_elec_in, v_exp_out, v_expected, p_actual_cash, v_diff, p_notes, 'closed'
  ) returning id into v_shift_id;

  insert into public.audit_logs (clinic_id, user_id, action, entity_type, entity_id, payload)
  values (v_clinic_id, auth.uid(), 'cashier_shift.closed', 'cashier_shift', v_shift_id, jsonb_build_object('actual_cash', p_actual_cash, 'discrepancy', v_diff));

  return v_shift_id;
end;
$$;
