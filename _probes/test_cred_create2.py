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

# Try sshPassword with correct schema: host, port, username, password
print("=== sshPassword attempt (username) ===")
st, resp = api("/api/v1/credentials", "POST", {
    "name": "almada_probe_ssh",
    "type": "sshPassword",
    "data": {"host": "127.0.0.1", "port": 22, "username": "probeuser", "password": "probe_pass"},
})
print("HTTP", st, json.dumps(resp)[:400] if isinstance(resp, (dict, list)) else str(resp)[:300])
created_id = resp.get("id") if isinstance(resp, dict) else None

if not created_id:
    # discover required props
    print("\n=== probing schema by omitting fields ===")
    for data in [{"host":"h"}, {"host":"h","port":22}, {"host":"h","port":22,"username":"u"},
                 {"host":"h","port":22,"username":"u","password":"p"},
                 {"host":"h","port":22,"user":"u","password":"p","privateKey":""}]:
        st, r2 = api("/api/v1/credentials", "POST", {"name":"probe_schema","type":"sshPassword","data":data})
        msg = r2.get("message","") if isinstance(r2,dict) else str(r2)
        print(f"  {list(data.keys())} -> HTTP {st} {msg[:150]}")
        if st == 200:
            created_id = r2.get("id")
            print("   created:", created_id)
            api(f"/api/v1/credentials/{created_id}", "DELETE")
            break
else:
    st, d = api(f"/api/v1/credentials/{created_id}")
    print("read back:", json.dumps(d, indent=2)[:400] if isinstance(d, dict) else str(d)[:200])
    st, _ = api(f"/api/v1/credentials/{created_id}", "DELETE")
    print("cleanup delete HTTP", st)

print("\n=== testing other credential types needed for Al-Mada ===")
for ctype, data in [
    ("postgres", {"host":"127.0.0.1","port":5432,"database":"postgres","user":"postgres","password":"p","ssl":"disable"}),
    ("telegramApi", {"botToken":"123:ABC"}),
    ("groqApi", {"apiKey":"gsk_test"}),
    ("openAiApi", {"apiKey":"sk-test"}),
    ("googlePalmApi", {"apiKey":"AIza-test"}),
    ("supabaseApi", {"url":"https://x.supabase.co","serviceRoleKey":"test"}),
    ("httpHeaderAuth", {"name":"X-Key","value":"v"}),
]:
    st, r3 = api("/api/v1/credentials", "POST", {"name": f"probe_{ctype}", "type": ctype, "data": data})
    if st == 200:
        print(f"  ✅ {ctype} created (id={r3.get('id')})")
        api(f"/api/v1/credentials/{r3.get('id')}", "DELETE")
    else:
        msg = r3.get("message","") if isinstance(r3,dict) else str(r3)
        print(f"  ❌ {ctype}: HTTP {st} {msg[:180]}")
