-- Read-only patient portal snapshot for the authenticated patient.
-- Patients see their own linked records across clinics; this does not grant
-- clinic staff cross-tenant access. Clinical files stay in a private bucket.

CREATE OR REPLACE FUNCTION public.get_my_patient_portal_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_snapshot jsonb;
  v_patient record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  v_snapshot := jsonb_build_object(
    'patients', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'clinic_id', p.clinic_id, 'file_number', p.file_number,
        'full_name', p.full_name, 'phone', p.phone, 'email', p.email,
        'gender', p.gender, 'birth_date', p.birth_date, 'blood_type', p.blood_type,
        'first_visit_at', p.first_visit_at, 'last_visit_at', p.last_visit_at,
        'clinic_name', COALESCE(c.name_ar, c.name)
      ) ORDER BY p.created_at DESC)
      FROM public.patients p
      JOIN public.clinics c ON c.id = p.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL
    ), '[]'::jsonb),
    'appointments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'patient_id', a.patient_id, 'clinic_id', a.clinic_id,
        'date', a.appointment_date, 'time', a.appointment_time,
        'duration_minutes', a.duration_minutes, 'status', a.status,
        'visit_type', a.visit_type, 'reason', a.reason,
        'clinic_name', COALESCE(c.name_ar, c.name),
        'doctor_name', s.full_name
      ) ORDER BY a.appointment_date DESC, a.appointment_time DESC)
      FROM public.appointments a
      JOIN public.patients p ON p.id = a.patient_id AND p.clinic_id = a.clinic_id
      JOIN public.clinics c ON c.id = a.clinic_id
      LEFT JOIN public.staff_profiles s ON s.id = a.doctor_id AND s.clinic_id = a.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL AND a.deleted_at IS NULL
    ), '[]'::jsonb),
    'records', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mr.id, 'patient_id', mr.patient_id, 'clinic_id', mr.clinic_id,
        'created_at', mr.created_at, 'record_type', mr.record_type,
        'chief_complaint', mr.chief_complaint, 'diagnosis', mr.diagnosis,
        'treatment_plan', mr.treatment_plan, 'notes', mr.notes,
        'vitals', mr.vitals, 'status', mr.status,
        'clinic_name', COALESCE(c.name_ar, c.name), 'doctor_name', s.full_name
      ) ORDER BY mr.created_at DESC)
      FROM public.medical_records mr
      JOIN public.patients p ON p.id = mr.patient_id AND p.clinic_id = mr.clinic_id
      JOIN public.clinics c ON c.id = mr.clinic_id
      LEFT JOIN public.staff_profiles s ON s.id = mr.doctor_id AND s.clinic_id = mr.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL
        AND mr.deleted_at IS NULL AND mr.status IN ('final','amended','locked')
    ), '[]'::jsonb),
    'conditions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', pc.id, 'patient_id', pc.patient_id, 'clinic_id', pc.clinic_id,
        'name', pc.name, 'icd10_code', pc.icd10_code, 'status', pc.status,
        'diagnosed_at', pc.diagnosed_at, 'source', pc.source,
        'clinic_name', COALESCE(c.name_ar, c.name)
      ) ORDER BY pc.created_at DESC)
      FROM public.patient_conditions pc
      JOIN public.patients p ON p.id = pc.patient_id AND p.clinic_id = pc.clinic_id
      JOIN public.clinics c ON c.id = pc.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL
    ), '[]'::jsonb),
    'allergies', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', pa.id, 'patient_id', pa.patient_id, 'clinic_id', pa.clinic_id,
        'substance', pa.substance, 'reaction', pa.reaction, 'severity', pa.severity,
        'source', pa.source, 'noted_at', pa.noted_at,
        'clinic_name', COALESCE(c.name_ar, c.name)
      ) ORDER BY pa.created_at DESC)
      FROM public.patient_allergies pa
      JOIN public.patients p ON p.id = pa.patient_id AND p.clinic_id = pa.clinic_id
      JOIN public.clinics c ON c.id = pa.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL
    ), '[]'::jsonb),
    'attachments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'patient_id', a.patient_id, 'clinic_id', a.clinic_id,
        'file_name', a.file_name, 'mime_type', a.mime_type,
        'size_bytes', a.size_bytes, 'kind', a.entity_type,
        'created_at', a.created_at, 'clinic_name', COALESCE(c.name_ar, c.name)
      ) ORDER BY a.created_at DESC)
      FROM public.attachments a
      JOIN public.patients p ON p.id = a.patient_id AND p.clinic_id = a.clinic_id
      JOIN public.clinics c ON c.id = a.clinic_id
      WHERE p.user_id = v_user AND p.deleted_at IS NULL AND a.deleted_at IS NULL
    ), '[]'::jsonb)
  );

  -- Record the patient viewing their own chart in each source clinic. Do not
  -- copy diagnoses or report contents into the audit log.
  FOR v_patient IN
    SELECT id, clinic_id FROM public.patients
    WHERE user_id = v_user AND deleted_at IS NULL
  LOOP
    INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
    VALUES (v_patient.clinic_id, v_user, 'patient', 'patient.portal_view', 'patient', v_patient.id);
  END LOOP;

  RETURN v_snapshot;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_patient_portal_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_patient_portal_snapshot() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_patient_attachment_path(p_attachment_id uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_path text; v_clinic uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT a.storage_path, a.clinic_id INTO v_path, v_clinic
  FROM public.attachments a
  JOIN public.patients p ON p.id = a.patient_id AND p.clinic_id = a.clinic_id
  WHERE a.id = p_attachment_id AND p.user_id = v_user
    AND p.deleted_at IS NULL AND a.deleted_at IS NULL;
  IF v_path IS NULL THEN RAISE EXCEPTION 'Attachment not found'; END IF;
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, 'patient', 'patient.attachment_access', 'attachment', p_attachment_id);
  RETURN v_path;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_patient_attachment_path(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_patient_attachment_path(uuid) TO authenticated;

-- A portal identity is linked to a clinic record only after clinic staff
-- review. The patient request itself returns the same response whether a
-- record matched or not, preventing file-number enumeration.
CREATE TABLE public.patient_portal_link_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id     uuid NOT NULL,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz,
  reviewed_by    uuid REFERENCES auth.users(id),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, patient_id, user_id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_patient_portal_links_pending ON public.patient_portal_link_requests (clinic_id, requested_at)
  WHERE status = 'pending';
ALTER TABLE public.patient_portal_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_portal_link_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_portal_link_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_patient_portal_link(
  p_clinic_slug text, p_file_number text, p_birth_date date
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_confirmed_at timestamptz;
  v_clinic uuid;
  v_patient uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT lower(u.email), u.email_confirmed_at INTO v_email, v_confirmed_at
    FROM auth.users u WHERE u.id = v_user;
  IF v_email IS NULL OR v_confirmed_at IS NULL THEN RETURN; END IF;

  SELECT c.id, p.id INTO v_clinic, v_patient
  FROM public.clinics c
  JOIN public.patients p ON p.clinic_id = c.id
  WHERE c.slug = lower(btrim(p_clinic_slug))
    AND p.file_number = btrim(p_file_number)
    AND p.birth_date = p_birth_date
    AND lower(p.email) = v_email
    AND p.deleted_at IS NULL
  LIMIT 1;
  IF v_patient IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.patients p WHERE p.id = v_patient AND p.clinic_id = v_clinic AND p.user_id = v_user) THEN RETURN; END IF;

  INSERT INTO public.patient_portal_link_requests (clinic_id, patient_id, user_id)
  VALUES (v_clinic, v_patient, v_user)
  ON CONFLICT (clinic_id, patient_id, user_id) DO UPDATE
    SET status = CASE WHEN patient_portal_link_requests.status = 'rejected' THEN 'pending' ELSE patient_portal_link_requests.status END,
        requested_at = CASE WHEN patient_portal_link_requests.status = 'rejected' THEN now() ELSE patient_portal_link_requests.requested_at END,
        reviewed_at = CASE WHEN patient_portal_link_requests.status = 'rejected' THEN NULL ELSE patient_portal_link_requests.reviewed_at END,
        reviewed_by = CASE WHEN patient_portal_link_requests.status = 'rejected' THEN NULL ELSE patient_portal_link_requests.reviewed_by END;
END;
$$;
REVOKE ALL ON FUNCTION public.request_patient_portal_link(text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_patient_portal_link(text, text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_patient_portal_link_requests_for_current_clinic()
RETURNS TABLE(id uuid, patient_name text, file_number text, requester_email text, requested_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT r.id, p.full_name, p.file_number, u.email, r.requested_at
  FROM public.patient_portal_link_requests r
  JOIN public.patients p ON p.id = r.patient_id AND p.clinic_id = r.clinic_id
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.clinic_id = app.current_clinic_id()
    AND r.status = 'pending'
    AND app.has_clinic_role(ARRAY['clinic_owner','clinic_admin','receptionist'])
  ORDER BY r.requested_at ASC;
$$;
REVOKE ALL ON FUNCTION public.list_patient_portal_link_requests_for_current_clinic() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_patient_portal_link_requests_for_current_clinic() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_patient_portal_link_request(p_request_id uuid, p_approve boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_patient uuid;
  v_linked_user uuid;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin','receptionist') THEN RAISE EXCEPTION 'Not allowed to review patient links'; END IF;

  SELECT r.patient_id, r.user_id INTO v_patient, v_linked_user
  FROM public.patient_portal_link_requests r
  WHERE r.id = p_request_id AND r.clinic_id = v_clinic AND r.status = 'pending'
  FOR UPDATE;
  IF v_patient IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;

  IF p_approve THEN
    IF EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.clinic_id = v_clinic AND p.user_id = v_linked_user AND p.id <> v_patient
    ) THEN RAISE EXCEPTION 'This account is already linked to a different patient record in this clinic'; END IF;
    UPDATE public.patients SET user_id = v_linked_user
    WHERE id = v_patient AND clinic_id = v_clinic AND deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Patient record not found'; END IF;
  END IF;

  UPDATE public.patient_portal_link_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(), reviewed_by = v_user
  WHERE id = p_request_id AND clinic_id = v_clinic;
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role,
          CASE WHEN p_approve THEN 'patient.portal_link_approved' ELSE 'patient.portal_link_rejected' END,
          'patient', v_patient);
END;
$$;
REVOKE ALL ON FUNCTION public.review_patient_portal_link_request(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_patient_portal_link_request(uuid, boolean) TO authenticated;

-- Supabase Storage adapter: all clinical objects are private, scoped by
-- clinic/patient UUIDs, and never served through a public bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-clinical', 'private-clinical', false, 20971520,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/dicom']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION app.can_read_clinical_object(p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT CASE
    WHEN p_path !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[A-Za-z0-9._-]{1,180}$' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.attachments a
      JOIN public.patients p ON p.id = a.patient_id AND p.clinic_id = a.clinic_id
      WHERE a.storage_path = p_path AND a.deleted_at IS NULL AND p.deleted_at IS NULL
        AND (
          p.user_id = auth.uid()
          OR (a.clinic_id = app.current_clinic_id()
              AND app.has_clinic_role(ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor','nurse']))
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION app.can_upload_clinical_object(p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT CASE
    WHEN p_path !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[A-Za-z0-9._-]{1,180}$' THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.clinic_id = split_part(p_path, '/', 1)::uuid
        AND p.id = split_part(p_path, '/', 2)::uuid
        AND p.deleted_at IS NULL
        AND p.clinic_id = app.current_clinic_id()
        AND app.has_clinic_role(ARRAY['clinic_owner','clinic_admin','doctor','visiting_doctor'])
    )
  END;
$$;

GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON FUNCTION app.can_read_clinical_object(text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.can_upload_clinical_object(text) TO authenticated;

DROP POLICY IF EXISTS "private_clinical_read_authorized" ON storage.objects;
CREATE POLICY "private_clinical_read_authorized" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'private-clinical' AND app.can_read_clinical_object(name));

DROP POLICY IF EXISTS "private_clinical_upload_authorized" ON storage.objects;
CREATE POLICY "private_clinical_upload_authorized" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'private-clinical' AND app.can_upload_clinical_object(name));

DROP POLICY IF EXISTS "private_clinical_delete_authorized" ON storage.objects;
CREATE POLICY "private_clinical_delete_authorized" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'private-clinical'
    AND app.can_upload_clinical_object(name)
    AND app.has_clinic_role(ARRAY['clinic_owner','clinic_admin']));

COMMENT ON FUNCTION public.get_my_patient_portal_snapshot() IS
  'Returns only records linked to the authenticated patient account; it does not use a caller-supplied patient or clinic ID.';
