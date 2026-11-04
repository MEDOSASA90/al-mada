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
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, e.read().decode()[:300]

print("=== 1. Try CREATE credential via API (sshPassword) ===")
st, resp = api("/api/v1/credentials", "POST", {
    "name": "almada_probe_ssh",
    "type": "sshPassword",
    "data": {"user": "root", "password": "dummy_probe_value_not_real", "host": "127.0.0.1"},
})
print("create HTTP", st)
print("response:", json.dumps(resp, indent=2)[:600] if isinstance(resp, (dict, list)) else resp[:400])

if st == 200 and isinstance(resp, dict) and resp.get("id"):
    cid = resp["id"]
    print("\ncredential created id:", cid)
    st, d = api(f"/api/v1/credentials/{cid}")
    print("read back HTTP", st)
    print("read back:", json.dumps(d, indent=2)[:500] if isinstance(d, dict) else str(d)[:300])
    st, _ = api(f"/api/v1/credentials/{cid}", "DELETE")
    print("delete HTTP", st)
    print("\n>>> CONCLUSION: credentials CAN be created via API <<<")
else:
    print("\n>>> credentials CANNOT be created via API <<<")

print("\n=== 2. Try PATCH a workflow (set active) - sanity ===")
st, wfs = api("/api/v1/workflows?limit=1")
if st == 200 and wfs.get("data"):
    print("workflows list OK, count:", len(wfs.get("data", [])))

print("\n=== 3. Try n8n CLI-ish /rest endpoints ===")
for p in ["/rest/login", "/rest/owner", "/rest/workflows", "/rest/node-types", "/rest/community-node-types"]:
    st, b = api(p)
    print(f"  {p}: HTTP {st}")
