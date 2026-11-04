# حالة التنفيذ — Al-Mada

**آخر تحديث:** 2026-11-04
**المرحلة الحالية:** 0 — اكتشاف المستودع والتصميم (قرب الإغلاق)
**الملفات في:** `/opt/data/clinic_saas_agent_handoff/`

---

## المرحلة 0 — اكتشاف المستودع والتصميم

### ✅ المكتمل

| # | المطلوب | الحالة | المخرج |
|---|---|---|---|
| 1 | فحص المستودع والتقنيات | ✅ | لا يوجد مستودع — المشروع من الصفر |
| 2 | `CURRENT_STATE_REPORT.md` | ✅ | 16,138 حرف |
| 3 | `ROLE_PERMISSION_MATRIX.md` | ✅ | 12,065 حرف — 11 دور × 5 مجموعات موارد |
| 4 | `DATA_MODEL_REVIEW.md` | ✅ | 14,665 حرف — 20 مشكلة + 60 جدول + 5 migrations + RLS |
| 5 | `docs/adr/ARCHITECTURE_DECISIONS.md` | ✅ | 13,020 حرف — 10 ADR |
| 6 | تجهيز القرارات المفتوحة | ✅ | `OPEN_DECISIONS_FINAL.md` (11,744 حرف) |
| 7 | اختيار اسم المنصة | ✅ | **Al-Mada** |
| 8 | التحقق من البيئة والوصول | ✅ | n8n API ✅ · Node 26 ✅ · Supabase/Vercel/GitHub APIs reachable ✅ |

### 🔍 نتائج فحص n8n (حقيقية)

**الوصول:** `N8N_URL` + `N8N_API_KEY` شغالين — workflows + credentials + users + production webhooks.

**Nodes المتاحة:**
- ✅ جاهزة: `code`, `set`, `if`, `switch`, `merge`, `splitInBatches`, `wait`, `respondToWebhook`, `noOp`
- ✅ LangChain: `agent`, `chainLlm`, `chainSummarization`, `memoryBufferWindow`, `documentDefaultDataLoader`, `chainRetrievalQa`, `textSplitter`
- 🔑 موجودة وتحتاج credential: `ssh`, `postgres`, `telegram`, `emailSend`, `gmail`, `whatsApp`, `openAi`, `lmChatOpenAi`, `lmChatAnthropic`, `lmChatGoogleGemini`, `lmChatGroq`, `lmChatOllama`, `memoryPostgresChat`, `embeddingsOpenAi`, `vectorStoreSupabase`, `embeddingsGoogleGemini`
- ❌ مستبعدة: `executeCommand`, `mysql` (القابل للاستبدال بـ `ssh` + `postgres`)

**القيود المكتشفة:**
- `code` node sandboxed — `require('fs')` و `require('child_process')` ممنوعين → لا shell من Code node
- `webhookUrl` / `testUrl` مش مرجوعين من الـ API → نبنيها بأنفسنا: `{N8N_URL}/webhook/{path}`
- `POST /api/v1/credentials` **يعمل** → نقدر ننشئ credentials بأنفسنا
- تفعيل الـ workflow: `POST /api/v1/workflows/{id}/activate` (مش PUT/PATCH)

### ⏳ متبقي للمرحلة 0

- [ ] استلام: Supabase PAT · Vercel token · GitHub PAT · Telegram bot token · Groq key
- [ ] إنشاء مشروع Supabase + region + migrations M1..M5
- [ ] إنشاء مستودع GitHub + CI
- [ ] ربط Vercel + env vars
- [ ] إنشاء n8n credentials (Supabase postgres, telegram, ai) + أول workflow اختباري
- [ ] `seed.sql` ببيانات وهمية
- [ ] اختبار عزل RLS (T1..T10 من مصفوفة الصلاحيات)

---

## البنية المعتمدة (ADR)

```
GitHub (MEDOSASA90/al-mada)   ← مصدر الحقيقة + CI
        │
        ├── Vercel              ← Frontend/SSR (تطوير + previews)
        ├── Supabase (Free)     ← PostgreSQL + RLS + Auth + Storage
        └── n8n (VPS موجود)     ← Workflows + AI + WhatsApp
```

**قاعدة Git:** أي تعديل يبدأ `git pull` وينتهي `commit + push`.

---

## المراحل التالية

| # | المرحلة | الحالة |
|---|---|---|
| 0 | اكتشاف المستودع والتصميم | 🟡 90% |
| 1 | أساس التطبيق (مشروع، CI، أسرار، DB، monitoring) | ⬜ |
| 2 | الهوية وعزل العيادات | ⬜ |
| 3 | النواة التشغيلية (مواعيد/مرضى/كشوف/فواتير) | ⬜ |
| 4 | الملفات والتعافي والتصدير | ⬜ |
| 5 | الاشتراكات والدفع وواتساب | ⬜ |
| 6 | الذكاء الاصطناعي (طبيب → إداري → استقبال) | ⬜ |
| 7 | الإطلاق التجريبي | ⬜ |
| 8 | التوسع | ⬜ |

---

## ⚠️ بنود معلّقة (تحتاج صاحب المشروع)

| # | البند | متى |
|---|---|---|
| P1 | مراجعة قانونية نقل بيانات صحية خارج مصر (151/2020 + 816/2025) | **قبل** بيانات مرضى حقيقية |
| P2 | Vercel Pro ($20/شهر) ولا self-host على VPS للإنتاج | عند الإطلاق |
| P3 | مزود AI للإنتاج | عند الإطلاق |
| P4 | WhatsApp: Evolution API ولا Cloud API | عند الإطلاق |
| P5 | Paymob merchant account | قبل تحصيل |
| P6 | دومين `.eg` | عند الإطلاق |
| P7 | RPO/RTO نهائي | بعد أول شهر |
| P8 | ترخيص EDDB للأدوية | قبل تفعيل feature flag |
| P9 | تسمية الأدوار (Clinic / محاسب داخل ولا خارج) | Phase 2 |

---

## سجل الأوامر والفحوصات المُنفذة

| الفحص | النتيجة |
|---|---|
| `unzip` | ❌ غير مثبّت → استخدمت Python `zipfile` |
| `node --version` / `npm --version` | ✅ v26.7.0 / 12.0.2 |
| `supabase --version` | ✅ 2.121.0 |
| `vercel --version` | ✅ 65.1.0 |
| `git --version` | ✅ 2.47.3 |
| `docker ps` | ❌ daemon مش شغال (مش محتاج حاليًا) |
| `ssh root@143.246.43.27` | ❌ Permission denied (مش محتاج — n8n API كافي) |
| n8n `/api/v1/workflows` | ✅ HTTP 200 |
| n8n `/api/v1/credentials` GET | ✅ HTTP 200 |
| n8n `/api/v1/credentials` POST | ✅ HTTP 200 (sshPassword, postgres, groqApi, openAiApi, httpHeaderAuth) |
| n8n activate workflow | ✅ HTTP 200 (`/activate` endpoint) |
| n8n production webhook call | ✅ HTTP 200 (استجابة JSON) |
| n8n Code node shell | ❌ sandboxed (`child_process` / `fs` disallowed) |
| `api.supabase.com` | ✅ reachable (401) |
| `api.vercel.com` | ✅ reachable (403) |
| `api.github.com` | ✅ reachable (401) |

---

**الحالة:** ✅ المرحلة 0 شبه مكتملة — متبقي 5 credentials من صاحب المشروع + إنشاء الموارد.
