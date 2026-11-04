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

# Test 1: workflow using ONLY known-working nodes (webhook + code + respondToWebhook)
wf = {
  "name": "almada_known_nodes_test",
  "nodes": [
    {"parameters": {"httpMethod": "POST", "path": "almada-known", "responseMode": "responseNode", "options": {}},
     "id": "n1", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0]},
    {"parameters": {"jsCode": "return [{ json: { ok: true, at: new Date().toISOString(), env_has: Object.keys(process.env).filter(k=>k.includes('N8N')).slice(0,20) } }];"},
     "id": "n2", "name": "Code", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [200, 0]},
    {"parameters": {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}},
     "id": "n3", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [400, 0]}
  ],
  "connections": {"Webhook": {"main": [[{"node": "Code", "type": "main", "index": 0}]]},
                  "Code": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}},
  "settings": {"executionOrder": "v1"}
}
st, created = api("/api/v1/workflows", "POST", wf)
print("create HTTP", st)
if st != 200:
    print(created); raise SystemExit(1)
wid = created["id"]
print("workflow id:", wid)

st, act = api(f"/api/v1/workflows/{wid}/activate", "POST", {})
print("activate endpoint HTTP", st, act.get("active") if isinstance(act, dict) else act)

time.sleep(2)
st, detail = api(f"/api/v1/workflows/{wid}")
print("active:", detail.get("active"))
print("webhookUrl:", detail.get("webhookUrl", "NOT FOUND"))
print("testUrl:", detail.get("testUrl", "NOT FOUND"))

# try calling both
for label, url in [("prod", detail.get("webhookUrl")), ("test", detail.get("testUrl"))]:
    if not url:
        continue
    req = urllib.request.Request(url, data=b"{}", method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            print(f"\n{label} webhook HTTP {r.status}: {r.read().decode()[:600]}")
    except Exception as e:
        print(f"\n{label} webhook ERR: {repr(e)[:200]}")
        try: print("  ", e.read().decode()[:400])
        except Exception: pass

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
