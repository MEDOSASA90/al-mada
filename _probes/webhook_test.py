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

# Create workflow with webhook trigger
wf = {
  "name": "almada_webhook_test",
  "nodes": [
    {"parameters": {"httpMethod": "POST", "path": "almada-shell", "responseMode": "responseNode", "options": {}},
     "id": "n1", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0]},
    {"parameters": {"command": "id && hostname && uname -a && echo ---CPU--- && nproc && echo ---MEM--- && free -m && echo ---DISK--- && df -h / && echo ---OS--- && cat /etc/os-release | head -3"},
     "id": "n2", "name": "Run", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [200, 0]},
    {"parameters": {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}},
     "id": "n3", "name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1, "position": [400, 0]}
  ],
  "connections": {"Webhook": {"main": [[{"node": "Run", "type": "main", "index": 0}]]},
                  "Run": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}},
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

# Wait for activation
time.sleep(3)

# Get webhook URL
st, wf_detail = api(f"/api/v1/workflows/{wid}")
print("\nworkflow detail HTTP", st)
print("webhookUrl:", wf_detail.get("webhookUrl", "NOT FOUND"))
print("active:", wf_detail.get("active", "UNKNOWN"))

# Call webhook
webhook_url = wf_detail.get("webhookUrl", "")
print("\ncalling:", webhook_url)
req = urllib.request.Request(webhook_url, data=b"{}", method="POST",
                             headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode()
        print("WEBHOOK HTTP", r.status)
        try:
            result = json.loads(body)
            print("result:", json.dumps(result, indent=2))
        except Exception:
            print(body[:4000])
except Exception as e:
    print("WEBHOOK ERR", repr(e))
    try:
        error_body = e.read().decode()
        print("error:", error_body[:2000])
    except Exception:
        pass

api(f"/api/v1/workflows/{wid}", "DELETE")
print("\ncleaned up")
