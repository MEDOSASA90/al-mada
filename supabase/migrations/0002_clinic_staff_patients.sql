-- =============================================================================
-- Al-Mada / Migration M2 — Clinic Staff & Patients
-- staff_profiles, doctor_schedules, doctor_time_off, patients,
-- patient_packages, package_sessions, patient_conditions, patient_allergies,
-- patient_consents, communication_preferences
-- =============================================================================

-- =============================================================================
-- 1. staff_profiles
-- =============================================================================
CREATE TABLE public.staff_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name      text NOT NULL,
  national_id    text,
  phone          text,
  email          text,
  role           user_role NOT NULL,
  specialty_id   uuid REFERENCES public.specialties(id),
  license_number text,
  license_expiry date,
  hire_date      date,
  salary         numeric(12,2),
  commission_pct numeric(5,2) NOT NULL DEFAULT 0,
  bio            text,
  avatar_url     text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES auth.users(id),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, user_id)
);
CREATE INDEX idx_staff_clinic_role ON public.staff_profiles (clinic_id, role) WHERE is_active;
CREATE INDEX idx_staff_phone ON public.staff_profiles (clinic_id, phone);

-- =============================================================================
-- 2. doctor_schedules
-- =============================================================================
CREATE TABLE public.doctor_schedules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id     uuid NOT NULL,
  branch_id     uuid REFERENCES public.clinic_branches(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  slot_minutes  smallint NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 5 AND 240),
  max_overbook  smallint NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (doctor_id, clinic_id) REFERENCES public.staff_profiles(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_schedules_doctor ON public.doctor_schedules (clinic_id, doctor_id, day_of_week);

-- =============================================================================
-- 3. doctor_time_off
-- =============================================================================
CREATE TABLE public.doctor_time_off (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id   uuid NOT NULL,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  reason      text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  FOREIGN KEY (doctor_id, clinic_id) REFERENCES public.staff_profiles(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_timeoff_doctor ON public.doctor_time_off (clinic_id, doctor_id, starts_at);

-- =============================================================================
-- 4. patients
-- =============================================================================
CREATE TABLE public.patients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_number    text NOT NULL,
  full_name      text NOT NULL,
  national_id    text,
  phone          text NOT NULL,
  alt_phone      text,
  email          text,
  gender         text CHECK (gender IN ('male','female','other')),
  birth_date     date,
  blood_type     text,
  address        text,
  governorate    text,
  city           text,
  emergency_contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  insurance_no   text,
  referral_source text,
  notes          text,
  first_visit_at timestamptz,
  last_visit_at  timestamptz,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES auth.users(id),
  UNIQUE (clinic_id, file_number),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, user_id)
);
CREATE INDEX idx_patients_clinic_file  ON public.patients (clinic_id, file_number);
CREATE INDEX idx_patients_clinic_phone ON public.patients (clinic_id, phone);
CREATE INDEX idx_patients_clinic_name  ON public.patients (clinic_id, full_name);
CREATE INDEX idx_patients_active       ON public.patients (clinic_id) WHERE is_active AND deleted_at IS NULL;

-- per-clinic sequential file number
CREATE OR REPLACE FUNCTION app.next_patient_file_number(p_clinic uuid) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE v_seq integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(file_number, '\D', '', 'g'), '')::integer), 0) + 1
    INTO v_seq
  FROM public.patients
  WHERE clinic_id = p_clinic;
  RETURN LPAD(v_seq::text, 6, '0');
END;
$$;

-- =============================================================================
-- 5. patient_packages
-- =============================================================================
CREATE TABLE public.patient_packages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id        uuid NOT NULL,
  name              text NOT NULL,
  package_type      text NOT NULL DEFAULT 'sessions',
  total_sessions    integer NOT NULL CHECK (total_sessions > 0),
  used_sessions     integer NOT NULL DEFAULT 0 CHECK (used_sessions >= 0),
  price             numeric(12,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'EGP',
  discount_pct      numeric(5,2) NOT NULL DEFAULT 0,
  valid_from        date NOT NULL DEFAULT CURRENT_DATE,
  valid_until       date,
  is_active         boolean NOT NULL DEFAULT true,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CHECK (used_sessions <= total_sessions),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_packages_patient ON public.patient_packages (clinic_id, patient_id) WHERE is_active;

-- =============================================================================
-- 6. package_sessions (source of truth for used_sessions)
-- =============================================================================
CREATE TABLE public.package_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  package_id   uuid NOT NULL,
  patient_id   uuid NOT NULL,
  appointment_id uuid,
  used_at      timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (package_id, clinic_id) REFERENCES public.patient_packages(id, clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_pkg_sessions_pkg ON public.package_sessions (clinic_id, package_id);

-- keep patient_packages.used_sessions in sync (P10)
CREATE OR REPLACE FUNCTION app.sync_package_used_sessions() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_pkg uuid; v_clinic uuid;
BEGIN
  v_pkg := COALESCE(NEW.package_id, OLD.package_id);
  v_clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);
  UPDATE public.patient_packages
     SET used_sessions = (SELECT count(*) FROM public.package_sessions WHERE package_id = v_pkg)
   WHERE id = v_pkg AND clinic_id = v_clinic;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_package_sessions_sync
  AFTER INSERT OR DELETE ON public.package_sessions
  FOR EACH ROW EXECUTE FUNCTION app.sync_package_used_sessions();

-- =============================================================================
-- 7. patient_conditions
-- =============================================================================
CREATE TABLE public.patient_conditions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id    uuid NOT NULL,
  name          text NOT NULL,
  icd10_code    text,
  source        text NOT NULL DEFAULT 'doctor_input'
                CHECK (source IN ('doctor_input','extracted','ai_inferred','imported')),
  source_ref    jsonb,
  diagnosed_at  date,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','chronic','remission')),
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_conditions_patient ON public.patient_conditions (clinic_id, patient_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 8. patient_allergies
-- =============================================================================
CREATE TABLE public.patient_allergies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id   uuid NOT NULL,
  substance    text NOT NULL,
  reaction     text,
  severity     text CHECK (severity IN ('mild','moderate','severe','life_threatening')),
  source       text NOT NULL DEFAULT 'doctor_input'
               CHECK (source IN ('doctor_input','extracted','ai_inferred','imported')),
  source_ref   jsonb,
  noted_at     date,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_allergies_patient ON public.patient_allergies (clinic_id, patient_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 9. patient_consents
-- =============================================================================
CREATE TABLE public.patient_consents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id     uuid NOT NULL,
  consent_type   text NOT NULL CHECK (consent_type IN ('treatment','data_processing','marketing','ai_assistance','research')),
  granted        boolean NOT NULL,
  granted_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz,
  method         text NOT NULL DEFAULT 'signature' CHECK (method IN ('signature','verbal','written','digital')),
  signature_url  text,
  ip_address     inet,
  policy_version text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_consents_patient ON public.patient_consents (clinic_id, patient_id, consent_type);

-- =============================================================================
-- 10. communication_preferences
-- =============================================================================
CREATE TABLE public.communication_preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id      uuid NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('sms','whatsapp','email','telegram','push')),
  is_enabled      boolean NOT NULL DEFAULT true,
  quiet_hours_from time,
  quiet_hours_to  time,
  language        text NOT NULL DEFAULT 'ar',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, patient_id, channel),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);

-- =============================================================================
-- RLS
-- =============================================================================
SELECT app.enable_rls_clinic('staff_profiles');
SELECT app.enable_rls_clinic('doctor_schedules');
SELECT app.enable_rls_clinic('doctor_time_off');
SELECT app.enable_rls_clinic('patients');
SELECT app.enable_rls_clinic('patient_packages');
SELECT app.enable_rls_clinic('package_sessions');
SELECT app.enable_rls_clinic('patient_conditions');
SELECT app.enable_rls_clinic('patient_allergies');
SELECT app.enable_rls_clinic('patient_consents');
SELECT app.enable_rls_clinic('communication_preferences');

-- patients: a patient-role user sees only their own row
DROP POLICY IF EXISTS patients_sel ON public.patients;
CREATE POLICY patients_sel ON public.patients FOR SELECT TO authenticated USING (
  clinic_id = app.current_clinic_id()
  AND (
    app.current_role() <> 'patient'
    OR user_id = auth.uid()
  )
);

-- patient_consents / preferences for patient-role users: own rows only
DROP POLICY IF EXISTS patient_consents_sel ON public.patient_consents;
CREATE POLICY patient_consents_sel ON public.patient_consents FOR SELECT TO authenticated USING (
  clinic_id = app.current_clinic_id()
  AND (
    app.current_role() <> 'patient'
    OR patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = auth.uid())
  )
);

-- =============================================================================
-- Triggers
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'staff_profiles','doctor_schedules','patients','patient_packages',
    'patient_conditions','patient_allergies','communication_preferences'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- auto-assign file_number on insert
CREATE OR REPLACE FUNCTION app.set_patient_file_number() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.file_number IS NULL OR NEW.file_number = '' THEN
    NEW.file_number := app.next_patient_file_number(NEW.clinic_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_patients_file_number
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION app.set_patient_file_number();

-- update last_visit_at
CREATE OR REPLACE FUNCTION app.touch_patient_last_visit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.patients
     SET last_visit_at = now(), first_visit_at = COALESCE(first_visit_at, now())
   WHERE id = NEW.patient_id AND clinic_id = NEW.clinic_id;
  RETURN NEW;
END;
$$;
