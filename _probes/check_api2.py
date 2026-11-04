import json, urllib.request, urllib.error, os, time

N8N = os.environ["N8N_URL"]
KEY = os.environ["N8N_API_KEY"]

def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{N8N}{path}", data=data, method=method,
                                 headers={"X-N8N-API-KEY": KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]

# Try different API endpoints
endpoints = [
    "/api/v1/settings",
    "/api/v2/settings",
    "/api/v1/nodes",
    "/api/v2/nodes",
    "/api/v1/workflows",
    "/api/v1/version",
    "/info",
    "/health",
]

for endpoint in endpoints:
    st, resp = api(endpoint, "GET")
    print(f"{endpoint}: HTTP {st}")
    if isinstance(resp, str):
        try:
            data = json.loads(resp)
            print(f"  response: {json.dumps(data, indent=2)[:200]}")
        except:
            print(f"  response: {resp[:100]}")
    else:
        print(f"  response: {resp[:100]}")
    print()
