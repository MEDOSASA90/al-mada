-- =============================================================================
-- Al-Mada / Migration M3 — Clinical: Appointments, Queue, Medical Records,
-- Templates, Attachments
-- appointments, queue_tickets, medical_records, medical_record_versions,
-- medical_templates, specialty_form_schemas, attachments, attachment_access_logs
-- =============================================================================

-- =============================================================================
-- 1. appointments
-- =============================================================================
CREATE TABLE public.appointments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id         uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  patient_id        uuid NOT NULL,
  doctor_id         uuid NOT NULL,
  appointment_date  date NOT NULL,
  appointment_time  time NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  status            text NOT NULL DEFAULT 'booked'
                    CHECK (status IN ('booked','confirmed','waiting','in_progress','completed','canceled','no_show','rescheduled')),
  visit_type        text NOT NULL DEFAULT 'clinic' CHECK (visit_type IN ('clinic','telemedicine','home','emergency')),
  reason            text,
  notes             text,
  package_id        uuid,
  price             numeric(12,2) NOT NULL DEFAULT 0,
  discount          numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount       numeric(12,2) NOT NULL DEFAULT 0,
  source            text NOT NULL DEFAULT 'reception' CHECK (source IN ('reception','phone','whatsapp','online','n8n','ai_assistant')),
  created_by        uuid REFERENCES auth.users(id),
  confirmed_at      timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  canceled_at       timestamptz,
  cancel_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE RESTRICT,
  FOREIGN KEY (doctor_id, clinic_id) REFERENCES public.staff_profiles(id, clinic_id) ON DELETE RESTRICT
);
CREATE INDEX idx_appts_clinic_date  ON public.appointments (clinic_id, appointment_date);
CREATE INDEX idx_appts_doctor_slot  ON public.appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('booked','confirmed','waiting','in_progress');
CREATE INDEX idx_appts_patient      ON public.appointments (clinic_id, patient_id, appointment_date DESC);
CREATE INDEX idx_appts_status       ON public.appointments (clinic_id, status) WHERE deleted_at IS NULL;

-- prevent double-booking the same doctor slot (P8)
CREATE UNIQUE INDEX uq_appts_no_double_booking ON public.appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('booked','confirmed') AND deleted_at IS NULL;

-- =============================================================================
-- 2. queue_tickets
-- =============================================================================
CREATE TABLE public.queue_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id      uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  appointment_id uuid,
  patient_id     uuid NOT NULL,
  doctor_id      uuid,
  ticket_number  integer NOT NULL,
  status         text NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting','called','in_service','done','skipped','cancelled')),
  priority       integer NOT NULL DEFAULT 0,
  called_at      timestamptz,
  served_at      timestamptz,
  completed_at   timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, ticket_number),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id, clinic_id) REFERENCES public.appointments(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_queue_waiting ON public.queue_tickets (clinic_id, branch_id, status, priority DESC, created_at);

-- =============================================================================
-- 3. medical_records
-- =============================================================================
CREATE TABLE public.medical_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id       uuid NOT NULL,
  appointment_id   uuid,
  doctor_id        uuid,
  record_type      text NOT NULL DEFAULT 'visit'
                   CHECK (record_type IN ('visit','procedure','surgery','lab','imaging','discharge','followup')),
  chief_complaint  text,
  diagnosis        text,
  treatment_plan   text,
  notes            text,
  vitals           jsonb NOT NULL DEFAULT '{}'::jsonb,
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','final','amended','locked')),
  is_locked        boolean NOT NULL DEFAULT false,
  source           text NOT NULL DEFAULT 'doctor_input'
                   CHECK (source IN ('doctor_input','extracted','ai_inferred','imported')),
  source_ref       jsonb,
  confirmed_by     uuid REFERENCES auth.users(id),
  confirmed_at     timestamptz,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id, clinic_id) REFERENCES public.appointments(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_medrec_patient ON public.medical_records (clinic_id, patient_id, created_at DESC);
CREATE INDEX idx_medrec_status  ON public.medical_records (clinic_id, status) WHERE deleted_at IS NULL;

-- =============================================================================
-- 4. medical_record_versions (P5 — immutable history)
-- =============================================================================
CREATE TABLE public.medical_record_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  medical_record_id uuid NOT NULL,
  version_number  integer NOT NULL,
  snapshot        jsonb NOT NULL,
  change_reason   text,
  changed_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, medical_record_id, version_number),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (medical_record_id, clinic_id) REFERENCES public.medical_records(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_medrec_versions ON public.medical_record_versions (clinic_id, medical_record_id, version_number DESC);

CREATE OR REPLACE FUNCTION app.snapshot_medical_record() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_next integer; v_snapshot jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.is_locked OR NEW.is_locked) THEN
    -- still snapshot, but block destructive overwrite of a locked record
    IF OLD.is_locked AND (NEW.diagnosis IS DISTINCT FROM OLD.diagnosis
       OR NEW.treatment_plan IS DISTINCT FROM OLD.treatment_plan) THEN
      RAISE EXCEPTION 'locked medical record cannot be edited; create an amendment';
    END IF;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next
  FROM public.medical_record_versions WHERE medical_record_id = NEW.id;

  v_snapshot := to_jsonb(NEW) - 'updated_at';
  INSERT INTO public.medical_record_versions (clinic_id, medical_record_id, version_number, snapshot, changed_by)
  VALUES (NEW.clinic_id, NEW.id, v_next, v_snapshot, auth.uid());

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_medrec_snapshot
  AFTER INSERT OR UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION app.snapshot_medical_record();

-- =============================================================================
-- 5. medical_templates
-- =============================================================================
CREATE TABLE public.medical_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name        text NOT NULL,
  name_ar     text,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  fields      jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, name)
);

-- =============================================================================
-- 6. specialty_form_schemas (platform level)
-- =============================================================================
CREATE TABLE public.specialty_form_schemas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id  uuid NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  version       integer NOT NULL DEFAULT 1,
  schema        jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (specialty_id, version)
);

-- =============================================================================
-- 7. attachments
-- =============================================================================
CREATE TABLE public.attachments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  entity_type    text NOT NULL,
  entity_id      uuid NOT NULL,
  patient_id     uuid,
  file_name      text NOT NULL,
  storage_path   text NOT NULL,
  mime_type      text NOT NULL,
  size_bytes     bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  uploaded_by    uuid REFERENCES auth.users(id),
  is_phi         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, storage_path),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_attachments_entity ON public.attachments (clinic_id, entity_type, entity_id);
CREATE INDEX idx_attachments_patient ON public.attachments (clinic_id, patient_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 8. attachment_access_logs
-- =============================================================================
CREATE TABLE public.attachment_access_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  attachment_id uuid NOT NULL,
  user_id       uuid,
  action        text NOT NULL CHECK (action IN ('view','download','signed_url','delete','upload')),
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (attachment_id, clinic_id) REFERENCES public.attachments(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_attlog_clinic ON public.attachment_access_logs (clinic_id, created_at DESC);
CREATE INDEX idx_attlog_attach ON public.attachment_access_logs (attachment_id, created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================
SELECT app.enable_rls_clinic('appointments');
SELECT app.enable_rls_clinic('queue_tickets');
SELECT app.enable_rls_clinic('medical_records');
SELECT app.enable_rls_clinic('medical_record_versions');
SELECT app.enable_rls_clinic('medical_templates');
SELECT app.enable_rls_clinic('attachments');
SELECT app.enable_rls_clinic('attachment_access_logs');
SELECT app.enable_rls_platform('specialty_form_schemas');

-- patients see only their own clinical data
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','queue_tickets','medical_records'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_sel', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (clinic_id = app.current_clinic_id() AND (app.current_role() <> ''patient'' OR patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = auth.uid())))',
      t || '_sel', t);
  END LOOP;
END;
$$;

-- =============================================================================
-- Triggers
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','queue_tickets','medical_records','medical_templates'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- auto next ticket number per branch
CREATE OR REPLACE FUNCTION app.set_queue_ticket_number() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_next integer;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO v_next
  FROM public.queue_tickets
  WHERE clinic_id = NEW.clinic_id AND branch_id IS NOT DISTINCT FROM NEW.branch_id
    AND created_at::date = CURRENT_DATE;
  NEW.ticket_number := v_next;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_queue_ticket_number
  BEFORE INSERT ON public.queue_tickets
  FOR EACH ROW EXECUTE FUNCTION app.set_queue_ticket_number();

-- touch patient last visit when an appointment completes
CREATE OR REPLACE FUNCTION app.on_appointment_completed() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.patients
       SET last_visit_at = now(), first_visit_at = COALESCE(first_visit_at, now())
     WHERE id = NEW.patient_id AND clinic_id = NEW.clinic_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_appointment_completed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION app.on_appointment_completed();
