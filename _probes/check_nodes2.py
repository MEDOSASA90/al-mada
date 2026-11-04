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

# Get n8n version
st, settings = api("/api/v1/settings")
if isinstance(settings, str):
    print("settings:", settings[:200])
else:
    print("n8n version:", settings.get("version", "UNKNOWN"))

# Try to get node types
st, nodes = api("/api/v1/nodes")
print(f"\navailable node types: {len(nodes.get('data', []))}")
for node in nodes.get("data", [])[:30]:
    print(f"  - {node['name']}")

# Check for command-related nodes
print("\ncommand-related nodes:")
for node in nodes.get("data", []):
    if "command" in node['name'].lower() or "exec" in node['name'].lower() or "shell" in node['name'].lower():
        print(f"  - {node['name']}")
