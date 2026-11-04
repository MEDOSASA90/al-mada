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

# Test: create a simple workflow with Execute Command node only (no webhook)
wf = {
  "name": "almada_simple_test",
  "nodes": [
    {"parameters": {"command": "id && hostname && uname -a"},
     "id": "n1", "name": "Run", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [250, 300]},
  ],
  "connections": {},
  "settings": {"executionOrder": "v1"}
}
st, created = api("/api/v1/workflows", "POST", wf)
print("create HTTP", st)
if st != 200:
    print(created); raise SystemExit(1)
wid = created["id"]
print("workflow id", wid)

# Activate
st, act = api(f"/api/v1/workflows/{wid}", "PUT", wf)
print("activate HTTP", st, act.get("active") if isinstance(act, dict) else act)

# Wait and check executions
time.sleep(2)
st, execs = api(f"/api/v1/executions?workflowId={wid}&limit=5")
print("executions HTTP", st)
print(json.dumps(execs, indent=2)[:2000])

api(f"/api/v1/workflows/{wid}", "DELETE")
print("cleaned up")
