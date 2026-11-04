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

# Create a workflow with Execute Command
wf = {
  "name": "almada_shell_test",
  "nodes": [
    {"parameters": {"command": "id && hostname && uname -a"},
     "id": "n1", "name": "Command", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [250, 300]},
  ],
  "connections": {},
  "settings": {"executionOrder": "v1"}
}

st, created = api("/api/v1/workflows", "POST", wf)
wid = created["id"]
print("workflow id:", wid)

# Try different activation endpoints
endpoints = [
    f"/api/v1/workflows/{wid}/active",
    f"/api/v1/workflows/{wid}/activate",
    f"/api/v1/workflows/{wid}/deactivate",
]

for endpoint in endpoints:
    print(f"\nTrying {endpoint}:")
    st, act = api(endpoint, "POST" if "activate" in endpoint else "POST", {})
    print(f"  HTTP {st}")
    print(f"  response: {act.get('active') if isinstance(act, dict) else act}")

# Wait and check
time.sleep(2)
st, wf_detail = api(f"/api/v1/workflows/{wid}")
print(f"\nworkflow active: {wf_detail.get('active', 'UNKNOWN')}")
print(f"activeVersionId: {wf_detail.get('activeVersionId', 'NOT FOUND')}")

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
