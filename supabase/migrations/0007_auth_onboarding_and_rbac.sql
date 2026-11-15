-- Authentication onboarding and least-privilege tenant policies.
-- Context is derived from the signed-in user's active membership; request
-- supplied custom GUC values are never trusted as identity or role.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'visiting_doctor';

CREATE OR REPLACE FUNCTION app.current_clinic_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT m.clinic_id
  FROM public.user_clinic_memberships AS m
  WHERE m.user_id = auth.uid() AND m.is_active AND m.deleted_at IS NULL
  ORDER BY m.is_primary DESC, m.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.current_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT m.role::text
  FROM public.user_clinic_memberships AS m
  WHERE m.user_id = auth.uid()
    AND m.clinic_id = app.current_clinic_id()
    AND m.is_active AND m.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT auth.uid(); $$;

CREATE OR REPLACE FUNCTION app.has_clinic_role(allowed_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_clinic_memberships AS m
      WHERE m.user_id = auth.uid()
        AND m.clinic_id = app.current_clinic_id()
        AND m.is_active AND m.deleted_at IS NULL
        AND m.role::text = ANY (allowed_roles)
    );
$$;

GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_clinic_role(text[]) TO authenticated;

-- Create the first clinic atomically for a newly authenticated owner.
CREATE OR REPLACE FUNCTION public.create_clinic_for_current_user(p_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid;
  v_name text := btrim(p_name);
  v_slug text := lower(btrim(p_slug));
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  IF length(v_name) < 2 OR length(v_name) > 120 THEN RAISE EXCEPTION 'Clinic name must be 2 to 120 characters'; END IF;
  IF v_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' THEN RAISE EXCEPTION 'Use a 3 to 50 character slug with lowercase letters, numbers, and hyphens'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_clinic_memberships WHERE user_id = v_user AND is_active) THEN
    RAISE EXCEPTION 'This account already belongs to a clinic';
  END IF;

  INSERT INTO public.clinics (name, name_ar, slug)
  VALUES (v_name, v_name, v_slug) RETURNING id INTO v_clinic;
  INSERT INTO public.clinic_branches (clinic_id, name, name_ar, code)
  VALUES (v_clinic, 'Main branch', 'الفرع الرئيسي', 'MAIN');
  INSERT INTO public.user_clinic_memberships (clinic_id, user_id, role, is_primary, is_active)
  VALUES (v_clinic, v_user, 'clinic_owner', true, true);
  INSERT INTO public.clinics_meta (clinic_id) VALUES (v_clinic);
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, 'clinic_owner', 'clinic.created', 'clinic', v_clinic);
  RETURN v_clinic;
END;
$$;
REVOKE ALL ON FUNCTION public.create_clinic_for_current_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_clinic_for_current_user(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_patient_for_current_user(
  p_full_name text, p_phone text, p_email text DEFAULT NULL,
  p_gender text DEFAULT NULL, p_birth_date date DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_patient uuid;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist') THEN RAISE EXCEPTION 'Not allowed to create patients'; END IF;
  IF length(btrim(p_full_name)) < 2 OR length(btrim(p_full_name)) > 160 THEN RAISE EXCEPTION 'Invalid patient name'; END IF;
  IF p_phone !~ '^\+?[0-9 ()-]{7,20}$' THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF p_gender IS NOT NULL AND p_gender NOT IN ('male','female','other') THEN RAISE EXCEPTION 'Invalid gender'; END IF;

  INSERT INTO public.patients (clinic_id, full_name, phone, email, gender, birth_date)
  VALUES (v_clinic, btrim(p_full_name), btrim(p_phone), NULLIF(btrim(p_email), ''), p_gender, p_birth_date)
  RETURNING id INTO v_patient;
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'patient.created', 'patient', v_patient);
  RETURN v_patient;
END;
$$;
REVOKE ALL ON FUNCTION public.create_patient_for_current_user(text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_patient_for_current_user(text, text, text, text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_patient_for_current_user(
  p_id uuid, p_full_name text, p_phone text, p_email text,
  p_gender text, p_birth_date date
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_clinic uuid := app.current_clinic_id(); v_role text := app.current_role();
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist') THEN RAISE EXCEPTION 'Not allowed to edit patients'; END IF;
  IF length(btrim(p_full_name)) < 2 OR length(btrim(p_full_name)) > 160 THEN RAISE EXCEPTION 'Invalid patient name'; END IF;
  IF p_phone !~ '^\+?[0-9 ()-]{7,20}$' THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF p_gender IS NOT NULL AND p_gender NOT IN ('male','female','other') THEN RAISE EXCEPTION 'Invalid gender'; END IF;

  UPDATE public.patients
  SET full_name = btrim(p_full_name), phone = btrim(p_phone), email = NULLIF(btrim(p_email), ''),
      gender = p_gender, birth_date = p_birth_date
  WHERE id = p_id AND clinic_id = v_clinic AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Patient not found'; END IF;
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'patient.updated', 'patient', p_id);
END;
$$;
REVOKE ALL ON FUNCTION public.update_patient_for_current_user(uuid, text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_patient_for_current_user(uuid, text, text, text, text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_patient_for_current_user(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_clinic uuid := app.current_clinic_id(); v_role text := app.current_role();
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin') THEN RAISE EXCEPTION 'Not allowed to archive patients'; END IF;
  UPDATE public.patients SET deleted_at = now(), deleted_by = v_user
  WHERE id = p_id AND clinic_id = v_clinic AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Patient not found'; END IF;
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'patient.archived', 'patient', p_id);
END;
$$;
REVOKE ALL ON FUNCTION public.archive_patient_for_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_patient_for_current_user(uuid) TO authenticated;

-- All patient writes go through the audited, tenant-derived RPCs above.
REVOKE INSERT, UPDATE, DELETE ON public.patients FROM authenticated;

-- Replace broad generic write policies with role-aware access. Every tenant
-- table remains constrained to the one active clinic selected by membership.
DO $$
DECLARE t record; v_select_roles text[]; v_write_roles text[];
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'clinic_id' AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.table_name || '_sel', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.table_name || '_ins', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.table_name || '_upd', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.table_name || '_del', t.table_name);

    IF t.table_name = 'audit_logs' THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin'];
      v_write_roles := ARRAY[]::text[];
    ELSIF t.table_name IN ('medical_records','medical_record_versions','ai_drafts','ai_draft_sections','ai_task_runs','ai_reference_claims') THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor'];
    ELSIF t.table_name IN ('invoices','invoice_items','payment_transactions','refunds','settlements','cash_movements','clinic_expenses','shifts') THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','accountant'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin','accountant'];
    ELSIF t.table_name IN ('clinics_meta','clinic_feature_overrides','subscriptions','subscription_invoices','subscription_payments','subscription_events','affiliate_commissions','api_keys','ai_usage_log','usage_events','usage_monthly_aggregates','message_outbox','message_attempts','whatsapp_instances','background_jobs','job_attempts','dead_letter_queue') THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','accountant'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin'];
    ELSIF t.table_name IN ('patient_conditions','patient_allergies','patient_consents','communication_preferences','attachments','attachment_access_logs') THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor'];
    ELSIF t.table_name = 'patients' THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse','receptionist'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist'];
    ELSIF t.table_name = 'staff_profiles' THEN
      v_select_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse','receptionist','accountant'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin'];
    ELSE
      v_select_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse','receptionist','accountant','inventory_manager'];
      v_write_roles := ARRAY['clinic_owner','clinic_admin'];
    END IF;

    -- Clinical history and AI drafts are not readable by reception, nurses,
    -- finance, inventory, integration, or platform support roles.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (clinic_id = app.current_clinic_id() AND app.has_clinic_role(%L::text[]))',
      t.table_name || '_sel', t.table_name, v_select_roles::text);

    IF t.table_name NOT IN ('medical_record_versions','audit_logs','attachment_access_logs','message_attempts','job_attempts') THEN
      IF t.table_name = 'patients' THEN
        v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist'];
      ELSIF t.table_name IN ('appointments','queue_tickets') THEN
        v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse','receptionist'];
      ELSIF t.table_name = 'medical_records' THEN
        v_write_roles := ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor'];
      END IF;
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (clinic_id = app.current_clinic_id() AND app.has_clinic_role(%L::text[]))',
        t.table_name || '_ins', t.table_name, v_write_roles::text);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (clinic_id = app.current_clinic_id() AND app.has_clinic_role(%L::text[])) WITH CHECK (clinic_id = app.current_clinic_id() AND app.has_clinic_role(%L::text[]))',
        t.table_name || '_upd', t.table_name, v_write_roles::text, v_write_roles::text);
    END IF;
  END LOOP;
END;
$$;

-- Membership administration cannot be performed by ordinary clinic members.
DROP POLICY IF EXISTS user_clinic_memberships_ins ON public.user_clinic_memberships;
DROP POLICY IF EXISTS user_clinic_memberships_upd ON public.user_clinic_memberships;
DROP POLICY IF EXISTS user_clinic_memberships_del ON public.user_clinic_memberships;
CREATE POLICY user_clinic_memberships_ins ON public.user_clinic_memberships
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY user_clinic_memberships_upd ON public.user_clinic_memberships
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY user_clinic_memberships_del ON public.user_clinic_memberships
  FOR DELETE TO authenticated USING (false);

-- Prevent direct REST reads of sensitive fields until role-aware application
-- endpoints and restricted views are implemented. The patient list needs only
-- this basic directory projection. staff salaries, IDs, and commission rates
-- remain unavailable to the shared authenticated database role.
REVOKE SELECT ON public.patients FROM authenticated;
GRANT SELECT (id, clinic_id, file_number, full_name, phone, email, gender, birth_date, is_active, created_at, deleted_at)
  ON public.patients TO authenticated;
REVOKE SELECT ON public.staff_profiles FROM authenticated;
GRANT SELECT (id, clinic_id, user_id, full_name, phone, email, role, specialty_id,
              license_number, license_expiry, hire_date, bio, avatar_url, is_active,
              created_at, updated_at, deleted_at, deleted_by)
  ON public.staff_profiles TO authenticated;

-- Audit history is append-only; application users cannot forge audit rows.
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

-- Existing triggers that update protected patient/package columns must perform
-- only their narrowly defined maintenance work under the function owner.
ALTER FUNCTION app.sync_package_used_sessions() SECURITY DEFINER;
ALTER FUNCTION app.sync_package_used_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION app.touch_patient_last_visit() SECURITY DEFINER;
ALTER FUNCTION app.touch_patient_last_visit() SET search_path = public, pg_temp;
ALTER FUNCTION app.on_appointment_completed() SECURITY DEFINER;
ALTER FUNCTION app.on_appointment_completed() SET search_path = public, pg_temp;

-- Reference/configuration tables are readable to signed-in users; mutations
-- are reserved for database administrators and service workflows.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subscription_plans','permissions','role_permissions','specialties','feature_flags','saas_affiliates','specialty_form_schemas','ai_prompt_versions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_ins', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_upd', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_del', t);
  END LOOP;
END;
$$;

-- Profile and clinic records may be changed only by their owner/admin roles.
DROP POLICY IF EXISTS clinics_ins ON public.clinics;
DROP POLICY IF EXISTS clinics_del ON public.clinics;
DROP POLICY IF EXISTS profiles_ins ON public.profiles;
DROP POLICY IF EXISTS profiles_del ON public.profiles;

-- Version snapshots are created only by the medical record trigger.
ALTER FUNCTION app.snapshot_medical_record() SECURITY DEFINER;
ALTER FUNCTION app.snapshot_medical_record() SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.create_clinic_for_current_user(text, text) IS
  'Atomically creates a first clinic, main branch, owner membership, and settings row for the authenticated user.';
