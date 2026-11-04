-- =============================================================================
-- Al-Mada / Migration M1 — Core Platform
-- plans, subscriptions, profiles, clinics, branches, specialties,
-- permissions, role_permissions, memberships, feature_flags, audit_logs, clinics_meta
-- Target: PostgreSQL 15+ / Supabase — forward-only
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- schema for app helpers ----------
CREATE SCHEMA IF NOT EXISTS app;

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM (
  'super_admin', 'clinic_owner', 'clinic_admin', 'doctor', 'nurse',
  'receptionist', 'accountant', 'inventory_manager', 'support_agent',
  'integration_service', 'patient'
);

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'paused'
);

-- =============================================================================
-- 1. subscription_plans (platform level)
-- =============================================================================
CREATE TABLE public.subscription_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,
  name_ar          text NOT NULL,
  name_en          text NOT NULL,
  price_monthly    numeric(12,2) NOT NULL DEFAULT 0,
  price_yearly     numeric(12,2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'EGP',
  max_branches     integer NOT NULL DEFAULT 1,
  max_doctors      integer NOT NULL DEFAULT 1,
  max_staff        integer NOT NULL DEFAULT 5,
  max_patients     integer NOT NULL DEFAULT 100,
  ai_quota_monthly integer NOT NULL DEFAULT 0,
  features         jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans (is_active);

-- =============================================================================
-- 2. profiles (1:1 with auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text NOT NULL,
  phone               text,
  avatar_url          text,
  locale              text NOT NULL DEFAULT 'ar',
  timezone            text NOT NULL DEFAULT 'Africa/Cairo',
  is_platform_admin   boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);
CREATE INDEX idx_profiles_phone ON public.profiles (phone) WHERE phone IS NOT NULL;

-- =============================================================================
-- 3. clinics (tenant root)
-- =============================================================================
CREATE TABLE public.clinics (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  name_ar              text,
  slug                 text NOT NULL UNIQUE,
  plan_id              uuid REFERENCES public.subscription_plans(id),
  subscription_status  subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at        timestamptz,
  is_active            boolean NOT NULL DEFAULT true,
  logo_url             text,
  address              text,
  city                 text,
  governorate          text,
  phone                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_clinics_active ON public.clinics (is_active) WHERE is_active;

-- =============================================================================
-- 4. clinic_branches
-- =============================================================================
CREATE TABLE public.clinic_branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name        text NOT NULL,
  name_ar     text,
  code        text,
  address     text,
  phone       text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id),
  UNIQUE (clinic_id, id),
  UNIQUE (clinic_id, name)
);
CREATE INDEX idx_clinic_branches_clinic ON public.clinic_branches (clinic_id);

-- =============================================================================
-- 5. specialties
-- =============================================================================
CREATE TABLE public.specialties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  icon        text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. permissions (RBAC)
-- =============================================================================
CREATE TABLE public.permissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  resource     text NOT NULL,
  action       text NOT NULL,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, action)
);
CREATE INDEX idx_permissions_resource ON public.permissions (resource);

-- =============================================================================
-- 7. role_permissions
-- =============================================================================
CREATE TABLE public.role_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);
CREATE INDEX idx_role_permissions_role ON public.role_permissions (role);

-- =============================================================================
-- 8. user_clinic_memberships
-- =============================================================================
CREATE TABLE public.user_clinic_memberships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'patient',
  is_primary   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  branch_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  employee_id  text,
  specialty_id uuid REFERENCES public.specialties(id),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (clinic_id, user_id),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_memberships_user ON public.user_clinic_memberships (user_id) WHERE is_active;
CREATE INDEX idx_memberships_clinic ON public.user_clinic_memberships (clinic_id) WHERE is_active;

-- =============================================================================
-- 9. membership_branch_scopes
-- =============================================================================
CREATE TABLE public.membership_branch_scopes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL,
  branch_id     uuid NOT NULL REFERENCES public.clinic_branches(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, branch_id),
  FOREIGN KEY (membership_id, clinic_id) REFERENCES public.user_clinic_memberships(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_mbs_clinic ON public.membership_branch_scopes (clinic_id);

-- =============================================================================
-- 10. clinics_meta (JSONB settings)
-- =============================================================================
CREATE TABLE public.clinics_meta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);

-- =============================================================================
-- 11. feature_flags
-- =============================================================================
CREATE TABLE public.feature_flags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,
  description  text,
  is_enabled   boolean NOT NULL DEFAULT false,
  rollout_pct  integer NOT NULL DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 12. clinic_feature_overrides
-- =============================================================================
CREATE TABLE public.clinic_feature_overrides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  flag_key     text NOT NULL REFERENCES public.feature_flags(key) ON DELETE CASCADE,
  is_enabled   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, flag_key)
);

-- =============================================================================
-- 13. subscriptions
-- =============================================================================
CREATE TABLE public.subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id              uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  plan_id                uuid NOT NULL REFERENCES public.subscription_plans(id),
  status                 subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle          text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  current_period_start   timestamptz NOT NULL DEFAULT now(),
  current_period_end     timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  canceled_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_subscriptions_clinic ON public.subscriptions (clinic_id);

-- =============================================================================
-- 14. subscription_invoices
-- =============================================================================
CREATE TABLE public.subscription_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  number          text NOT NULL,
  amount          numeric(12,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'EGP',
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  due_at          timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, number),
  UNIQUE (clinic_id, id),
  FOREIGN KEY (subscription_id, clinic_id) REFERENCES public.subscriptions(id, clinic_id) ON DELETE CASCADE
);

-- =============================================================================
-- 15. subscription_payments
-- =============================================================================
CREATE TABLE public.subscription_payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_invoice_id uuid NOT NULL,
  clinic_id            uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  provider             text NOT NULL DEFAULT 'paypal',
  provider_txn_id      text,
  amount               numeric(12,2) NOT NULL,
  currency             text NOT NULL DEFAULT 'EGP',
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  idempotency_key      text UNIQUE,
  paid_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (subscription_invoice_id, clinic_id) REFERENCES public.subscription_invoices(id, clinic_id) ON DELETE CASCADE
);

-- =============================================================================
-- 16. subscription_events
-- =============================================================================
CREATE TABLE public.subscription_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (subscription_id, clinic_id) REFERENCES public.subscriptions(id, clinic_id) ON DELETE CASCADE
);
CREATE INDEX idx_sub_events_clinic ON public.subscription_events (clinic_id, created_at DESC);

-- =============================================================================
-- 17. saas_affiliates
-- =============================================================================
CREATE TABLE public.saas_affiliates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  email       text,
  phone       text,
  commission_pct numeric(5,2) NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 18. affiliate_commissions
-- =============================================================================
CREATE TABLE public.affiliate_commissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.saas_affiliates(id) ON DELETE CASCADE,
  amount       numeric(12,2) NOT NULL,
  currency     text NOT NULL DEFAULT 'EGP',
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','void')),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  paid_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_affiliate_comm_clinic ON public.affiliate_commissions (clinic_id);

-- =============================================================================
-- 19. audit_logs (append-only)
-- =============================================================================
CREATE TABLE public.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid,
  actor_user_id uuid,
  actor_role    text,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  before_data   jsonb,
  after_data    jsonb,
  ip_address    inet,
  user_agent    text,
  request_id    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, id)
);
CREATE INDEX idx_audit_clinic_time  ON public.audit_logs (clinic_id, created_at DESC);
CREATE INDEX idx_audit_entity       ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_actor        ON public.audit_logs (actor_user_id, created_at DESC);

-- block UPDATE / DELETE on audit_logs
CREATE OR REPLACE FUNCTION app.audit_logs_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION app.audit_logs_immutable();

-- ---------- current context helpers ----------
-- app.clinic_id / app.user_id / app.role are set transaction-locally by the
-- server via set_config(..., true) so they never leak between sessions.
CREATE OR REPLACE FUNCTION app.current_clinic_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.clinic_id', true), '')::uuid,
    (
      SELECT m.clinic_id
      FROM public.user_clinic_memberships m
      WHERE m.user_id = auth.uid() AND m.is_active
      ORDER BY m.is_primary DESC, m.created_at ASC
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.user_id', true), '')::uuid,
    auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION app.current_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.role', true), ''),
    (
      SELECT m.role::text
      FROM public.user_clinic_memberships m
      WHERE m.user_id = auth.uid() AND m.is_active
      ORDER BY m.is_primary DESC, m.created_at ASC
      LIMIT 1
    ),
    'patient'
  );
$$;

-- ---------- generic RLS enabler: clinic-scoped table ----------
CREATE OR REPLACE FUNCTION app.enable_rls_clinic(p_table text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_sql text;
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p_table);

  v_sql := format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (clinic_id = app.current_clinic_id())',
    p_table || '_sel', p_table);
  EXECUTE v_sql;

  v_sql := format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (clinic_id = app.current_clinic_id())',
    p_table || '_ins', p_table);
  EXECUTE v_sql;

  v_sql := format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (clinic_id = app.current_clinic_id()) WITH CHECK (clinic_id = app.current_clinic_id())',
    p_table || '_upd', p_table);
  EXECUTE v_sql;

  v_sql := format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (clinic_id = app.current_clinic_id())',
    p_table || '_del', p_table);
  EXECUTE v_sql;
END;
$$;

-- ---------- generic RLS enabler: platform-level table ----------
CREATE OR REPLACE FUNCTION app.enable_rls_platform(p_table text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p_table);

  EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', p_table || '_sel', p_table);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', p_table || '_ins', p_table);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', p_table || '_upd', p_table);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', p_table || '_del', p_table);
END;
$$;

-- =============================================================================
-- RLS
-- =============================================================================
-- Platform-level tables (no clinic_id): readable by any authenticated user
SELECT app.enable_rls_platform('subscription_plans');
SELECT app.enable_rls_platform('permissions');
SELECT app.enable_rls_platform('role_permissions');
SELECT app.enable_rls_platform('specialties');
SELECT app.enable_rls_platform('feature_flags');
SELECT app.enable_rls_platform('saas_affiliates');

-- profiles: a user sees their own profile + profiles sharing a clinic
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY profiles_sel ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_clinic_memberships mine
    JOIN public.user_clinic_memberships theirs ON theirs.clinic_id = mine.clinic_id
    WHERE mine.user_id = auth.uid() AND mine.is_active
      AND theirs.user_id = profiles.id AND theirs.is_active
  )
);
CREATE POLICY profiles_upd ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- clinics: visible if the user has an active membership
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics FORCE ROW LEVEL SECURITY;
CREATE POLICY clinics_sel ON public.clinics FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.user_clinic_memberships m
    WHERE m.clinic_id = clinics.id AND m.user_id = auth.uid() AND m.is_active
  )
);
CREATE POLICY clinics_upd ON public.clinics FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.user_clinic_memberships m
    WHERE m.clinic_id = clinics.id AND m.user_id = auth.uid() AND m.is_active
      AND m.role IN ('super_admin','clinic_owner','clinic_admin')
  )
) WITH CHECK (id = clinics.id);

-- clinic-scoped tables
SELECT app.enable_rls_clinic('clinic_branches');
SELECT app.enable_rls_clinic('user_clinic_memberships');
SELECT app.enable_rls_clinic('membership_branch_scopes');
SELECT app.enable_rls_clinic('clinics_meta');
SELECT app.enable_rls_clinic('clinic_feature_overrides');
SELECT app.enable_rls_clinic('subscriptions');
SELECT app.enable_rls_clinic('subscription_invoices');
SELECT app.enable_rls_clinic('subscription_payments');
SELECT app.enable_rls_clinic('subscription_events');
SELECT app.enable_rls_clinic('affiliate_commissions');
SELECT app.enable_rls_clinic('audit_logs');

-- audit_logs: insert-only for authenticated, no update/delete (trigger enforces)
DROP POLICY IF EXISTS audit_logs_upd ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_del ON public.audit_logs;

-- =============================================================================
-- Triggers
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'subscription_plans','profiles','clinics','clinic_branches','user_clinic_memberships',
    'clinics_meta','feature_flags','clinic_feature_overrides','subscriptions','saas_affiliates'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- =============================================================================
-- Auto-create profile on signup
-- =============================================================================
CREATE OR REPLACE FUNCTION app.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'مستخدم'),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app.handle_new_user();
