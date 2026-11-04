-- =============================================================================
-- Al-Mada / Migration M6 — Integrity fixups found during seed validation
-- =============================================================================

-- clinics_meta is 1:1 with a clinic (settings row per clinic)
ALTER TABLE public.clinics_meta
  DROP CONSTRAINT IF EXISTS clinics_meta_clinic_id_key;
ALTER TABLE public.clinics_meta
  ADD CONSTRAINT clinics_meta_clinic_id_key UNIQUE (clinic_id);

-- appointments need a stable identity for idempotent seeding
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_clinic_patient_slot_key;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_clinic_patient_slot_key
  UNIQUE (clinic_id, patient_id, appointment_date, appointment_time);

-- package_sessions: one session per appointment (no double-decrement)
CREATE UNIQUE INDEX IF NOT EXISTS uq_package_sessions_appointment
  ON public.package_sessions (clinic_id, appointment_id)
  WHERE appointment_id IS NOT NULL;

-- background_jobs / message_outbox: platform-level rows (clinic_id NULL) need
-- a unique key that still works with NULL clinic_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_background_jobs_platform
  ON public.background_jobs (clinic_id, job_type) WHERE clinic_id IS NULL;
