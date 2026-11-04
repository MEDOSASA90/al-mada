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

# node types list
st, body = raw("/types/nodes.json")
print(f"/types/nodes.json HTTP {st}")
if st == 200:
    try:
        data = json.loads(body)
        names = sorted(data.keys()) if isinstance(data, dict) else []
        print(f"total node types: {len(names)}")
        print("\n--- command/ssh/exec/code/http ---")
        for n in names:
            if re.search(r"command|ssh|exec|code|http|postgres|mysql|redis|mongo|git|sftp|ftp|readWrite|file", n, re.I):
                print("  ", n)
        print("\n--- langchain / ai / openai / whisper / anthropic ---")
        for n in names:
            if re.search(r"langchain|openai|whisper|anthropic|gemini|vector|embed|chat|memory", n, re.I):
                print("  ", n)
        print("\n--- all node names (first 120) ---")
        for n in names[:120]:
            print("  ", n)
    except Exception as e:
        print("parse err", e, body[:300])

print("\n\n=== /rest/settings or other discovery ===")
for p in ["/rest/node-types", "/api/v1/types/nodes.json", "/nodes", "/rest/settings"]:
    st, b = raw(p)
    print(f"{p}: HTTP {st} len={len(b)}")
