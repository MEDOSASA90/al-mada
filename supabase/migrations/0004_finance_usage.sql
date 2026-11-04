-- =============================================================================
-- Al-Mada / Migration M4 — Finance, Usage & API Keys
-- invoices, invoice_items, payment_transactions, refunds, settlements,
-- cash_movements, clinic_expenses, shifts, usage_events,
-- usage_monthly_aggregates, api_keys
-- =============================================================================

-- =============================================================================
-- 1. invoices
-- =============================================================================
CREATE TABLE public.invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id      uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  patient_id     uuid,
  appointment_id uuid,
  invoice_number text NOT NULL,
  invoice_type   text NOT NULL DEFAULT 'service' CHECK (invoice_type IN ('service','package','lab','imaging','procedure')),
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','issued','partially_paid','paid','overdue','cancelled','refunded')),
  subtotal       numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  tax_total      numeric(12,2) NOT NULL DEFAULT 0,
  total          numeric(12,2) NOT NULL DEFAULT 0,
  paid_total     numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'EGP',
  issued_at      timestamptz,
  due_at         date,
  paid_at        timestamptz,
  notes          text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  UNIQUE (clinic_id, invoice_number),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id, clinic_id) REFERENCES public.appointments(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_invoices_clinic_status ON public.invoices (clinic_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_patient       ON public.invoices (clinic_id, patient_id, created_at DESC);

-- =============================================================================
-- 2. invoice_items
-- =============================================================================
CREATE TABLE public.invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  invoice_id   uuid NOT NULL,
  item_type    text NOT NULL DEFAULT 'service',
  description  text NOT NULL,
  quantity     numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  line_total   numeric(12,2) NOT NULL DEFAULT 0,
  staff_id     uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (invoice_id, clinic_id) REFERENCES public.invoices(id, clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id, clinic_id) REFERENCES public.staff_profiles(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_inv_items_invoice ON public.invoice_items (clinic_id, invoice_id);

-- =============================================================================
-- 3. payment_transactions
-- =============================================================================
CREATE TABLE public.payment_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  invoice_id     uuid,
  patient_id     uuid,
  amount         numeric(12,2) NOT NULL CHECK (amount > 0),
  currency       text NOT NULL DEFAULT 'EGP',
  method         text NOT NULL DEFAULT 'cash'
                 CHECK (method IN ('cash','card','wallet','insurance','transfer','online')),
  reference_no   text,
  status         text NOT NULL DEFAULT 'completed'
                 CHECK (status IN ('pending','completed','failed','reversed')),
  idempotency_key text UNIQUE,
  received_by    uuid REFERENCES auth.users(id),
  paid_at        timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (invoice_id, clinic_id) REFERENCES public.invoices(id, clinic_id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id, clinic_id) REFERENCES public.patients(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_payments_clinic_date ON public.payment_transactions (clinic_id, paid_at DESC);
CREATE INDEX idx_payments_invoice      ON public.payment_transactions (clinic_id, invoice_id);

-- =============================================================================
-- 4. refunds
-- =============================================================================
CREATE TABLE public.refunds (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id            uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  invoice_id           uuid NOT NULL,
  payment_transaction_id uuid,
  amount               numeric(12,2) NOT NULL CHECK (amount > 0),
  currency             text NOT NULL DEFAULT 'EGP',
  reason               text NOT NULL,
  status               text NOT NULL DEFAULT 'requested'
                       CHECK (status IN ('requested','approved','rejected','paid')),
  requested_by         uuid REFERENCES auth.users(id),
  approved_by          uuid REFERENCES auth.users(id),
  paid_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (invoice_id, clinic_id) REFERENCES public.invoices(id, clinic_id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_transaction_id, clinic_id) REFERENCES public.payment_transactions(id, clinic_id) ON DELETE SET NULL
);
CREATE INDEX idx_refunds_clinic ON public.refunds (clinic_id, created_at DESC);

-- =============================================================================
-- 5. settlements
-- =============================================================================
CREATE TABLE public.settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  gross_amount    numeric(12,2) NOT NULL DEFAULT 0,
  commission_pct  numeric(5,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  net_amount      numeric(12,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'EGP',
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending','approved','paid')),
  staff_id        uuid,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, staff_id, period_start, period_end),
  FOREIGN KEY (staff_id, clinic_id) REFERENCES public.staff_profiles(id, clinic_id) ON DELETE SET NULL
);

-- =============================================================================
-- 6. cash_movements (cash box in/out)
-- =============================================================================
CREATE TABLE public.cash_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id     uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  direction     text NOT NULL CHECK (direction IN ('in','out')),
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  category      text NOT NULL,
  reference_type text,
  reference_id  uuid,
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_cash_clinic_date ON public.cash_movements (clinic_id, created_at DESC);

-- =============================================================================
-- 7. clinic_expenses
-- =============================================================================
CREATE TABLE public.clinic_expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id     uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  category      text NOT NULL,
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  currency      text NOT NULL DEFAULT 'EGP',
  vendor        text,
  expense_date  date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash',
  receipt_url   text,
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_expenses_clinic_date ON public.clinic_expenses (clinic_id, expense_date DESC);

-- =============================================================================
-- 8. shifts (cashier shifts)
-- =============================================================================
CREATE TABLE public.shifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id    uuid REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at    timestamptz NOT NULL DEFAULT now(),
  closed_at    timestamptz,
  opening_cash numeric(12,2) NOT NULL DEFAULT 0,
  closing_cash numeric(12,2),
  expected_cash numeric(12,2),
  difference   numeric(12,2),
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_shifts_open ON public.shifts (clinic_id, opened_at DESC) WHERE status = 'open';

-- =============================================================================
-- 9. usage_events
-- =============================================================================
CREATE TABLE public.usage_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric         text NOT NULL,
  quantity       numeric(12,4) NOT NULL DEFAULT 1,
  unit           text NOT NULL DEFAULT 'count',
  cost_amount    numeric(12,6) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'EGP',
  source         text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_usage_clinic_month ON public.usage_events (clinic_id, occurred_at DESC);
CREATE INDEX idx_usage_metric       ON public.usage_events (metric, occurred_at DESC);

-- =============================================================================
-- 10. usage_monthly_aggregates
-- =============================================================================
CREATE TABLE public.usage_monthly_aggregates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  year         smallint NOT NULL,
  month        smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  metric       text NOT NULL,
  total_quantity numeric(18,4) NOT NULL DEFAULT 0,
  total_cost   numeric(14,6) NOT NULL DEFAULT 0,
  currency     text NOT NULL DEFAULT 'EGP',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, year, month, metric),
  UNIQUE (clinic_id, id)
);

-- =============================================================================
-- 11. api_keys (per-clinic integration keys)
-- =============================================================================
CREATE TABLE public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_prefix    text NOT NULL,
  key_hash      text NOT NULL,
  scopes        jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, key_prefix)
);

-- =============================================================================
-- RLS
-- =============================================================================
SELECT app.enable_rls_clinic('invoices');
SELECT app.enable_rls_clinic('invoice_items');
SELECT app.enable_rls_clinic('payment_transactions');
SELECT app.enable_rls_clinic('refunds');
SELECT app.enable_rls_clinic('settlements');
SELECT app.enable_rls_clinic('cash_movements');
SELECT app.enable_rls_clinic('clinic_expenses');
SELECT app.enable_rls_clinic('shifts');
SELECT app.enable_rls_clinic('usage_events');
SELECT app.enable_rls_clinic('usage_monthly_aggregates');
SELECT app.enable_rls_clinic('api_keys');

-- api_keys: only clinic admins can read; the key_hash must never be exposed
DROP POLICY IF EXISTS api_keys_sel ON public.api_keys;
CREATE POLICY api_keys_sel ON public.api_keys FOR SELECT TO authenticated USING (
  clinic_id = app.current_clinic_id()
  AND app.current_role() IN ('super_admin','clinic_owner','clinic_admin')
);

-- finance tables: accountants + admins only (beyond clinic scoping)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['invoices','invoice_items','payment_transactions','refunds','settlements','cash_movements','clinic_expenses','shifts'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_sel', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (clinic_id = app.current_clinic_id() AND app.current_role() IN (''super_admin'',''clinic_owner'',''clinic_admin'',''accountant'',''receptionist''))',
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
  FOREACH t IN ARRAY ARRAY['invoices','settlements','clinic_expenses','shifts','usage_monthly_aggregates'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- invoice totals recalc
CREATE OR REPLACE FUNCTION app.recalc_invoice_totals() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_inv uuid; v_clinic uuid;
BEGIN
  v_inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  v_clinic := COALESCE(NEW.clinic_id, OLD.clinic_id);

  UPDATE public.invoices i
     SET subtotal = COALESCE((SELECT sum(line_total) FROM public.invoice_items WHERE invoice_id = v_inv), 0),
         total = COALESCE((SELECT sum(line_total) FROM public.invoice_items WHERE invoice_id = v_inv), 0)
                 - i.discount_total + i.tax_total,
         paid_total = COALESCE((SELECT sum(amount) FROM public.payment_transactions
                                 WHERE invoice_id = v_inv AND status = 'completed'), 0),
         status = CASE
           WHEN i.status IN ('cancelled','refunded') THEN i.status
           WHEN COALESCE((SELECT sum(amount) FROM public.payment_transactions
                          WHERE invoice_id = v_inv AND status = 'completed'), 0)
                >= COALESCE((SELECT sum(line_total) FROM public.invoice_items WHERE invoice_id = v_inv), 0)
                - i.discount_total + i.tax_total
                THEN 'paid'
           WHEN COALESCE((SELECT sum(amount) FROM public.payment_transactions
                          WHERE invoice_id = v_inv AND status = 'completed'), 0) > 0
                THEN 'partially_paid'
           ELSE i.status
         END
   WHERE i.id = v_inv AND i.clinic_id = v_clinic;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_invitems_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION app.recalc_invoice_totals();
CREATE TRIGGER trg_payments_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION app.recalc_invoice_totals();

-- next invoice number per clinic
CREATE OR REPLACE FUNCTION app.set_invoice_number() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_next integer;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '\D', '', 'g'), '')::integer), 0) + 1
      INTO v_next
    FROM public.invoices WHERE clinic_id = NEW.clinic_id;
    NEW.invoice_number := 'INV-' || LPAD(v_next::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_invoices_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION app.set_invoice_number();
