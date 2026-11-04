#!/usr/bin/env python3
"""Al-Mada RLS / isolation test suite (T1-T10).
Signs in as real users and asserts cross-clinic data is unreachable.
"""
import json, urllib.request, urllib.error, os, sys

URL = os.environ["SUPABASE_URL"]
ANON = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ["SUPABASE_ANON_KEY"]
SVC = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
REF = os.environ["SUPABASE_PROJECT_REF"]
IDS = json.load(open("/opt/data/.secrets/almada_test_ids.json"))

PASSWORD = "AlMada#Test2026"
results = []

def rest(method, path, jwt=None, body=None, service=False):
    key = SVC if service else ANON
    auth = f"Bearer {SVC}" if service else (f"Bearer {jwt}" if jwt else f"Bearer {key}")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", data=data, method=method,
                                 headers={"apikey": key, "Authorization": auth,
                                          "Content-Type": "application/json",
                                          "Prefer": "return=representation"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            try: return r.status, json.loads(raw) if raw else []
            except Exception: return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw) if raw else []
        except Exception: return e.code, raw[:300]
    except Exception as e:
        return 0, str(e)

def signin(email):
    req = urllib.request.Request(f"{URL}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": PASSWORD}).encode(), method="POST",
        headers={"apikey": ANON, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())["access_token"]

def sql(query):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=data, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]
    except Exception as e:
        return 0, str(e)

def check(num, name, ok, detail=""):
    results.append((num, name, ok, detail))
    print(f"  {'✅' if ok else '❌'} T{num}: {name}" + (f"  [{detail}]" if detail else ""))

# ---------------------------------------------------------------- setup
print("=== signing in users ===")
tokens = {}
for key, email in [("owner_a","owner_a@almada.test"), ("doctor_a","doctor_a@almada.test"),
                   ("owner_b","owner_b@almada.test"), ("patient_a","patient_a@almada.test")]:
    try:
        tokens[key] = signin(email)
        print(f"  ✅ {key}")
    except Exception as e:
        print(f"  ❌ {key}: {e}")
        tokens[key] = None

A = IDS["clinics"]["A"]; B = IDS["clinics"]["B"]
PAT_A1 = IDS["patients"]["A1"]; PAT_A2 = IDS["patients"]["A2"]; PAT_B1 = IDS["patients"]["B1"]

print("\n=== T1: owner_a reads clinic A patients ===")
st, rows = rest("GET", "patients?select=id,full_name&limit=50", jwt=tokens["owner_a"])
names = [r.get("full_name") for r in rows] if isinstance(rows, list) else []
check(1, "owner_a sees clinic A patients", st == 200 and len(rows) >= 2,
      f"HTTP {st}, {len(rows) if isinstance(rows,list) else 0} rows: {names}")

print("\n=== T2: owner_a CANNOT read clinic B patients (cross-tenant leak) ===")
st, rows = rest("GET", f"patients?select=id&id=eq.{PAT_B1}", jwt=tokens["owner_a"])
leaked = isinstance(rows, list) and len(rows) > 0
check(2, "owner_a blocked from clinic B patient", st == 200 and not leaked,
      f"HTTP {st}, rows={len(rows) if isinstance(rows,list) else rows}")

print("\n=== T3: owner_a CANNOT insert a patient into clinic B ===")
st, rows = rest("POST", "patients", jwt=tokens["owner_a"], body={
    "clinic_id": B, "full_name": "LEAK TEST", "phone": "+201999999999"})
blocked = st != 201 or (isinstance(rows, list) and len(rows) == 0)
check(3, "insert into clinic B blocked", blocked, f"HTTP {st} {str(rows)[:120]}")

print("\n=== T4: doctor_a (doctor role) reads clinic A patients ===")
st, rows = rest("GET", "patients?select=id&limit=50", jwt=tokens["doctor_a"])
check(4, "doctor sees clinic A patients", st == 200 and isinstance(rows, list) and len(rows) >= 2,
      f"HTTP {st}, {len(rows) if isinstance(rows,list) else 0} rows")

print("\n=== T5: patient_a sees ONLY their own patient row ===")
st, rows = rest("GET", "patients?select=id,full_name", jwt=tokens["patient_a"])
ok = st == 200 and isinstance(rows, list) and len(rows) == 1 and rows[0]["id"] == PAT_A2
check(5, "patient sees only own record", ok,
      f"HTTP {st}, rows={rows if isinstance(rows,list) else rows}")

print("\n=== T6: patient_a CANNOT read another patient's record in the same clinic ===")
st, rows = rest("GET", f"patients?select=id&id=eq.{PAT_A1}", jwt=tokens["patient_a"])
check(6, "patient blocked from sibling record", st == 200 and isinstance(rows, list) and len(rows) == 0,
      f"HTTP {st}, rows={rows if isinstance(rows,list) else rows}")

print("\n=== T7: composite FK blocks cross-clinic appointment link (service_role, RLS bypassed) ===")
st, res = sql(f"""
INSERT INTO public.appointments (clinic_id, branch_id, patient_id, doctor_id,
                                appointment_date, appointment_time, status)
VALUES ('{A}', (SELECT id FROM public.clinic_branches WHERE clinic_id='{A}' LIMIT 1),
        '{PAT_B1}', (SELECT id FROM public.staff_profiles WHERE clinic_id='{A}' AND role='doctor' LIMIT 1),
        CURRENT_DATE + 3, '09:00', 'booked');
""")
fk_blocked = st != 200
check(7, "cross-clinic FK rejected", fk_blocked,
      f"HTTP {st}: {str(res)[:150]}")

print("\n=== T8: audit_logs UPDATE is blocked (append-only) ===")
st, res = sql("UPDATE public.audit_logs SET action = 'tampered' WHERE clinic_id = '%s';" % A)
immutable = st != 200
check(8, "audit_logs immutable", immutable, f"HTTP {st}: {str(res)[:120]}")

print("\n=== T9: double-booking the same doctor slot is blocked ===")
st, res = sql(f"""
INSERT INTO public.appointments (clinic_id, branch_id, patient_id, doctor_id,
                                appointment_date, appointment_time, status)
VALUES ('{A}', (SELECT id FROM public.clinic_branches WHERE clinic_id='{A}' LIMIT 1),
        '{PAT_A2}', (SELECT id FROM public.staff_profiles WHERE clinic_id='{A}' AND role='doctor' LIMIT 1),
        CURRENT_DATE, '10:00', 'booked');
""")
dbl_blocked = st != 200
check(9, "no double-booking", dbl_blocked, f"HTTP {st}: {str(res)[:150]}")

print("\n=== T10: medical record versioning + lock protection ===")
st, res = sql(f"""
DO $$
DECLARE v_rec uuid; v_clinic uuid; v_patient uuid; v_doc uuid;
BEGIN
  v_clinic := '{A}';
  v_patient := '{PAT_A1}';
  SELECT id INTO v_doc FROM public.staff_profiles WHERE clinic_id=v_clinic AND role='doctor' LIMIT 1;
  INSERT INTO public.medical_records (clinic_id, patient_id, doctor_id, chief_complaint, diagnosis, status)
  VALUES (v_clinic, v_patient, v_doc, 'صداع', 'initial diagnosis', 'draft')
  RETURNING id INTO v_rec;
  UPDATE public.medical_records SET diagnosis = 'second version' WHERE id = v_rec;
  UPDATE public.medical_records SET is_locked = true WHERE id = v_rec;
END $$;
""")
if st in (200, 201):
    st2, res2 = sql(f"SELECT count(*)::int AS n FROM public.medical_record_versions WHERE medical_record_id IN (SELECT id FROM public.medical_records WHERE clinic_id='{A}' AND chief_complaint='صداع');")
    nver = 0
    if st2 in (200, 201) and isinstance(res2, list) and res2:
        try: nver = int(res2[0]["n"])
        except Exception: nver = 0
    st3, res3 = sql(f"UPDATE public.medical_records SET diagnosis='tamper' WHERE clinic_id='{A}' AND chief_complaint='صداع' AND is_locked=true;")
    lock_blocked = st3 not in (200, 201)
    check(10, "versioning + lock protection", nver >= 2 and lock_blocked,
          f"versions={nver}, lock_update_HTTP={st3}: {str(res3)[:120]}")
else:
    check(10, "versioning + lock protection", False, f"setup HTTP {st}: {str(res)[:200]}")

# ---------------------------------------------------------------- summary
passed = sum(1 for _, _, ok, _ in results if ok)
print(f"\n{'='*60}\nRESULT: {passed}/{len(results)} passed\n{'='*60}")
for num, name, ok, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  T{num}: {name}")
sys.exit(0 if passed == len(results) else 1)
