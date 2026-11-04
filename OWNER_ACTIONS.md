# إجراءات صاحب المشروع — Al-Mada

**تاريخ:** 2026-11-04
**الحالة:** 5 توكينات مطلوبة لإغلاق المرحلة 0
**طريقة التسليم:** ابعتهم كلهم في رسالة واحدة — هخزنهم في `.env.local` (في `.gitignore`) + n8n credentials. **مش هيدخلوا الكود ولا Git أبداً.**

> ⚠️ أي توكين تقدر تلغيه في ثانية من نفس الصفحة اللي عملته منها. لو اتسرّب ابعتهولي فوراً.

---

## ✅ ملخص

| # | الخدمة | الرابط | يفتح إيه | إلزامي؟ |
|---|---|---|---|---|
| 1 | Supabase Access Token | https://supabase.com/dashboard/account/tokens | إنشاء المشروع + migrations + كل صلاحيات DB | **إلزامي** |
| 2 | Vercel Token | https://vercel.com/account/tokens | إنشاء/ربط المشروع + env vars + النشر | **إلزامي** |
| 3 | GitHub PAT | https://github.com/settings/personal-access-tokens/new | إنشاء repo + push + CI | **إلزامي** |
| 4 | Telegram bot token | https://t.me/BotFather | إشعارات n8n + التنبيهات | **إلزامي** |
| 5 | Groq API key | https://console.groq.com/keys | Whisper (ستات) + LLM (نصوص) | مستحسن |
| 6 | Gemini API key (بديل) | https://aistudio.google.com/apikey | قراءة صور التحاليل (vision) | اختياري |

---

## 1️⃣ Supabase Access Token

**الرابط:** https://supabase.com/dashboard/account/tokens

**الخطوات:**
1. سجّل دخول لـ https://supabase.com/dashboard
2. لو مفيش organization لسه → في الـ sidebar اضغط **New organization** → سمّيها `Al-Mada` → Create
3. ارجع لصفحة **Access Tokens** → اضغط **Generate new token**
4. **Token name:** `al-mada-agent`
5. **Scope:** اختار الـ organization بتاع `Al-Mada` (مش Full Account — أأمن وكافي)
6. **Permissions:** فعّل كل الصلاحيات على الـ organization (خصوصاً `Create project` + `Database` + `SQL`)
7. اضغط **Generate token**
8. ⚠️ **انسخ التوكن فوراً** — مش هيبان تاني

**شكله:** يبدأ بـ `sbp_` (مثال: `sbp_1234abcd...`)
**اللي هعمله بيه:** إنشاء project في منطقة `eu-central-1` (Frankfurt) · تنفيذ الـ 5 migrations · سحب `anon key` + `service_role key` · إنشاء Storage buckets · ضبط password الـ DB · إنشاء credential الـ postgres في n8n · تشغيل اختبارات العزل.

---

## 2️⃣ Vercel Token

**الرابط:** https://vercel.com/account/tokens

**الخطوات:**
1. سجّل دخول لـ https://vercel.com (لو مفيش حساب → اعمل واحد؛ أسهل ربط بـ GitHub)
2. من الـ sidebar → **Settings** → **Account Tokens** أو مباشرة الرابط فوق
3. اضغط **Create Token**
4. **Token Name:** `al-mada-agent`
5. **Scope:** **Full Account** (لأن المشروع لسه مش موجود — الـ project-scoped محتاج مشروع موجود الأول)
6. **Expiration:** سنة (أو Longer)
7. اضغط **Create Token**
8. ⚠️ **انسخه فوراً** — القيمة تظهر مرة واحدة بس

**شكله:** سلسلة عشوائية طويلة (مثال: `abc123XYZ_def456...`)
**اللي هعمله بيه:** إنشاء مشروع Al-Mada وربطه بـ GitHub · ضبط `NEXT_PUBLIC_SUPABASE_*` و `OPENAI/GROQ_*` و `N8N_*` كـ env vars · النشر التلقائي عند كل merge · Preview لكل PR.

> ℹ️ Vercel Hobby = مجاني لكن **غير تجاري**. هنستخدمه للتطوير والـ previews. للإنتاج التجاري هنـ self-host على الـ VPS (ADR-002). الكود واحد.

---

## 3️⃣ GitHub PAT

### أولاً: اعمل المستودع (عشان نعمل token مقيد عليه)
1. https://github.com/new
2. **Owner:** `MEDOSASA90`
3. **Repository name:** `al-mada`
4. ☑️ **Private**
5. ⚠️ **متعملش** أي checkbox من قوالب الـ README/.gitignore/license — عشان الـ repo يفضل فاضي وأنا أعمله من الصفر
6. **Create repository**

### ثانياً: اعمل التوكن (Fine-grained — مستحسن)
**الرابط:** https://github.com/settings/personal-access-tokens/new

1. **Token name:** `al-mada-agent`
2. **Expiration:** 90 يوم (أو أكتر)
3. **Resource owner:** `MEDOSASA90`
4. **Repository access:** **Only select repositories** → اختر `al-mada`
5. **Repository permissions:**
   | Permission | Access | ليه |
   |---|---|---|
   | **Contents** | Read and write | عشان أعمل push |
   | **Workflows** | Read and write | عشان CI يشتغل |
   | **Metadata** | Read-only (تلقائي) | — |
   | Administration | Read-only | اختياري (لأقفل_protection rules) |
6. **Generate token**
7. ⚠️ **انسخه فوراً**

**شكله:** يبدأ بـ `github_pat_`

### بديل (Classic — أبسط لو عايز)
**الرابط:** https://github.com/settings/tokens/new
1. Note: `al-mada-agent` · Expiration: 90 days
2. ☑️ `repo` · ☑️ `workflow`
3. **Generate token** → انسخه (يبدأ بـ `ghp_`)

**اللي هعمله بيه:** إنشاء branches · commit + push لكل تغيير · فتح PR · CI (lint + typecheck + test + build) · نشر تلقائي لـ Vercel.

---

## 4️⃣ Telegram Bot Token

**الرابط:** https://t.me/BotFather

**الخطوات:**
1. افتح Telegram → ابحث `@BotFather` → **Start**
2. ابعت `/newbot`
3. **Bot display name:** `Al-Mada Alerts`
4. **Username:** `AlMadaAlertsBot` (لازم ينتهي بـ `bot` و يكون فريد عالمياً — لو محجوز جرّب `AlMadaOpsBot` أو `AlMadaEgyptBot`)
5. هيرد عليك:
   ```
   Use this token to access the HTTP API:
   1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
   ```
6. انسخ الرقم كامل وابعتهولي

**شكله:** `<رقم>:<سلسلة>`
**اللي هعمله بيه:** credential نوع `telegramApi` في n8n · تنبيهات فشل الـ workflows · إشعارات التذكيرات · تقرير يومي للإيرادات (n8n workflow #7 في المخطط).

### (اختياري لكن مستحسن) قناة التنبيهات
1. في Telegram اعمل **New Channel** → سمّيها `Al-Mada Ops`
2. ضيف البوت كـ **administrator**
3. ابعت أي رسالة في القناة
4. هبجيب الـ chat id بنفسي من الـ API — **مش محتاج تبعتلي حاجة**

---

## 5️⃣ Groq API Key

**الرابط:** https://console.groq.com/keys

**الخطوات:**
1. سجّل دخول (حساب Google كافي — **مش محتاج كارت ائتمان**)
2. من الـ sidebar → **API Keys**
3. **Create API Key**
4. **Name:** `al-mada-dev`
5. **Session:** اتركه فاضي (default)
6. **Generate API Key** → انسخه فوراً

**شكله:** يبدأ بـ `gsk_`
**اللي هعمله بيه:** credential نوع `groqApi` في n8n · node `lmChatGroq` · **Whisper (`whisper-large-v3`)** لتحويل كلام الطبيب باللهجة المصرية لنص · `llama-3.3-70b-versatile` للتلخيص والصياغة.

**الحد المجاني:**、抓 حدود استخدام سخية — كافي لتطوير كامل. وببيانات وهمية فقط لحد المراجعة القانونية.

---

## 6️⃣ (اختياري) Gemini API Key — للقراءة البصرية للتحاليل

**الرابط:** https://aistudio.google.com/apikey

1. سجّل دخول بـ Google
2. **Create API key** → الاسم `al-mada-dev` → Create
3. انسخه (`AIza...`)

**اللي هعمله بيه:** استخراج قيم التحاليل من صور (اسم الفحص، القيمة، الوحدة، المدى المرجعي، التاريخ) مع ربط كل قيمة بموضعها في الصورة ووسم عدم اليقين — حسب `AI_ASSISTANTS_REQUIREMENTS.md` §10.6.

---

## 📤 شكل الرسالة اللي تبعتها

```
Supabase: sbp_xxxxxxxxxxxxxxxx
Vercel:   xxxxxxxxxxxxxxxxxxxx
GitHub:   github_pat_xxxxxxxxxxxxx
Telegram: 1234567890:AAHxxxxxxxxxxxx
Groq:     gsk_xxxxxxxxxxxxxxxx
Gemini:   AIzaSyXXXXXXXXXXXX        (اختياري)
```

---

## 🔒 وين هتخزن

| المكان | التأمين |
|---|---|
| `/opt/data/al-mada/.env.local` | `.gitignore` — مش بيت pushing |
| n8n credentials | مش plain text في الـ workflows |
| Supabase / Vercel / GitHub env vars | encrypted عند المزود |
| **الكود** | ❌ **ممنوع منعاً باتاً** — كل الأSecrets من `process.env` |

**قاعدة:** `.env.example` في الـ repo فيه placeholders فاضية فقط، والمتحقق من `git grep` على أي secret قبل كل commit.

---

## ❌ اللي مش محتاجه دلوقتي

| بند | ليه مش دلوقتي |
|---|---|
| SSH على VPS | n8n API key كافي لإنشاء الـ workflows والـ credentials |
| Paymob merchant account | يحتاج ورق تجاري — بند الإطلاق |
| Meta Business / WhatsApp Cloud | يحتاج Meta verification — بند الإطلاق |
| دومين `.eg` | بند الإطلاق — دلوقتي `*.vercel.app` |
| Vercel Pro ($20) | بند الإطلاق التجاري — دلوقتي Hobby + self-host |
| Supabase Pro ($25) | بند الإنتاج (PITR + مفيش pausing) |
| أي حساب AI مدفوع | Groq/Gemini المجانيين يكفوا للتطوير |
