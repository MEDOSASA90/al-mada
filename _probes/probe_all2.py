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
            return e.code, "?"

CANDIDATES = [
    "n8n-nodes-base.executeCommand",
    "n8n-nodes-base.ssh",
    "n8n-nodes-base.postgres",
    "n8n-nodes-base.mysql",
    "n8n-nodes-base.readWriteFile",
    "n8n-nodes-base.noOp",
    "n8n-nodes-base.set",
    "n8n-nodes-base.code",
    "n8n-nodes-base.httpRequest",
    "n8n-nodes-base.if",
    "n8n-nodes-base.switch",
    "n8n-nodes-base.merge",
    "n8n-nodes-base.splitInBatches",
    "n8n-nodes-base.wait",
    "n8n-nodes-base.respondToWebhook",
    "n8n-nodes-base.telegram",
    "n8n-nodes-base.emailSend",
    "n8n-nodes-base.gmail",
    "n8n-nodes-base.whatsApp",
    "n8n-nodes-base.openAi",
    "@n8n/n8n-nodes-langchain.lmChatOpenAi",
    "@n8n/n8n-nodes-langchain.lmChatAnthropic",
    "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    "@n8n/n8n-nodes-langchain.lmChatGroq",
    "@n8n/n8n-nodes-langchain.lmChatOllama",
    "@n8n/n8n-nodes-langchain.agent",
    "@n8n/n8n-nodes-langchain.chainLlm",
    "@n8n/n8n-nodes-langchain.chainSummarization",
    "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    "@n8n/n8n-nodes-langchain.memoryPostgresChat",
    "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
    "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
    "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
    "@n8n/n8n-nodes-langchain.chainRetrievalQa",
    "@n8n/n8n-nodes-langchain.embeddingsGoogleGemini",
    "@n8n/n8n-nodes-langchain.lmChatGoogleVertex",
    "@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter",
]

AVAILABLE, MISSING, CRED_NEEDED = [], [], []
for t in CANDIDATES:
    safe = t.replace('.', '_').replace('@', '').replace('/', '_')
    wf = {
      "name": f"pb_{safe}"[:120],
      "nodes": [
        {"parameters": {"httpMethod": "POST", "path": f"pb-{safe}"[:40], "responseMode": "responseNode", "options": {}},
         "id": "t1", "name": "T", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0]},
        {"parameters": {}, "id": "n1", "name": "N", "type": t, "typeVersion": 1, "position": [250, 300]},
      ],
      "connections": {"T": {"main": [[{"node": "N", "type": "main", "index": 0}]]}},
      "settings": {"executionOrder": "v1"}
    }
    st, created = api("/api/v1/workflows", "POST", wf)
    if st != 200:
        MISSING.append((t, f"create HTTP {st}: {str(created)[:100]}"))
        continue
    wid = created["id"]
    st, act = api(f"/api/v1/workflows/{wid}/activate", "POST", {})
    msg = ""
    if isinstance(act, dict):
        msg = act.get("message", "")
    if st == 200 and isinstance(act, dict) and act.get("active") is True:
        AVAILABLE.append(t)
    elif "Unrecognized node type" in msg:
        MISSING.append((t, "Unrecognized node type"))
    elif "Missing required credential" in msg:
        CRED_NEEDED.append((t, msg.split("Missing required credential:")[1].split()[0]))
    else:
        MISSING.append((t, (msg or str(act))[:100]))
    api(f"/api/v1/workflows/{wid}", "DELETE")

print("=== ✅ AVAILABLE NOW ===")
for t in AVAILABLE: print("  ", t)
print("\n=== 🔑 EXISTS but needs credential ===")
for t, c in CRED_NEEDED: print(f"   {t}  → credential: {c}")
print("\n=== ❌ MISSING / excluded ===")
for t, m in MISSING: print(f"   {t}\n       {m}")
