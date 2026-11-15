-- =============================================================================
-- Al-Mada / Migration 0011 — Packages, Inventory & Doctor Commissions (Phase 3B)
-- Target: PostgreSQL 15+ / Supabase
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Inventory tables (Supplies & Movements)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name              text NOT NULL,
  sku               text,
  category          text NOT NULL DEFAULT 'supplies' CHECK (category IN ('supplies','medication','consumables','equipment')),
  unit              text NOT NULL DEFAULT 'piece',
  quantity_on_hand  numeric(12,2) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_level     numeric(12,2) NOT NULL DEFAULT 5,
  cost_price        numeric(12,2) NOT NULL DEFAULT 0,
  selling_price     numeric(12,2) NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (clinic_id, id)
);
CREATE INDEX IF NOT EXISTS idx_inv_items_clinic ON public.inventory_items (clinic_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_id         uuid NOT NULL,
  movement_type   text NOT NULL CHECK (movement_type IN ('in_purchase','out_clinical','out_expired','adjustment')),
  quantity        numeric(12,2) NOT NULL CHECK (quantity > 0),
  unit_cost       numeric(12,2) NOT NULL DEFAULT 0,
  reference_id    uuid,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (item_id, clinic_id) REFERENCES public.inventory_items(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inv_mov_item ON public.inventory_movements (clinic_id, item_id, created_at DESC);

-- Enable RLS on inventory tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_sel ON public.inventory_items
  FOR SELECT TO authenticated
  USING (clinic_id = app.current_clinic_id());

CREATE POLICY inventory_movements_sel ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (clinic_id = app.current_clinic_id());

-- -----------------------------------------------------------------------------
-- 2. RPC: Create patient treatment package
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_patient_package_for_current_user(
  p_patient_id uuid,
  p_name text,
  p_total_sessions integer,
  p_price numeric DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_valid_until date DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_pkg_id uuid;
  v_name text := btrim(p_name);
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF v_role NOT IN ('clinic_owner', 'clinic_admin', 'receptionist', 'doctor', 'accountant') THEN
    RAISE EXCEPTION 'Not authorized to create patient packages';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'Package name must be between 2 and 160 characters';
  END IF;
  IF p_total_sessions <= 0 THEN
    RAISE EXCEPTION 'Total sessions must be greater than zero';
  END IF;

  INSERT INTO public.patient_packages (
    clinic_id, patient_id, name, total_sessions, used_sessions,
    price, valid_from, valid_until, is_active, notes
  ) VALUES (
    v_clinic, p_patient_id, v_name, p_total_sessions, 0,
    COALESCE(p_price, 0), CURRENT_DATE, p_valid_until, true, NULLIF(btrim(p_notes), '')
  ) RETURNING id INTO v_pkg_id;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'package.created', 'patient_package', v_pkg_id);

  RETURN v_pkg_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_patient_package_for_current_user(uuid, text, integer, numeric, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_patient_package_for_current_user(uuid, text, integer, numeric, text, date) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: Consume a session from a package
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_package_session_for_current_user(
  p_package_id uuid,
  p_appointment_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_pkg record;
  v_remaining integer;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;

  SELECT id, patient_id, total_sessions, used_sessions, is_active INTO v_pkg
  FROM public.patient_packages
  WHERE id = p_package_id AND clinic_id = v_clinic AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found';
  END IF;
  IF NOT v_pkg.is_active THEN
    RAISE EXCEPTION 'Package is no longer active';
  END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RAISE EXCEPTION 'Package sessions are already exhausted';
  END IF;

  INSERT INTO public.package_sessions (
    clinic_id, package_id, patient_id, appointment_id, used_at
  ) VALUES (
    v_clinic, p_package_id, v_pkg.patient_id, p_appointment_id, now()
  );

  v_remaining := v_pkg.total_sessions - (v_pkg.used_sessions + 1);

  IF v_remaining <= 0 THEN
    UPDATE public.patient_packages SET is_active = false WHERE id = p_package_id AND clinic_id = v_clinic;
  END IF;

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'package.session_consumed', 'patient_package', p_package_id);

  RETURN v_remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_package_session_for_current_user(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_package_session_for_current_user(uuid, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: Record Inventory Movement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_inventory_movement_for_current_user(
  p_item_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_unit_cost numeric DEFAULT 0,
  p_notes text DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clinic uuid := app.current_clinic_id();
  v_role text := app.current_role();
  v_current_qty numeric;
  v_new_qty numeric;
BEGIN
  IF v_user IS NULL OR v_clinic IS NULL THEN
    RAISE EXCEPTION 'Authenticated clinic membership required';
  END IF;
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Movement quantity must be greater than zero';
  END IF;
  IF p_movement_type NOT IN ('in_purchase','out_clinical','out_expired','adjustment') THEN
    RAISE EXCEPTION 'Invalid inventory movement type';
  END IF;

  SELECT quantity_on_hand INTO v_current_qty
  FROM public.inventory_items
  WHERE id = p_item_id AND clinic_id = v_clinic AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  IF p_movement_type = 'in_purchase' THEN
    v_new_qty := v_current_qty + p_quantity;
  ELSIF p_movement_type IN ('out_clinical', 'out_expired') THEN
    IF v_current_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock on hand (available: %)', v_current_qty;
    END IF;
    v_new_qty := v_current_qty - p_quantity;
  ELSE -- adjustment
    v_new_qty := p_quantity;
  END IF;

  UPDATE public.inventory_items
  SET quantity_on_hand = v_new_qty, updated_at = now()
  WHERE id = p_item_id AND clinic_id = v_clinic;

  INSERT INTO public.inventory_movements (
    clinic_id, item_id, movement_type, quantity, unit_cost, notes, created_by
  ) VALUES (
    v_clinic, p_item_id, p_movement_type, p_quantity, COALESCE(p_unit_cost, 0), NULLIF(btrim(p_notes), ''), v_user
  );

  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id)
  VALUES (v_clinic, v_user, v_role, 'inventory.movement', 'inventory_item', p_item_id);

  RETURN v_new_qty;
END;
$$;
REVOKE ALL ON FUNCTION public.record_inventory_movement_for_current_user(uuid, text, numeric, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_inventory_movement_for_current_user(uuid, text, numeric, numeric, text) TO authenticated;
