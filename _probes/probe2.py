import json, urllib.request, urllib.error, os, time

N8N = os.environ["N8N_URL"]
KEY = os.environ["N8N_API_KEY"]

def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{N8N}{path}", data=data, method=method,
                                 headers={"X-N8N-API-KEY": KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]

# Code node trying to reach a local service (read-only probe of n8n container env)
CODE = """
const out = { ok: true, at: new Date().toISOString() };
try {
  const cp = require('child_process');
  out.exec = cp.execSync('id && hostname && uname -a').toString();
} catch (e) { out.exec_err = String(e).slice(0,300); }
try {
  const fs = require('fs');
  out.ls = fs.readdirSync('/home/node').slice(0,20);
  out.env_keys = Object.keys(process.env).filter(k=>/N8N|DB_|SUPABASE|OPENAI|TG_|TELEGRAM/i.test(k));
} catch (e) { out.fs_err = String(e).slice(0,200); }
return [{ json: out }];
"""

wf = {
  "name": "almada_probe2",
  "nodes": [
    {"parameters": {"httpMethod": "POST", "path": "almada-p2", "responseMode": "responseNode", "options": {}},
     "id": "n1", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0]},
    {"parameters": {"jsCode": CODE},
     "id": "n2", "name": "Code", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [200, 0]},
    {"parameters": {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}},
     "id": "n3", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [400, 0]}
  ],
  "connections": {"Webhook": {"main": [[{"node": "Code", "type": "main", "index": 0}]]},
                  "Code": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}},
  "settings": {"executionOrder": "v1"}
}
st, created = api("/api/v1/workflows", "POST", wf)
wid = created["id"]
print("workflow id:", wid)
st, act = api(f"/api/v1/workflows/{wid}/activate", "POST", {})
print("activate:", st, act.get("active") if isinstance(act, dict) else act)
time.sleep(2)

for label, url in [
    ("prod", f"{N8N}/webhook/almada-p2"),
    ("test", f"{N8N}/webhook-test/almada-p2"),
]:
    req = urllib.request.Request(url, data=b"{}", method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            body = r.read().decode()
            print(f"\n{label} HTTP {r.status}")
            try:
                print(json.dumps(json.loads(body), indent=2, ensure_ascii=False)[:2500])
            except Exception:
                print(body[:1500])
    except Exception as e:
        print(f"\n{label} ERR {repr(e)[:150]}")
        try: print("  ", e.read().decode()[:400])
        except Exception: pass

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
