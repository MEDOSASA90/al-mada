# Al-Mada — منصة SaaS لإدارة العيادات والمراكز الطبية

> **المَدَى** — المسار المستقبلي للعيادات الطبية في مصر

---

## 🎯 نظرة عامة

**Al-Mada** هي منصة SaaS متكاملة لإدارة العيادات والمراكز الطبية في مصر، تجمع بين:

- 📱 **حجز مواعيد ذكي** — واتساب، ويب، تطبيق موبايل
- 📄 **ملف مريض إلكتروني شامل** — تشخيص، روشتة، تحاليل
- 💊 **روشتة ذكية بالصوت** — إملاء صوتي باللهجة المصرية
- 🤖 **مساعد طبيب AI** — تلخيص، قراءة تقارير، تنبيهات دوائية
- 📊 **تقارير مالية وتشغيلية** — صافي الربح، إشغال المواعيد
- 🤝 **تكامل واتساب** — رسائل رسمية من Meta
- 💳 **دفع متعدد** — Paymob, InstaPay, Fawry, Vodafone Cash

---

## 🏗️ البنية التقنية

### الطبقات
| الطبقة | التقنية |
|--------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + RLS + Realtime + Storage) |
| **AI & Automation** | n8n (Self-Hosted) + OpenAI (GPT-4o + Whisper) |
| **Messaging** | WhatsApp via n8n (Evolution API / WhatsApp Cloud API) |
| **Payments** | Paymob + InstaPay + Fawry + Vodafone Cash |

### قاعدة البيانات
- 13+ جداول أساسية
- Row-Level Security (RLS)
- Audit Logs
- Data Isolation

---

## 🚀 المراحل المخططة

### المرحلة 0 — اكتشاف المستودع والتصميم ✅
- [x] فحص المستودع والتقنيات الحالية
- [x] إنشاء تقرير الحالة
- [x] حصر المتطلبات والتعارضات
- [x] توثيق architecture decisions
- [x] تحديد طريقة تشغيل محلية وبيئة اختبار
- [x] اختيار اسم المنصة: **Al-Mada**
- [x] تجهيز القرارات المفتوحة

### المرحلة 1 — أساس التطبيق
- [ ] إعداد المشروع
- [ ] إعداد CI/CD
- [ ] إدارة الأسرار
- [ ] قاعدة البيانات والترحيلات
- [ ] تسجيل الأخطاء والمراقبة

### المرحلة 2 — الهوية وعزل العيادات
- [ ] تسجيل الدخول
- [ ] نموذج العيادات والمستخدمين
- [ ] سياسات عزل البيانات
- [ ] اختبارات العزل
- [ ] سجل تدقيق

### المرحلة 3 — النواة التشغيلية
- [ ] الفروع والأطباء
- [ ] ملفات المرضى والزيارات
- [ ] الفواتير والحسابات
- [ ] تقارير أساسية

### المرحلة 4 — الملفات والتعافي والتصدير
- [ ] رفع وتنزيل آمن
- [ ] النسخ الاحتياطي والاستعادة
- [ ] تصدير البيانات
- [ ] سياسة الاحتفاظ والحذف

### المرحلة 5 — الاشتراكات والتكاملات
- [ ] خطط الاشتراك
- [ ] اختبار الدورة
- [ ] تكامل الدفع
- [ ] تكامل واتساب

### المرحلة 6 — الذكاء الاصطناعي
- [ ] أساس البنية الهجينة
- [ ] مساعد الطبيب
- [ ] المساعد الإداري
- [ ] مساعد الاستقبال

### المرحلة 7 — الإطلاق التجريبي
- [ ] اختبار أمني
- [ ] تجربة ببيانات وهمية
- [ ] مراقبة الأعطال
- [ ] توثيق التشغيل

### المرحلة 8 — التوسع
- [ ] إطلاق تدريجي
- [ ] مراجعة التكلفة
- [ ] إضافة الميزات المتقدمة

---

## 📋 القرارات الأساسية

### AI Providers
- **التوصية:** طبقة تجريد (`lib/ai/provider.ts`) + Groq مجاني في التطوير
- **السبب:** صفر تكلفة + قابلية تبديل المزود (§28.5) + لا بيانات صحية قبل إشعار قانوني

### n8n Hosting
- **القرار:** الـ VPS الموجود (شغال بالفعل ✅)
- **السبب:** متاح ومركّب عليه API key — مش محتاج SSH ولا فلوس

### Monitoring
- **Sentry Free** + Vercel Analytics + n8n health + Telegram alerts
- Grafana/Prometheus مؤجَّل (مش محتاجين على VPS صغير)

### Database
- **Supabase Free** (`eu-central-1` Frankfurt) — بيانات وهمية فقط حتى المراجعة القانونية
- ⚠️ Supabase مفيش منطقة مصر → بند residency مفتوح (ADR-003)

### Hosting
- **Vercel** للتطوير/PR previews (Hobby = غير تجاري)
- **الإنتاج التجاري:** self-host على الـ VPS (نفس البناء، تكلفة حدية $0) — راجع ADR-002

### Payments
- **Paymob** (إيرادات) + **InstaPay** (تحصيل مرضى) — بعد بوابة ب

### RPO/RTO
- **RPO:** 1 ساعة · **RTO:** 4 ساعات
- ⚠️ Free tier مفيش PITR → موثّق كحد، سبب إضافي لحسم Plan قبل الإنتاج

### اسم المنصة
- **Al-Mada** — يعني "المَدَى" (المسار/المستقبل)
- **URL:** `al-mada.eg` (لاحقًا) / `*.vercel.app` (مرحليًا)

---

## 📁 هيكل المستودع

```
al-mada/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── apps/
│   ├── web/                    # Next.js Frontend
│   └── api/                    # Next.js API Routes
├── packages/
│   ├── ui/                     # shadcn/ui components
│   └── db/                     # Database helpers
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── n8n/
│   ├── workflows/
│   └── credentials.json
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── .env.example
├── .env.local
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔧 متطلبات التشغيل

### Local Development
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Setup Supabase
npx supabase init
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# Run migrations
npx supabase db reset

# Start development server
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# n8n
N8N_WEBHOOK_URL=https://your-n8n-domain.com
N8N_API_KEY=your_n8n_api_key

# Paymob
PAYMOB_MERCHANT_CODE=your_paymob_code
PAYMOB_API_KEY=your_paymob_api_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id
```

---

## 📖 التوثيق

- **[تقرير الحالة الحالية](./CURRENT_STATE_REPORT.md)** — تقرير شامل للمشروع
- **[حالة التنفيذ](./IMPLEMENTATION_STATUS.md)** — حالة المراحل الحالية
- **[القرارات المفتوحة](./OPEN_DECISIONS_FINAL.md)** — القرارات والتوصيات
- **[المرجع الكامل](./README_START_HERE_AR.md)** — دليل البدء

---

## 🤝 المساهمين

هذا مشروع من صميم **Mahmoud Khamis** — مالك المنصة.

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر (Open Source) — راجع ملف `LICENSE` للمزيد من التفاصيل.

---

## 📞 التواصل

- **الموقع:** al-mada.eg
- **البريد:** support@al-mada.eg
- **واتساب:** +20 XXX XXX XXXX

---

## 🙏 الشكر

- **OpenAI:** للـ GPT-4o و Whisper
- **Supabase:** لقاعدة البيانات السحابية
- **n8n:** للأتمتة والذكاء الاصطناعي
- **shadcn/ui:** للواجهات الرسومية
- **Tailwind CSS:** للتصميم السريع

---

**تم التطوير بواسطة Hermes Agent**
**التاريخ:** 2026-11-03
**الحالة:** ✅ المرحلة 0 — اكتشاف المستودع والتصميم مكتملة
