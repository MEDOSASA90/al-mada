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

st, wfs = api("/api/v1/workflows?limit=100")
print("=== NODE TYPES USED IN EXISTING WORKFLOWS ===")
types = {}
for w in wfs.get("data", []):
    for n in w.get("nodes", []):
        types.setdefault(n["type"], []).append(w["name"])

for t, wfs_using in sorted(types.items()):
    print(f"  {t}")
    print(f"      used in: {wfs_using[0][:60]}{'...' if len(wfs_using)>1 else ''} ({len(wfs_using)} wf)")

print("\n=== ACTIVE WORKFLOW DETAIL (the GCS one) ===")
st, active_wf = api("/api/v1/workflows?limit=100")
for w in active_wf.get("data", []):
    if w.get("active"):
        st, detail = api(f"/api/v1/workflows/{w['id']}")
        print(f"\n--- {w['name']} (id={w['id']}) ---")
        print("webhookUrl:", detail.get("webhookUrl", "NOT FOUND"))
        print("nodes:", [n["type"] for n in detail.get("nodes", [])])
        print("activeVersionId:", detail.get("activeVersionId"))
        print("versionId:", detail.get("versionId"))
        break

print("\n=== CREDENTIAL TYPES (full) ===")
st, creds = api("/api/v1/credentials")
for c in creds.get("data", []):
    print(f"  {c['name']} | {c['type']} | id={c['id']}")
