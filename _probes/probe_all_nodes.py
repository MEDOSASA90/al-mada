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
    # core infra
    "n8n-nodes-base.executeCommand",
    "n8n-nodes-base.ssh",
    "n8n-nodes-base.postgres",
    "n8n-nodes-base.mysql",
    "n8n-nodes-base.readWriteFile",
    "n8n-nodes-base.noOp",
    "n8n-nodes-base.set",
    "n8n-nodes-base.code",
    "n8n-nodes-base.httpRequest",
    "n8n-nodes-base.webhook",
    "n8n-nodes-base.scheduleTrigger",
    "n8n-nodes-base.cron",
    "n8n-nodes-base.if",
    "n8n-nodes-base.switch",
    "n8n-nodes-base.merge",
    "n8n-nodes-base.splitInBatches",
    "n8n-nodes-base.wait",
    "n8n-nodes-base.respondToWebhook",
    # messaging / email / telegram
    "n8n-nodes-base.telegram",
    "n8n-nodes-base.emailSend",
    "n8n-nodes-base.gmail",
    "n8n-nodes-base.whatsApp",
    "n8n-nodes-base.evolutionApi",
    "n8n-nodes-base.httpbin",
    # ai
    "n8n-nodes-base.openAi",
    "n8n-nodes-base.whisper",
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
]

ok, bad = [], []
for t in CANDIDATES:
    wf = {
      "name": f"probe_{t.replace('.','_').replace('@','').replace('/','_')}",
      "nodes": [{"parameters": {}, "id": "n1", "name": "N", "type": t, "typeVersion": 1, "position": [250, 300]}],
      "connections": {},
      "settings": {"executionOrder": "v1"}
    }
    st, created = api("/api/v1/workflows", "POST", wf)
    if st != 200:
        bad.append((t, f"create HTTP {st}: {created}"))
        continue
    wid = created["id"]
    st, act = api(f"/api/v1/workflows/{wid}/activate", "POST", {})
    if st == 200 and isinstance(act, dict) and act.get("active") is True:
        ok.append(t)
    else:
        msg = act.get("message", str(act)) if isinstance(act, dict) else str(act)
        bad.append((t, msg[:120]))
    api(f"/api/v1/workflows/{wid}", "DELETE")

print("=== AVAILABLE (activated OK) ===")
for t in ok: print("  ✅", t)
print("\n=== NOT AVAILABLE ===")
for t, m in bad: print(f"  ❌ {t}\n       {m}")
