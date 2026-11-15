-- Audited, clinic-derived appointment booking and status transitions.
-- All slot checks are serialized per doctor/day to prevent overlapping bookings.

CREATE OR REPLACE FUNCTION public.create_appointment_for_current_user(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer DEFAULT 30,
  p_visit_type text DEFAULT 'clinic',
  p_reason text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_id uuid;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist') THEN
    RAISE EXCEPTION 'Not allowed to book appointments';
  END IF;
  IF p_duration_minutes IS NULL OR p_duration_minutes NOT BETWEEN 5 AND 240 THEN
    RAISE EXCEPTION 'Appointment duration must be between 5 and 240 minutes';
  END IF;
  IF p_visit_type NOT IN ('clinic','telemedicine','home','emergency') THEN RAISE EXCEPTION 'Invalid visit type'; END IF;
  IF p_reason IS NOT NULL AND length(btrim(p_reason)) > 500 THEN RAISE EXCEPTION 'Reason is too long'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.patients p WHERE p.id = p_patient_id AND p.clinic_id = v_clinic AND p.deleted_at IS NULL AND p.is_active) THEN
    RAISE EXCEPTION 'Active patient record not found in this clinic';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.id = p_doctor_id AND s.clinic_id = v_clinic AND s.deleted_at IS NULL AND s.is_active AND s.role::text IN ('doctor','visiting_doctor')) THEN
    RAISE EXCEPTION 'Active doctor not found in this clinic';
  END IF;
  IF p_branch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clinic_branches b WHERE b.id = p_branch_id AND b.clinic_id = v_clinic AND b.deleted_at IS NULL AND b.is_active) THEN
    RAISE EXCEPTION 'Active branch not found in this clinic';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_doctor_id::text || p_appointment_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.clinic_id = v_clinic AND a.doctor_id = p_doctor_id AND a.appointment_date = p_appointment_date
      AND a.deleted_at IS NULL AND a.status IN ('booked','confirmed','waiting','in_progress')
      AND p_appointment_time < a.appointment_time + make_interval(mins => a.duration_minutes)
      AND a.appointment_time < p_appointment_time + make_interval(mins => p_duration_minutes)
  ) THEN RAISE EXCEPTION 'Doctor already has an overlapping appointment'; END IF;

  INSERT INTO public.appointments (
    clinic_id, branch_id, patient_id, doctor_id, appointment_date,
    appointment_time, duration_minutes, visit_type, reason, created_by, status
  ) VALUES (
    v_clinic, p_branch_id, p_patient_id, p_doctor_id, p_appointment_date,
    p_appointment_time, p_duration_minutes, p_visit_type, NULLIF(btrim(p_reason), ''), v_user, 'booked'
  ) RETURNING id INTO v_id;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'appointment.booked', 'appointment', v_id);
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_appointment_for_current_user(uuid, uuid, date, time, integer, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_appointment_for_current_user(uuid, uuid, date, time, integer, text, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.change_appointment_status_for_current_user(
  p_appointment_id uuid, p_new_status text, p_cancel_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_old_status text;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN RAISE EXCEPTION 'Authenticated clinic membership required'; END IF;
  IF v_role NOT IN ('clinic_owner','clinic_admin','doctor','visiting_doctor','receptionist') THEN RAISE EXCEPTION 'Not allowed to change appointment status'; END IF;
  IF p_new_status NOT IN ('confirmed','canceled','no_show') THEN RAISE EXCEPTION 'Unsupported appointment status transition'; END IF;
  IF p_new_status = 'canceled' AND p_cancel_reason IS NOT NULL AND length(btrim(p_cancel_reason)) > 300 THEN RAISE EXCEPTION 'Cancellation reason is too long'; END IF;

  SELECT a.status INTO v_old_status FROM public.appointments a
    WHERE a.id = p_appointment_id AND a.clinic_id = v_clinic AND a.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found'; END IF;
  IF p_new_status = 'confirmed' AND v_old_status <> 'booked' THEN RAISE EXCEPTION 'Only booked appointments can be confirmed'; END IF;
  IF p_new_status = 'canceled' AND v_old_status NOT IN ('booked','confirmed','waiting') THEN RAISE EXCEPTION 'Appointment cannot be canceled in its current state'; END IF;
  IF p_new_status = 'no_show' AND v_old_status NOT IN ('booked','confirmed','waiting') THEN RAISE EXCEPTION 'Appointment cannot be marked no-show in its current state'; END IF;

  UPDATE public.appointments
  SET status = p_new_status,
      confirmed_at = CASE WHEN p_new_status = 'confirmed' THEN now() ELSE confirmed_at END,
      canceled_at = CASE WHEN p_new_status = 'canceled' THEN now() ELSE canceled_at END,
      cancel_reason = CASE WHEN p_new_status = 'canceled' THEN NULLIF(btrim(p_cancel_reason), '') ELSE cancel_reason END
  WHERE id = p_appointment_id AND clinic_id = v_clinic;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'appointment.' || p_new_status, 'appointment', p_appointment_id);
END;
$$;
REVOKE ALL ON FUNCTION public.change_appointment_status_for_current_user(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_appointment_status_for_current_user(uuid, text, text) TO authenticated;

-- Appointment writes now go through validated RPCs so client input cannot set
-- another tenant, forge actor fields, or bypass overlap protection.
REVOKE INSERT, UPDATE, DELETE ON public.appointments FROM authenticated;

COMMENT ON FUNCTION public.create_appointment_for_current_user(uuid, uuid, date, time, integer, text, text, uuid) IS
  'Creates an appointment within the authenticated user active clinic, validates patient/doctor/branch ownership, prevents overlapping slots, and appends an audit event.';
