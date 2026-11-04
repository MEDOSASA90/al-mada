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

# Create a simple workflow with Execute Command
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
wid = created["id"]
print("workflow id", wid)

# Activate
st, act = api(f"/api/v1/workflows/{wid}", "PUT", wf)
print("activate HTTP", st, act.get("active") if isinstance(act, dict) else act)

# Wait for activation
time.sleep(2)

# Trigger the workflow manually
st, exec_result = api(f"/api/v1/executions", "POST", {"workflowId": wid})
print("trigger HTTP", st)
print(json.dumps(exec_result, indent=2)[:2000])

# Wait and check executions
time.sleep(2)
st, execs = api(f"/api/v1/executions?workflowId={wid}&limit=5")
print("\nexecutions HTTP", st)
print(json.dumps(execs, indent=2)[:3000])

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
