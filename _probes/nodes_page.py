import json, urllib.request, urllib.error, os, re

N8N = os.environ["N8N_URL"]
KEY = os.environ["N8N_API_KEY"]

def raw(path, headers=None):
    h = {"X-N8N-API-KEY": KEY}
    if headers: h.update(headers)
    req = urllib.request.Request(f"{N8N}{path}", headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]

st, body = raw("/rest/settings")
print("=== /rest/settings ===")
print(body)

st, body = raw("/nodes")
print("\n=== /nodes (head) ===")
print(body[:1500])
print("\n... searching for node names in /nodes ...")
# it may be an html page or json
try:
    data = json.loads(body)
    if isinstance(data, list):
        names = sorted({d.get("name") for d in data if isinstance(d, dict) and d.get("name")})
        print("node count:", len(names))
        for n in names:
            print("  ", n)
except Exception as e:
    print("not json:", e)
    # try to find "n8n-nodes-base." occurrences
    hits = sorted(set(re.findall(r"n8n-nodes-[a-z0-9\-]+\.[a-zA-Z0-9_]+", body)))
    print(f"\nfound {len(hits)} node-type strings:")
    for h in hits[:150]:
        print("  ", h)
