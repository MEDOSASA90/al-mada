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

# Try a minimal workflow
wf = {
  "name": "almada_minimal",
  "nodes": [
    {"parameters": {"command": "echo hello from n8n; id; hostname"},
     "id": "n1", "name": "Command", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [250, 300]},
  ],
  "connections": {},
  "settings": {"executionOrder": "v1"}
}

st, created = api("/api/v1/workflows", "POST", wf)
print("create HTTP", st)
if st != 200:
    print("ERROR:", created)
    raise SystemExit(1)
wid = created["id"]
print("workflow id:", wid)

# Activate
st, act = api(f"/api/v1/workflows/{wid}", "PUT", wf)
print("activate HTTP:", st)
print("activate response:", act.get("active") if isinstance(act, dict) else act)

# Wait
time.sleep(2)

# Get workflow details
st, wf_detail = api(f"/api/v1/workflows/{wid}")
print("\nworkflow detail:")
print("  active:", wf_detail.get("active", "UNKNOWN"))
print("  nodes:", len(wf_detail.get("nodes", [])))
print("  connections:", len(wf_detail.get("connections", [])))

# List all workflows
st, all_wf = api("/api/v1/workflows?limit=10")
print("\nall workflows:", len(all_wf.get("data", [])))
for w in all_wf.get("data", []):
    if w["id"] == wid:
        print("  -", w["name"], "| active:", w.get("active", "UNKNOWN"), "| webhookUrl:", w.get("webhookUrl", "NOT FOUND"), "| testUrl:", w.get("testUrl", "NOT FOUND"))

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
