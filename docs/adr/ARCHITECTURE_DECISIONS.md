# قرارات معمارية (ADR) — Al-Mada

**تاريخ:** 2026-11-04
**الحالة:** مُعتمدة كقرار تنفيذ، مع بنود معلّقة مُعلّمة بوضوح
**المرجع:** `docs/clinic_saas_blueprint_v2.md` §2 · §25 · §31 · `docs/DECISION_LOG.md` · `docs/FINAL_PACKAGE_REVIEW_AR.md`

---

## ADR-001 — طبقات النظام الأربع (مؤكَّد)

| الطبقة | المورد | الحساب / الوصول | ملاحظات |
|---|---|---|---|
| **المشروع (Source of Truth)** | **GitHub** | `MEDOSASA90/al-mada` | كل commit + PR + CI. مستودع واحد. |
| **الواجهة والتطبيق** | **Vercel** (App Router) | Hobby → Pro | راجع ADR-002 |
| **قاعدة البيانات** | **Supabase** (PostgreSQL + RLS + Auth + Storage + Realtime) | Free tier | راجع ADR-003 |
| **الأتمتة و AI** | **n8n** — على الـ VPS الموجود | Self-hosted | ✅ وصول جاهز |

**السبب:** مطابق لـ §2 من المخطط بالظبط. لا طبقة خامسة، لا service إضافي.

---

## ADR-002 — الاستضافة: Vercel Hobby في التطوير، وخيار مُوثَّق للإطلاق التجاري

### المشكلة
**Vercel Hobby = استخدام غير تجاري فقط.** نص شروط الاستخدام:
> *"You shall only use the Services under a Hobby plan for your personal or non-commercial use."*
> Fair Use: *"All commercial usage of the platform requires either a Pro or Enterprise plan."*

Al-Mada منتج مدفوع (اشتراكات عيادات + تحصيل) → **استخدام تجاري**. فـ Hobby غير صالح للإطلاق التجاري.

### القرار
| المرحلة | الاستضافة | التكلفة | ملاحظات |
|---|---|---|---|
| تطوير / PR previews | Vercel Hobby | $0 | لا حقيقي ولا بيانات مرضى — بيانات وهمية فقط |
| **staging** | Vercel Hobby | $0 | بيئة اختبار داخلية، بيانات وهمية |
| **Production (إطلاق تجريبي مدفوع)** | **self-host على الـ VPS الموجود** (Next.js standalone + Docker + Caddy) | **$0 إضافي** | الـ VPS مدفوع أصلًا → تكلفة حدية صفر. داخل مصر. تجاري مسموح. |

**التطبيق:** `next.config.js` بـ `output: 'standalone'` → نفس البناء ينفع لـ Docker **ولـ** Vercel. التحويل = أمر واحد.
- إن أراد Vercel في الإنتاج لاحقًا: Pro بـ $20/شهر → سطر في `vercel.json` + نفس الكود.
- الـ code-path واحد → صفر إعادة كتابة.

### البدائل المرفوضة
| البديل | السبب |
|---|---|
| Cloudflare Pages (مجاني، تجاري مسموح) | مقبول كبديل، لكن Vercel أقرب لطلب المالك وأسرع في الـ SSR |
| Netlify Free | نفس القيد تقريبًا + بطء الـ SSR |
| Railway / Render | مجاني لفترة محدودة فقط، ثم مدفوع |

### الأثر
- ✅ صفر تكلفة حتى الإطلاق.
- ✅ البيع من مصر بدون مخالفة شروط Vercel.
- ⚠️ VPS يبقى point of failure وحامل لـ n8n + التطبيق. خطة: إما VPS أكبر، أو Vercel Pro.

---

## ADR-003 — قاعدة البيانات: Supabase، ببيانات وهمية فقط حتى إشعار قانوني

### القرار
- **Supabase Free**: مشروعان · 500MB DB · 1GB storage · 50k MAU · API requests غير محدودة · 5GB egress. تكلفة $0.
- **المنطقة:** `eu-central-1` (Frankfurt) — الأقرب لقدماء مصرين متاح اليوم.
- **الاستخدام:** تطوير + staging + تجريبي، **ببيانات اصطناعية فقط**.

### ⚠️ بند residency (مهم — لا يُتجاهل)
**Supabase لا يوجد له منطقة الشرق الأوسط/مصر.** أقرب منطقة: Frankfurt / Paris / Mumbai. أي أن:
- البيانات الطبية الحقيقية **هتخرج من مصر** لو استُخدم Supabase للإنتاج.

وهذا يخالف §31.2:
> *"لا يُنقل أي سجل طبي أو بيانات تعريفية إلى خدمة ذكاء اصطناعي أو تحليلات أو دعم خارج مصر قبل تقييم النقل عبر الحدود..."*
> و*"البيانات الطبية الحقيقية تبقى محلية افتراضيًا إلى حين الموافقة القانونية المكتوبة."*

### المسار المتفق عليه
| المرحلة | قاعدة البيانات | البيانات |
|---|---|---|
| تطوير / staging / اختبار القبول | Supabase Free | **اصطناعية فقط** (§31.2 بند 6) |
| **بوابة: قبل بيانات مرضى حقيقية** | قرار ADR مستقل | محتاج: مراجعة قانونية + إما (أ) Postgres داخل مصر (Raya/Link/EGIT/WE Data)، أو (ب) موافقة مكتوبة على النقل + DPA |
| إطلاق تجريبي مدفوع | يُحسم في الـ ADR ده | حسب نتيجة المراجعة القانونية |

###('/', اجعل) Portability شرطًا تصميميًا
كل الـ schema **Postgres قياسي** (تفاصيل في `DATA_MODEL_REVIEW.md` §8): لا `pg_graphql`، Storage عبر REST عادي + signed URLs، Auth layer منفصل. الانتقال = تغيير connection string + auth provider.

### ⚠️ Free tier gotcha
المشاريع المجانية **تُوقف بعد أسبوع خمول**. الحل: cron يومي (n8n) يعمل ping للاستخدام، أو ترقية لاحقًا. مسجّل في `OPERATIONS.md`.

---

## ADR-004 — GitHub كمرجع المشروع الوحيد

- المستودع: `MEDOSASA90/al-mada` (private).
- **كل تعديل** يبدأ بـ `git pull` وينتهي بـ `commit + push` — نفس قاعدة مشروع Al3bara.
- CI (GitHub Actions، مجاني: 2,000 دقيقة/شهر):
  1. `npm ci`
  2. `npm run lint` (ESLint)
  3. `npm run typecheck` (`tsc --noEmit`)
  4. `npm run test` (Vitest — وحدة + عزل RLS)
  5. `npm run build`
  6. `supabase db lint` + فحص migrations
- كل بوابة مرحلة (IMPACTATION_PLAN) = PR + CI أخضر + تحديث `IMPLEMENTATION_STATUS.md`.
- Vercel: Preview لكل PR تلقائيًا → مراجعة قبل merge.

---

## ADR-005 — مزود الذكاء الاصطناعي: طبقة تجريد + مجاني في التطوير

### القرار
طبقة `lib/ai/provider.ts` بواجهة واحدة، implementations متعددة — إلزامي (§28.5: *"تجنب ربط منطق المنتج بمزود واحد قدر الإمكان"*).

| المرحلة | المزود | التكلفة | البيانات |
|---|---|---|---|
| تطوير / staging | **Groq** (مجاني) — `whisper-large-v3` للستات، `llama-3.3-70b` للنصوص | $0 | اصطناعية فقط |
| اختبارات بصرية (تحاليل) | **Google AI Studio / Gemini** (مجاني) | $0 | اصطناعية فقط |
| الإنتاج | يُحسم بعد مراجعة §31.4 / §31.2 | $ | بعد البوابة القانونية |
| whisper محلي | على الـ VPS (faster-whisper / whisper.cpp) | $0 | Alternative للخصوصية |

**ملاحظة cost-aware:** في `AI_ASSISTANTS_REQUIREMENTS.md` §9 يُشترط تسجيل التكلفة والحدود لكل عيادة → `ai_usage_log` + `usage_events` مبنية من اليوم الأول، حتى لو المزود مجاني دلوقتي (بيبقى عنده baselineCost صفر وقابل للقياس).

### ❌ ممنوع في كل الأحوال (§31.4)
- تشخيص/روشتة نهائية بلا اعتماد طبيب.
- تعديل جرعة أو إيقاف دواء آليًا.
- إرسال بيانات صحية لمزود خارجي قبل إشعار قانوني.
- عرض تنبيه دوائي بلا مصدر موثّق (`ai_reference_claims`).

---

## ADR-006 — واتساب: adapter + Evolution API أولاً

| الخيار | التكلفة | التعقيد | القرار |
|---|---|---|---|
| **Evolution API** (self-hosted على الـ VPS) | $0 | ⚠️ unofficial → خطر حظر رقم | **الافتراضي للتطوير** — sandbox فقط |
| WhatsApp Cloud API (Meta) | free tier ~1000 محادثة/شهر | يحتاج Meta Business + قالب معتمد | **للإنتاج** — بعد إشعار + موافقة (§28.2) |

**القرار:** `lib/whatsapp/provider.ts` بواجهة `sendTemplate()`. Evolution API يبقى adapter واحد، Cloud API الثاني. n8n owns orchestration (§9).

**قاعدة DEC-004:** لا تفاصيل طبية في إشعار واتساب عادي — نص مختصر + رابط لبوابة آمنة بعد تحقق الهوية.

---

## ADR-007 — الدفع: adapter + Paymob لاحقًا

- `lib/payments/provider.ts` — واجهة `createCharge()`, `verifyWebhook()`, `refund()`.
- **Paymob** (الإيرادات) + **InstaPay** (تحصيل المرضى) — التوصية القائمة.
- ⚠️ بوابة ب: قبل تحصيل أموال حقيقية → اختبار تكرار/فشل/استرداد/تسوية + مطابقة سجلات التطبيق مع مزود الدفع.
- **الآن:** development فقط، `mock` provider + اختبارات idempotency.

---

## ADR-008 — المراقبة (مجانية)

| الأداة | الدور | التكلفة |
|---|---|---|
| **Sentry** (Free tier: 5,000 errors/شهر) | أخطاء Next.js (server + client) | $0 |
| **Vercel Analytics** | performance + usage | $0 |
| **n8n executions + health webhook** | صحة الأتمتة | $0 (الموجود) |
| **Supabase logs / usage dashboard** | DB + quotas | $0 |
| **Telegram Bot** | تنبيهات فورية | $0 |
| Grafana + Prometheus | ❌ **مؤجَّل** — زيادة تشغيل بلا فائدة على VPS صغير. يُضاف لو الـ VPS كبر | $0 |

**⚠️ Sentry Free gotcha:** Hobby/on Hobby، VercelLogs يضيف Sentry DSN تلقائيًا — مفيش config إضافي.

---

## ADR-009 — RPO / RTO

| المؤشر | القيمة | التنفيذ |
|---|---|---|
| **RPO** | 1 ساعة | Supabase: PITR من Pro (غير متاح مجانًا) → بديل: `pg_dump` يومي + WAL/PITR على البودكاست عند الترقية. **ملاحظة: Free tier لا يضمن PITR** → موثّق كحد. |
| **RTO** | 4 ساعات | استعادة من dump + redeploy (Vercel rollback فوري) |
| النسخ | قاعدة بيانات: يومي (أكبر) · ملفات Storage: يومي · n8n workflows: يومي (JSON export) | كلها مجانية |

**⚠️ قيد حقيقي:** Free tier بيوقف المشروع بعد أسبوع خمول + مفيش PITR → ده سبب إضافي للـ ADR-003 (حسم Residency/Plan قبل الإنتاج).

---

## ADR-010 — عدم البدء بمزايا المتجر والمزايا المتقدمة

§26.10 + §26.7: *"لا تبدأ بسوق شامل قبل إثبات الطلب."*
**خارج نطاق الإصدار الأول:** متجر المستلزمات · شبكة المعامل · دليل الحجز العام · نظام النقاط · برنامج المسوقين (affiliates يُبني كجداول فقط، بدون واجهة).
**خارج نطاق الإصدار الأول:** telemedicine · Family Account/Wallet.
**يُبنى كجداول فقط:** `saas_affiliates`, `affiliate_commissions` — بلا كود واجهة.

---

## ملخص البنود المعلّقة (تحتاج صاحب المشروع)

| # | البند | الأثر | متى |
|---|---|---|---|
| **P1** | مراجعة قانونية: نقل بيانات صحية خارج مصر (§31.2, 151/2020 + 816/2025) | يمنع الإنتاج على Supabase | **قبل** أي بيانات مرضى حقيقية |
| **P2** | Vercel Pro ($20/شهر) ولا self-host على VPS للإطلاق التجاري | hosting | عند الإطلاق |
| **P3** | مزود AI للإنتاج + مراجعة §31.4 | AI features | عند الإطلاق |
| **P4** | WhatsApp: Evolution API (sandbox) ولا Cloud API | messaging | عند الإطلاق |
| **P5** | Paymob merchant account (ورق تجاري) | payments | قبل تحصيل |
| **P6** | دومين `.eg` (أو `.com`) بدل `*.vercel.app` | branding | عند الإطلاق |
| **P7** | RPO/RTO النهائي بعد قياس حجم البيانات الحقيقي | backups | بعد أول شهر تشغيل |
| **P8** | مصدر بيانات الأدوية (§31.1 — ترخيص مكتوب من EDDB) | feature | قبل تفعيل feature flag الأدوية |
| **P9** | تسمية «Clinic» في كل الباقات + هل محاسب داخل أم خارج | RBAC | Phase 2 |

---

**المراجع:** blueprint §2, §9, §11, §25, §26.7, §26.10, §28.5, §31.1–31.6 · DECISION_LOG · FINAL_PACKAGE_REVIEW · `ROLE_PERMISSION_MATRIX.md` · `DATA_MODEL_REVIEW.md`
