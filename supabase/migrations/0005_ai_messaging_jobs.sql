-- =============================================================================
-- Al-Mada / Migration M5 — AI, Messaging, Background Jobs
-- ai_drafts, ai_draft_sections, ai_task_runs, ai_usage_log,
-- ai_prompt_versions, ai_reference_claims,
-- message_outbox, message_attempts, whatsapp_instances,
-- background_jobs, job_attempts, dead_letter_queue
-- =============================================================================

-- =============================================================================
-- 1. ai_prompt_versions
-- =============================================================================
CREATE TABLE public.ai_prompt_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key    text NOT NULL,
  version       integer NOT NULL,
  template      text NOT NULL,
  variables     jsonb NOT NULL DEFAULT '[]'::jsonb,
  model         text,
  temperature   numeric(3,2),
  notes         text,
  is_active     boolean NOT NULL DEFAULT false,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prompt_key, version)
);

-- =============================================================================
-- 2. ai_drafts
-- =============================================================================
CREATE TABLE public.ai_drafts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id     uuid,
  appointment_id uuid,
  medical_record_id uuid,
  draft_type     text NOT NULL
                 CHECK (draft_type IN ('clinical_note','summary','medication','referral','sms_reply','voice_summary','report_analysis')),
  status         text NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created','processing','draft_ready','needs_review','approved','rejected','failed')),
  ai_model       text,
  prompt_version_id uuid REFERENCES public.ai_prompt_versions(id),
  confidence     numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  needs_review   boolean NOT NULL DEFAULT true,
  input_hash     text,
  output_text    text,
  output_json    jsonb,
  error_message  text,
  source_ref     jsonb,
  created_by     uuid REFERENCES auth.users(id),
  reviewed_by    uuid REFERENCES auth.users(id),
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id, clinic_id) REFERENCES public.appointments(id, clinic_id) ON DELETE SET NULL,
  FOREIGN KEY (medical_record_id, clinic_id) REFERENCES public.medical_records(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_ai_drafts_clinic_status ON public.ai_drafts (clinic_id, status, created_at DESC);
CREATE INDEX idx_ai_drafts_patient        ON public.ai_drafts (clinic_id, patient_id, created_at DESC);

-- =============================================================================
-- 3. ai_draft_sections (per-field sections with confidence)
-- =============================================================================
CREATE TABLE public.ai_draft_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  draft_id      uuid NOT NULL,
  section_key   text NOT NULL,
  label_ar      text,
  content       text,
  confidence    numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  needs_review  boolean NOT NULL DEFAULT true,
  source        text NOT NULL DEFAULT 'ai_inferred'
                CHECK (source IN ('doctor_input','extracted','ai_inferred','imported')),
  source_ref    jsonb,
  confirmed_by  uuid REFERENCES auth.users(id),
  confirmed_at  timestamptz,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (draft_id, clinic_id) REFERENCES public.ai_drafts(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_ai_sections_draft ON public.ai_draft_sections (clinic_id, draft_id, sort_order);

-- =============================================================================
-- 4. ai_task_runs
-- =============================================================================
CREATE TABLE public.ai_task_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  draft_id       uuid,
  task_type      text NOT NULL,
  status         text NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  model          text,
  attempt_count  integer NOT NULL DEFAULT 0,
  max_attempts   integer NOT NULL DEFAULT 3,
  started_at     timestamptz,
  finished_at    timestamptz,
  duration_ms    integer,
  error_message  text,
  input_meta     jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_meta    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (draft_id, clinic_id) REFERENCES public.ai_drafts(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_ai_runs_status ON public.ai_task_runs (clinic_id, status, created_at DESC);

-- =============================================================================
-- 5. ai_usage_log
-- =============================================================================
CREATE TABLE public.ai_usage_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  task_run_id    uuid,
  model          text NOT NULL,
  provider       text NOT NULL DEFAULT 'groq',
  prompt_tokens  integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens   integer NOT NULL DEFAULT 0,
  cost_amount    numeric(12,6) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  latency_ms     integer,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (task_run_id, clinic_id) REFERENCES public.ai_task_runs(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_ai_usage_clinic ON public.ai_usage_log (clinic_id, created_at DESC);

-- =============================================================================
-- 6. ai_reference_claims (drug/alert claims with source + version)
-- =============================================================================
CREATE TABLE public.ai_reference_claims (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  draft_id       uuid,
  claim_type     text NOT NULL CHECK (claim_type IN ('drug_interaction','allergy','dosage','duplicate_therapy','contraindication','guideline')),
  subject        text NOT NULL,
  claim_text     text NOT NULL,
  severity       text NOT NULL DEFAULT 'info'
                 CHECK (severity IN ('info','warning','critical')),
  source_name    text NOT NULL,
  source_version text,
  source_url     text,
  source_date    date,
  reasoning      text,
  confirmed_by   uuid REFERENCES auth.users(id),
  confirmed_at   timestamptz,
  dismissed      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (draft_id, clinic_id) REFERENCES public.ai_drafts(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_ai_claims_draft ON public.ai_reference_claims (clinic_id, draft_id, severity);

-- =============================================================================
-- 7. message_outbox
-- =============================================================================
CREATE TABLE public.message_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id      uuid,
  channel         text NOT NULL CHECK (channel IN ('sms','whatsapp','email','telegram','push','webhook')),
  template_key    text,
  to_address      text NOT NULL,
  subject         text,
  body            text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','sending','sent','delivered','failed','cancelled')),
  priority        integer NOT NULL DEFAULT 0,
  scheduled_at    timestamptz,
  next_attempt_at timestamptz,
  attempt_count   integer NOT NULL DEFAULT 0,
  max_attempts    integer NOT NULL DEFAULT 5,
  idempotency_key text UNIQUE,
  provider_msg_id text,
  error_message   text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_outbox_pending ON public.message_outbox (status, next_attempt_at)
  WHERE status IN ('queued','sending');
CREATE INDEX idx_outbox_clinic  ON public.message_outbox (clinic_id, created_at DESC);

-- =============================================================================
-- 8. message_attempts
-- =============================================================================
CREATE TABLE public.message_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  outbox_id     uuid NOT NULL,
  attempt_number integer NOT NULL,
  status        text NOT NULL CHECK (status IN ('sent','failed','timeout')),
  provider      text,
  response_code text,
  response_body text,
  error_message text,
  duration_ms   integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (outbox_id, clinic_id) REFERENCES public.message_outbox(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_msg_attempts ON public.message_attempts (clinic_id, outbox_id, attempt_number DESC);

-- =============================================================================
-- 9. whatsapp_instances
-- =============================================================================
CREATE TABLE public.whatsapp_instances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone_number  text,
  provider      text NOT NULL DEFAULT 'whatsapp_cloud',
  credentials   jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_token text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, name)
);

-- =============================================================================
-- 10. background_jobs
-- =============================================================================
CREATE TABLE public.background_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid,
  job_type      text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','running','succeeded','failed','cancelled','dead')),
  priority      integer NOT NULL DEFAULT 0,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts  integer NOT NULL DEFAULT 5,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  error_message text,
  locked_by     text,
  locked_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_jobs_running ON public.background_jobs (status, scheduled_at)
  WHERE status IN ('queued','running');
CREATE INDEX idx_jobs_clinic  ON public.background_jobs (clinic_id, created_at DESC);

-- =============================================================================
-- 11. job_attempts
-- =============================================================================
CREATE TABLE public.job_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  job_id        uuid NOT NULL,
  attempt_number integer NOT NULL,
  status        text NOT NULL CHECK (status IN ('succeeded','failed','timeout','cancelled')),
  output        jsonb,
  error_message text,
  duration_ms   integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (job_id, clinic_id) REFERENCES public.background_jobs(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_job_attempts_job ON public.job_attempts (clinic_id, job_id, attempt_number DESC);

-- =============================================================================
-- 12. dead_letter_queue
-- =============================================================================
CREATE TABLE public.dead_letter_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  job_id        uuid,
  original_type text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  attempts      integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','replayed','discarded')),
  replayed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (job_id, clinic_id) REFERENCES public.background_jobs(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_dlq_status ON public.dead_letter_queue (clinic_id, status, created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================
SELECT app.enable_rls_clinic('ai_drafts');
SELECT app.enable_rls_clinic('ai_draft_sections');
SELECT app.enable_rls_clinic('ai_task_runs');
SELECT app.enable_rls_clinic('ai_usage_log');
SELECT app.enable_rls_clinic('ai_reference_claims');
SELECT app.enable_rls_clinic('message_outbox');
SELECT app.enable_rls_clinic('message_attempts');
SELECT app.enable_rls_clinic('whatsapp_instances');
SELECT app.enable_rls_clinic('background_jobs');
SELECT app.enable_rls_clinic('job_attempts');
SELECT app.enable_rls_clinic('dead_letter_queue');
SELECT app.enable_rls_platform('ai_prompt_versions');

-- ai_prompt_versions: read-only for authenticated users
DROP POLICY IF EXISTS ai_prompt_versions_ins ON public.ai_prompt_versions;
DROP POLICY IF EXISTS ai_prompt_versions_upd ON public.ai_prompt_versions;
DROP POLICY IF EXISTS ai_prompt_versions_del ON public.ai_prompt_versions;

-- =============================================================================
-- Triggers
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ai_drafts','ai_draft_sections','ai_task_runs','whatsapp_instances','background_jobs','message_outbox'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- auto needs_review when confidence < 0.8 (per blueprint §10.3)
CREATE OR REPLACE FUNCTION app.ai_confidence_review_flag() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.confidence IS NOT NULL AND NEW.confidence < 0.8 THEN
    NEW.needs_review := true;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_ai_draft_confidence
  BEFORE INSERT OR UPDATE ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.ai_confidence_review_flag();
CREATE TRIGGER trg_ai_section_confidence
  BEFORE INSERT OR UPDATE ON public.ai_draft_sections
  FOR EACH ROW EXECUTE FUNCTION app.ai_confidence_review_flag();

-- move exhausted background jobs to the dead letter queue
CREATE OR REPLACE FUNCTION app.job_to_dead_letter() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.attempt_count >= NEW.max_attempts THEN
    NEW.status := 'dead';
    INSERT INTO public.dead_letter_queue (clinic_id, job_id, original_type, payload, error_message, attempts)
    VALUES (NEW.clinic_id, NEW.id, NEW.job_type, NEW.payload, NEW.error_message, NEW.attempt_count);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_job_dead_letter
  BEFORE UPDATE ON public.background_jobs
  FOR EACH ROW EXECUTE FUNCTION app.job_to_dead_letter();

-- exhausted outbox messages become failed
CREATE OR REPLACE FUNCTION app.outbox_exhausted() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.attempt_count >= NEW.max_attempts THEN
    NEW.next_attempt_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_outbox_exhausted
  BEFORE UPDATE ON public.message_outbox
  FOR EACH ROW EXECUTE FUNCTION app.outbox_exhausted();
