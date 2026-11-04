#!/usr/bin/env python3
"""Seed demo data: auth users, 2 clinics (for isolation tests), staff, patients, appointments."""
import json, urllib.request, urllib.error, os, sys, uuid

TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
REF = os.environ["SUPABASE_PROJECT_REF"]
URL = os.environ["SUPABASE_URL"]
SVC = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

def mgmt(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"https://api.supabase.com{path}", data=data, method=method,
                                 headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read().decode()
            try: return r.status, json.loads(raw)
            except Exception: return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw[:1200]
    except Exception as e:
        return 0, str(e)

def sql(query):
    return mgmt(f"/v1/projects/{REF}/database/query", "POST", {"query": query})

def auth_request(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{URL}/auth/v1{path}", data=data, method=method,
                                 headers={"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            try: return r.status, json.loads(raw)
            except Exception: return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw[:600]
    except Exception as e:
        return 0, str(e)

def ensure_user(email, full_name, phone):
    """Create the user if missing; return its id."""
    st, res = auth_request("/admin/users", "GET")
    if st == 200:
        for u in res.get("users", []):
            if u.get("email") == email:
                return u["id"]
    st, res = auth_request("/admin/users", "POST", {
        "email": email, "password": "AlMada#Test2026", "email_confirm": True,
        "user_metadata": {"full_name": full_name, "phone": phone},
    })
    if st in (200, 201):
        return res["id"]
    # maybe exists already
    st, res = auth_request("/admin/users", "GET")
    if st == 200:
        for u in res.get("users", []):
            if u.get("email") == email:
                return u["id"]
    print(f"  ✗ could not create {email}: {res}")
    return None

# ---------------------------------------------------------------- seed.sql
print("=== 1. apply seed.sql (platform reference data) ===")
seed_sql = open("/opt/data/clinic_saas_agent_handoff/supabase/seed.sql", encoding="utf-8").read()
st, res = sql(seed_sql)
print(f"  HTTP {st}: {str(res)[:300]}")

# ---------------------------------------------------------------- users
print("\n=== 2. create auth users ===")
USERS = {
    "owner_a":  ("owner_a@almada.test",  "مالك عيادة ألف",  "+201000000001"),
    "doctor_a": ("doctor_a@almada.test", "دكتور ألف",      "+201000000002"),
    "owner_b":  ("owner_b@almada.test",  "مالك عيادة باء", "+201000000003"),
    "patient_a":("patient_a@almada.test","مريض ألف",       "+201000000004"),
}
ids = {}
for k, (email, name, phone) in USERS.items():
    uid = ensure_user(email, name, phone)
    ids[k] = uid
    print(f"  {k:9s} {email:28s} → {uid}")

if not all(ids.values()):
    print("❌ missing user ids"); sys.exit(1)

# ---------------------------------------------------------------- demo data
CLINIC_A = str(uuid.UUID(int=0xA1111111))
CLINIC_B = str(uuid.UUID(int=0xB2222222))
BRANCH_A1 = str(uuid.UUID(int=0xA1A1A1A1))
BRANCH_A2 = str(uuid.UUID(int=0xA2A2A2A2))
BRANCH_B1 = str(uuid.UUID(int=0xB1B1B1B1))
STAFF_A1  = str(uuid.UUID(int=0xADADADAD))
STAFF_A2  = str(uuid.UUID(int=0xA2ADADAD))
STAFF_B1  = str(uuid.UUID(int=0xBDBDBDBD))
PAT_A1    = str(uuid.UUID(int=0xAEAEAEAE))
PAT_A2    = str(uuid.UUID(int=0xA2EAEAEA))
PAT_B1    = str(uuid.UUID(int=0xBEBEBEBE))
PLAN_PRO  = "00000000-0000-4000-8000-000000000002"

demo = f"""
DO $$
BEGIN
  -- clinics
  INSERT INTO public.clinics (id, name, name_ar, slug, plan_id, subscription_status, is_active, city, phone)
  VALUES
    ('{CLINIC_A}', 'Clinic Alpha', 'عيادة ألف', 'clinic-alpha', '{PLAN_PRO}', 'active', true, 'Cairo', '+201111111111'),
    ('{CLINIC_B}', 'Clinic Beta',  'عيادة باء', 'clinic-beta',  '{PLAN_PRO}', 'active', true, 'Giza',  '+202222222222')
  ON CONFLICT (id) DO NOTHING;

  -- branches
  INSERT INTO public.clinic_branches (id, clinic_id, name, name_ar, is_active) VALUES
    ('{BRANCH_A1}', '{CLINIC_A}', 'Main', 'الفرع الرئيسي', true),
    ('{BRANCH_A2}', '{CLINIC_A}', 'Annex', 'الفرع الفرعي', true),
    ('{BRANCH_B1}', '{CLINIC_B}', 'Main', 'الفرع الرئيسي', true)
  ON CONFLICT (id) DO NOTHING;

  -- memberships
  INSERT INTO public.user_clinic_memberships (clinic_id, user_id, role, is_primary, is_active) VALUES
    ('{CLINIC_A}', '{ids["owner_a"]}',   'clinic_owner', true,  true),
    ('{CLINIC_A}', '{ids["doctor_a"]}',  'doctor',       false, true),
    ('{CLINIC_A}', '{ids["patient_a"]}', 'patient',      false, true),
    ('{CLINIC_B}', '{ids["owner_b"]}',   'clinic_owner', true,  true)
  ON CONFLICT (clinic_id, user_id) DO NOTHING;

  -- staff
  INSERT INTO public.staff_profiles (id, clinic_id, user_id, full_name, phone, role, is_active) VALUES
    ('{STAFF_A1}', '{CLINIC_A}', '{ids["doctor_a"]}', 'د. أحمد محمد', '+201000000002', 'doctor', true),
    ('{STAFF_A2}', '{CLINIC_A}', NULL, 'أ. سارة علي', '+201000000009', 'receptionist', true),
    ('{STAFF_B1}', '{CLINIC_B}', '{ids["owner_b"]}',  'د. منى حسن', '+201000000008', 'doctor', true)
  ON CONFLICT (id) DO NOTHING;

  -- patients
  INSERT INTO public.patients (id, clinic_id, user_id, full_name, phone, gender, birth_date) VALUES
    ('{PAT_A1}', '{CLINIC_A}', NULL, 'محمد إبراهيم', '+201111100001', 'male', '1985-04-12'),
    ('{PAT_A2}', '{CLINIC_A}', '{ids["patient_a"]}', 'فاطمة exclaimed', '+201111100002', 'female', '1992-09-30'),
    ('{PAT_B1}', '{CLINIC_B}', NULL, 'خالد مصطفى', '+202222200001', 'male', '1978-01-05')
  ON CONFLICT (id) DO NOTHING;

  -- appointments
  INSERT INTO public.appointments (clinic_id, branch_id, patient_id, doctor_id, appointment_date,
                                  appointment_time, status, reason, price)
  VALUES
    ('{CLINIC_A}', '{BRANCH_A1}', '{PAT_A1}', '{STAFF_A1}', CURRENT_DATE, '10:00', 'booked', 'كشف عام', 300),
    ('{CLINIC_A}', '{BRANCH_A1}', '{PAT_A2}', '{STAFF_A1}', CURRENT_DATE, '11:00', 'confirmed', 'متابعة', 200),
    ('{CLINIC_B}', '{BRANCH_B1}', '{PAT_B1}', '{STAFF_B1}', CURRENT_DATE, '10:30', 'booked', 'كشف عام', 250)
  ON CONFLICT (clinic_id, patient_id, appointment_date, appointment_time) DO NOTHING;

  -- invoice for clinic A
  INSERT INTO public.invoices (clinic_id, branch_id, patient_id, invoice_number, status, subtotal, total, paid_total, issued_at)
  VALUES ('{CLINIC_A}', '{BRANCH_A1}', '{PAT_A1}', 'INV-000001', 'issued', 300, 300, 0, now())
  ON CONFLICT (clinic_id, invoice_number) DO NOTHING;

  -- audit entry
  INSERT INTO public.audit_logs (clinic_id, actor_user_id, actor_role, action, entity_type, entity_id, after_data)
  VALUES ('{CLINIC_A}', '{ids["owner_a"]}', 'clinic_owner', 'seed', 'clinic', '{CLINIC_A}', '{{"seeded": true}}'::jsonb);

  -- clinics_meta
  INSERT INTO public.clinics_meta (clinic_id, settings) VALUES
    ('{CLINIC_A}', '{{"currency":"EGP","timezone":"Africa/Cairo","working_hours":"09:00-21:00"}}'::jsonb),
    ('{CLINIC_B}', '{{"currency":"EGP","timezone":"Africa/Cairo","working_hours":"09:00-18:00"}}'::jsonb)
  ON CONFLICT (clinic_id) DO NOTHING;
END $$;
"""

print("\n=== 3. seed demo clinics/staff/patients/appointments ===")
st, res = sql(demo)
print(f"  HTTP {st}: {str(res)[:500]}")
if st not in (200, 201):
    print("❌ demo seed failed"); sys.exit(1)

# fix the accidental Arabic text in PAT_A2 name
sql("UPDATE public.patients SET full_name = 'فاطمة عبدالله' WHERE id = '%s';" % PAT_A2)

print("\n=== 4. verify counts ===")
st, res = sql("""
SELECT
 (SELECT count(*) FROM public.clinics)         AS clinics,
 (SELECT count(*) FROM public.clinic_branches) AS branches,
 (SELECT count(*) FROM public.user_clinic_memberships) AS memberships,
 (SELECT count(*) FROM public.staff_profiles)  AS staff,
 (SELECT count(*) FROM public.patients)        AS patients,
 (SELECT count(*) FROM public.appointments)    AS appointments,
 (SELECT count(*) FROM public.permissions)     AS permissions,
 (SELECT count(*) FROM public.role_permissions) AS role_permissions,
 (SELECT count(*) FROM public.specialties)     AS specialties,
 (SELECT count(*) FROM public.subscription_plans) AS plans;
""")
print(f"  {res}")

# persist ids for the isolation test script
with open("/opt/data/.secrets/almada_test_ids.json", "w") as f:
    json.dump({"users": ids, "clinics": {"A": CLINIC_A, "B": CLINIC_B},
               "patients": {"A1": PAT_A1, "A2": PAT_A2, "B1": PAT_B1},
               "staff": {"A1": STAFF_A1, "B1": STAFF_B1},
               "branches": {"A1": BRANCH_A1, "A2": BRANCH_A2, "B1": BRANCH_B1}}, f, indent=2)
print("\n✅ demo seed complete → /opt/data/.secrets/almada_test_ids.json")
