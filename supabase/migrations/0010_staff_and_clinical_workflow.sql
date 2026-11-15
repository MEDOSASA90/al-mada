-- =============================================================================
-- Al-Mada / Migration 0010 — Staff, Clinical Records, Invoicing & Queue Workflow
-- Safe forward-only additions for single-doctor and center operations (Phase 3A)
-- Target: PostgreSQL 15+ / Supabase
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create doctor/staff profile within current clinic
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_doctor_for_current_user(
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_specialty_id uuid DEFAULT NULL,
  p_license_number text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_doctor_id uuid;
  v_name text := btrim(p_full_name);
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin') THEN
    RAISE EXCEPTION 'Only clinic owners or admins can register doctors';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'Doctor name must be 2 to 160 characters';
  END IF;

  INSERT INTO public.staff_profiles (
    clinic_id, full_name, phone, email, role, specialty_id, license_number, is_active
  ) VALUES (
    v_clinic, v_name, NULLIF(btrim(p_phone), ''), NULLIF(btrim(p_email), ''),
    'doctor'::user_role, p_specialty_id, NULLIF(btrim(p_license_number), ''), true
  ) RETURNING id INTO v_doctor_id;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'doctor.created', 'staff_profile', v_doctor_id);

  RETURN v_doctor_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_doctor_for_current_user(text, text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_doctor_for_current_user(text, text, text, uuid, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Create or update medical record for an appointment / patient visit
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_medical_record_for_current_user(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_appointment_id uuid DEFAULT NULL,
  p_chief_complaint text DEFAULT NULL,
  p_diagnosis text DEFAULT NULL,
  p_treatment_plan text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_vitals jsonb DEFAULT '{}'::jsonb,
  p_record_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_id uuid := p_record_id;
  v_locked boolean;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'doctor', 'visiting_doctor') THEN
    RAISE EXCEPTION 'Not authorized to record clinical notes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_patient_id AND clinic_id = v_clinic AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Active patient not found in this clinic';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT is_locked INTO v_locked FROM public.medical_records
    WHERE id = v_id AND clinic_id = v_clinic AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Medical record not found';
    END IF;
    IF v_locked THEN
      RAISE EXCEPTION 'Locked medical record cannot be modified directly';
    END IF;

    UPDATE public.medical_records
    SET chief_complaint = NULLIF(btrim(p_chief_complaint), ''),
        diagnosis = NULLIF(btrim(p_diagnosis), ''),
        treatment_plan = NULLIF(btrim(p_treatment_plan), ''),
        notes = NULLIF(btrim(p_notes), ''),
        vitals = COALESCE(p_vitals, '{}'::jsonb),
        doctor_id = p_doctor_id,
        appointment_id = p_appointment_id,
        updated_at = now()
    WHERE id = v_id AND clinic_id = v_clinic;

    INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
    VALUES (v_clinic, v_user, v_role, 'medical_record.updated', 'medical_record', v_id);
  ELSE
    INSERT INTO public.medical_records (
      clinic_id, patient_id, appointment_id, doctor_id,
      chief_complaint, diagnosis, treatment_plan, notes, vitals,
      status, is_locked, created_by
    ) VALUES (
      v_clinic, p_patient_id, p_appointment_id, p_doctor_id,
      NULLIF(btrim(p_chief_complaint), ''), NULLIF(btrim(p_diagnosis), ''),
      NULLIF(btrim(p_treatment_plan), ''), NULLIF(btrim(p_notes), ''),
      COALESCE(p_vitals, '{}'::jsonb), 'draft', false, v_user
    ) RETURNING id INTO v_id;

    -- If linked to an appointment, mark appointment as in_progress or completed
    IF p_appointment_id IS NOT NULL THEN
      UPDATE public.appointments
      SET status = CASE WHEN status IN ('booked', 'confirmed', 'waiting') THEN 'in_progress' ELSE status END
      WHERE id = p_appointment_id AND clinic_id = v_clinic;
    END IF;

    INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
    VALUES (v_clinic, v_user, v_role, 'medical_record.created', 'medical_record', v_id);
  END IF;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_medical_record_for_current_user(uuid, uuid, uuid, text, text, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_medical_record_for_current_user(uuid, uuid, uuid, text, text, text, text, jsonb, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Lock/finalize medical record (immutable version)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_medical_record_for_current_user(p_record_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_appt_id uuid;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'doctor', 'visiting_doctor') THEN
    RAISE EXCEPTION 'Not authorized to lock medical records';
  END IF;

  UPDATE public.medical_records
  SET is_locked = true,
      status = 'locked',
      confirmed_by = v_user,
      confirmed_at = now(),
      updated_at = now()
  WHERE id = p_record_id AND clinic_id = v_clinic AND deleted_at IS NULL
  RETURNING appointment_id INTO v_appt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medical record not found or already deleted';
  END IF;

  IF v_appt_id IS NOT NULL THEN
    UPDATE public.appointments
    SET status = 'completed', completed_at = now()
    WHERE id = v_appt_id AND clinic_id = v_clinic AND status = 'in_progress';
  END IF;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'medical_record.locked', 'medical_record', p_record_id);
END;
$$;
REVOKE ALL ON FUNCTION public.lock_medical_record_for_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_medical_record_for_current_user(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Create invoice with line items
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_invoice_for_current_user(
  p_patient_id uuid,
  p_appointment_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_discount_total numeric DEFAULT 0,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_invoice_id uuid;
  v_invoice_num text;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_item record;
  v_seq integer;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist') THEN
    RAISE EXCEPTION 'Not authorized to create invoices';
  END IF;

  SELECT count(*) + 1 INTO v_seq FROM public.invoices WHERE clinic_id = v_clinic;
  v_invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

  -- Calculate subtotal from jsonb items array
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    description text, quantity numeric, unit_price numeric
  ) LOOP
    v_subtotal := v_subtotal + (COALESCE(v_item.quantity, 1) * COALESCE(v_item.unit_price, 0));
  END LOOP;

  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount_total, 0));

  INSERT INTO public.invoices (
    clinic_id, branch_id, patient_id, appointment_id,
    invoice_number, invoice_type, status, subtotal, discount_total,
    total, paid_total, issued_at, notes, created_by
  ) VALUES (
    v_clinic, p_branch_id, p_patient_id, p_appointment_id,
    v_invoice_num, 'service', 'issued', v_subtotal, COALESCE(p_discount_total, 0),
    v_total, 0, now(), NULLIF(btrim(p_notes), ''), v_user
  ) RETURNING id INTO v_invoice_id;

  -- Insert invoice items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    description text, quantity numeric, unit_price numeric
  ) LOOP
    INSERT INTO public.invoice_items (
      clinic_id, invoice_id, item_type, description, quantity, unit_price, line_total
    ) VALUES (
      v_clinic, v_invoice_id, 'service', v_item.description,
      COALESCE(v_item.quantity, 1), COALESCE(v_item.unit_price, 0),
      (COALESCE(v_item.quantity, 1) * COALESCE(v_item.unit_price, 0))
    );
  END LOOP;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'invoice.created', 'invoice', v_invoice_id);

  RETURN v_invoice_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_invoice_for_current_user(uuid, uuid, uuid, jsonb, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_for_current_user(uuid, uuid, uuid, jsonb, numeric, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Record payment for an invoice
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment_for_current_user(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text DEFAULT 'cash',
  p_reference_no text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_payment_id uuid;
  v_invoice record;
  v_new_paid numeric(12,2);
  v_new_status text;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'accountant', 'receptionist') THEN
    RAISE EXCEPTION 'Not authorized to record payments';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  IF p_method NOT IN ('cash', 'card', 'wallet', 'insurance', 'transfer', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  SELECT id, total, paid_total, status, patient_id INTO v_invoice
  FROM public.invoices WHERE id = p_invoice_id AND clinic_id = v_clinic AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  v_new_paid := v_invoice.paid_total + p_amount;
  IF v_new_paid >= v_invoice.total THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partially_paid';
  END IF;

  INSERT INTO public.payment_transactions (
    clinic_id, invoice_id, patient_id, amount, currency, method, reference_no, status, received_by
  ) VALUES (
    v_clinic, p_invoice_id, v_invoice.patient_id, p_amount, 'EGP', p_method,
    NULLIF(btrim(p_reference_no), ''), 'completed', v_user
  ) RETURNING id INTO v_payment_id;

  UPDATE public.invoices
  SET paid_total = v_new_paid,
      status = v_new_status,
      paid_at = CASE WHEN v_new_status = 'paid' THEN now() ELSE paid_at END,
      updated_at = now()
  WHERE id = p_invoice_id AND clinic_id = v_clinic;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'payment.recorded', 'payment_transaction', v_payment_id);

  RETURN v_payment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_payment_for_current_user(uuid, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_for_current_user(uuid, numeric, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Queue ticket workflow (Daily ticket numbering & Calling)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_queue_ticket_for_appointment(p_appointment_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_appt record;
  v_next_num integer;
  v_ticket_id uuid;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'receptionist', 'nurse', 'doctor') THEN
    RAISE EXCEPTION 'Not authorized to issue queue tickets';
  END IF;

  SELECT id, patient_id, doctor_id, branch_id INTO v_appt
  FROM public.appointments WHERE id = p_appointment_id AND clinic_id = v_clinic AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Atomic daily ticket sequence per clinic
  SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO v_next_num
  FROM public.queue_tickets
  WHERE clinic_id = v_clinic AND created_at >= CURRENT_DATE;

  INSERT INTO public.queue_tickets (
    clinic_id, branch_id, appointment_id, patient_id, doctor_id,
    ticket_number, status
  ) VALUES (
    v_clinic, v_appt.branch_id, p_appointment_id, v_appt.patient_id, v_appt.doctor_id,
    v_next_num, 'waiting'
  ) RETURNING id INTO v_ticket_id;

  UPDATE public.appointments
  SET status = 'waiting'
  WHERE id = p_appointment_id AND clinic_id = v_clinic;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'queue.ticket_issued', 'queue_ticket', v_ticket_id);

  RETURN v_next_num;
END;
$$;
REVOKE ALL ON FUNCTION public.issue_queue_ticket_for_appointment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_queue_ticket_for_appointment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.advance_queue_ticket_status(p_ticket_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'receptionist', 'nurse', 'doctor') THEN
    RAISE EXCEPTION 'Not authorized to update queue tickets';
  END IF;
  IF p_new_status NOT IN ('called', 'in_service', 'done', 'skipped', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid ticket status';
  END IF;

  UPDATE public.queue_tickets
  SET status = p_new_status,
      called_at = CASE WHEN p_new_status = 'called' THEN now() ELSE called_at END,
      served_at = CASE WHEN p_new_status = 'in_service' THEN now() ELSE served_at END,
      completed_at = CASE WHEN p_new_status IN ('done', 'skipped', 'cancelled') THEN now() ELSE completed_at END,
      updated_at = now()
  WHERE id = p_ticket_id AND clinic_id = v_clinic;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.advance_queue_ticket_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_queue_ticket_status(uuid, text) TO authenticated;
