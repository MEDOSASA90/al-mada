#!/usr/bin/env python3
"""Create n8n credentials for Al-Mada and the first real workflows."""
import json, urllib.request, urllib.error, os, sys, time

N8N = os.environ["N8N_URL"].rstrip("/")
KEY = os.environ["N8N_API_KEY"]
REF = os.environ["SUPABASE_PROJECT_REF"]
DB_PASS = os.environ["SUPABASE_DB_PASSWORD"]
TG = os.environ["TELEGRAM_BOT_TOKEN"]
GROQ = os.environ["GROQ_API_KEY"]

def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{N8N}{path}", data=data, method=method,
                                 headers={"X-N8N-API-KEY": KEY, "Content-Type": "application/json"})
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

# ------------------------------------------------------------------ creds
print("=== existing credentials ===")
st, creds = api("/api/v1/credentials")
existing = {}
if st == 200:
    for c in creds.get("data", []):
        print(f"  {c['name']:28s} type={c['type']:20s} id={c['id']}")
        existing[c["name"]] = c["id"]

def ensure_cred(name, ctype, data_variants):
    if name in existing:
        print(f"  ✅ '{name}' already exists ({existing[name]})")
        return existing[name]
    for data in data_variants:
        st, res = api("/api/v1/credentials", "POST", {"name": name, "type": ctype, "data": data})
        if st in (200, 201):
            cid = res["id"] if isinstance(res, dict) else res
            print(f"  ✅ created '{name}' id={cid} type={ctype}")
            existing[name] = cid
            return cid
        print(f"  ✗ '{name}' variant {list(data)} → HTTP {st}: {str(res)[:220]}")
    return None

print("\n=== creating credentials ===")
pg_cred = ensure_cred("Al-Mada Supabase Postgres", "postgres", [
    {"host": f"db.{REF}.supabase.co", "port": 5432, "database": "postgres",
     "user": "postgres", "password": DB_PASS, "ssl": "require"},
    {"host": f"db.{REF}.supabase.co", "port": 5432, "database": "postgres",
     "user": "postgres", "password": DB_PASS, "ssl": True},
    {"host": f"db.{REF}.supabase.co", "port": 5432, "database": "postgres",
     "user": "postgres", "password": DB_PASS},
])
tg_cred = ensure_cred("Al-Mada Telegram", "telegramApi", [
    {"accessToken": TG},
])
groq_cred = ensure_cred("Al-Mada Groq", "groqApi", [
    {"apiKey": GROQ},
])

if not (pg_cred and tg_cred):
    print("❌ missing critical credentials"); sys.exit(1)

# ------------------------------------------------------------------ workflows
print("\n=== existing workflows ===")
st, wfs = api("/api/v1/workflows?limit=200")
names = [w["name"] for w in wfs.get("data", [])]
print(f"  {len(names)} workflows: {names}")

def upsert_workflow(name, definition, activate=True):
    existing_id = None
    for w in wfs.get("data", []):
        if w["name"] == name:
            existing_id = w["id"]; break
    if existing_id:
        st, res = api(f"/api/v1/workflows/{existing_id}", "PUT", definition)
        print(f"  ↻ updated '{name}' ({existing_id}) HTTP {st}")
        wid = existing_id
    else:
        st, res = api("/api/v1/workflows", "POST", definition)
        if st not in (200, 201):
            print(f"  ✗ create '{name}' HTTP {st}: {str(res)[:400]}")
            return None
        wid = res["id"]
        print(f"  ✅ created '{name}' ({wid})")
    if activate:
        st, res = api(f"/api/v1/workflows/{wid}/activate", "POST", {})
        if st in (200, 201):
            print(f"     ✅ activated")
        else:
            print(f"     ❌ activate failed HTTP {st}: {str(res)[:400]}")
    return wid

# ---- Workflow 1: Telegram webhook relay (app → bot → patient)
wf1 = {
  "name": "Al-Mada — Telegram Relay Webhook",
  "nodes": [
    {"parameters": {"httpMethod": "POST", "path": "almada-telegram",
                    "responseMode": "responseNode", "options": {}},
     "id": "t1", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2,
     "position": [260, 300], "webhookId": "almada-telegram-hook"},
    {"parameters": {"jsCode": "const body = $json.body ?? $json;\nconst chat_id = body.chat_id || body.chatId;\nconst text = body.text || body.message;\nif (!chat_id || !text) { throw new Error('chat_id and text are required'); }\nreturn [{ json: { chat_id: String(chat_id), text: String(text) } }];"},
     "id": "t2", "name": "Normalize", "type": "n8n-nodes-base.code", "typeVersion": 2,
     "position": [480, 300]},
    {"parameters": {"chatId": "={{ $json.chat_id }}", "text": "={{ $json.text }}",
                    "additionalFields": {}},
     "id": "t3", "name": "Send Telegram", "type": "n8n-nodes-base.telegram",
     "typeVersion": 1.1, "position": [700, 300],
     "credentials": {"telegramApi": {"id": tg_cred, "name": "Al-Mada Telegram"}}},
    {"parameters": {"respondWith": "json", "responseBody": "={{ { ok: true, sent: true } }}",
                    "options": {}},
     "id": "t4", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook",
     "typeVersion": 1.1, "position": [920, 300]}
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Normalize", "type": "main", "index": 0}]]},
    "Normalize": {"main": [[{"node": "Send Telegram", "type": "main", "index": 0}]]},
    "Send Telegram": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"},
}

# ---- Workflow 2: daily appointments report → Telegram
wf2 = {
  "name": "Al-Mada — Daily Appointments Report",
  "nodes": [
    {"parameters": {"rule": {"interval": [{"triggerAtHour": 8, "triggerAtMinute": 0}]}},
     "id": "d1", "name": "Every Day 08:00", "type": "n8n-nodes-base.scheduleTrigger",
     "typeVersion": 1.2, "position": [40, 300]},
    {"parameters": {"assignments": {"assignments": [
                      {"id": "c1", "name": "clinic_id", "value": "00000000-0000-0000-0000-0000a1111111", "type": "string"},
                      {"id": "c2", "name": "chat_id", "value": "0", "type": "string"}]},
                    "options": {}},
     "id": "d0", "name": "Config", "type": "n8n-nodes-base.set", "typeVersion": 3.4,
     "position": [260, 300]},
    {"parameters": {"operation": "executeQuery", "query": "SELECT p.full_name AS patient, p.phone, a.appointment_time, s.full_name AS doctor\nFROM appointments a\nJOIN patients p ON p.id = a.patient_id AND p.clinic_id = a.clinic_id\nJOIN staff_profiles s ON s.id = a.doctor_id AND s.clinic_id = a.clinic_id\nWHERE a.appointment_date = CURRENT_DATE AND a.clinic_id = '00000000-0000-0000-0000-0000a1111111'\n  AND a.status IN ('booked','confirmed')\nORDER BY a.appointment_time;",
                    "options": {}},
     "id": "d2", "name": "Today's Appointments", "type": "n8n-nodes-base.postgres",
     "typeVersion": 2.4, "position": [480, 300],
     "credentials": {"postgres": {"id": pg_cred, "name": "Al-Mada Supabase Postgres"}}},
    {"parameters": {"jsCode": "const rows = $input.all();\nconst lines = rows.map((r, i) => `${i+1}. ${r.json.patient} — ${r.json.appointment_time} (${r.json.doctor}) — ${r.json.phone}`);\nconst body = lines.length ? `📅 مواعيد اليوم (${lines.length}):\\n` + lines.join('\\n') : '📅 لا توجد مواعيد اليوم.';\nreturn [{ json: { text: body, count: lines.length } }];"},
     "id": "d3", "name": "Format", "type": "n8n-nodes-base.code", "typeVersion": 2,
     "position": [700, 300]},
    {"parameters": {"chatId": "={{ $('Config').first().json.chat_id }}", "text": "={{ $json.text }}",
                    "additionalFields": {}},
     "id": "d4", "name": "Send Report", "type": "n8n-nodes-base.telegram",
     "typeVersion": 1.1, "position": [920, 300],
     "credentials": {"telegramApi": {"id": tg_cred, "name": "Al-Mada Telegram"}}}
  ],
  "connections": {
    "Every Day 08:00": {"main": [[{"node": "Config", "type": "main", "index": 0}]]},
    "Config": {"main": [[{"node": "Today's Appointments", "type": "main", "index": 0}]]},
    "Today's Appointments": {"main": [[{"node": "Format", "type": "main", "index": 0}]]},
    "Format": {"main": [[{"node": "Send Report", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"},
}

print("\n=== upserting workflows ===")
w1 = upsert_workflow("Al-Mada — Telegram Relay Webhook", wf1, activate=True)
w2 = upsert_workflow("Al-Mada — Daily Appointments Report", wf2, activate=True)

print("\n=== final workflow list ===")
st, wfs2 = api("/api/v1/workflows?limit=200")
for w in wfs2.get("data", []):
    print(f"  {'●' if w.get('active') else '○'} {w['name']}")
print(f"\n✅ n8n setup done (pg={pg_cred}, tg={tg_cred}, groq={groq_cred})")
