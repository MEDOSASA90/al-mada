# مراجعة نموذج البيانات — Al-Mada

**تاريخ:** 2026-11-04
**المرجع:** `docs/clinic_saas_blueprint_v2.md` §6 + §11 + §28 · `docs/DECISION_LOG.md` · `docs/FINAL_PACKAGE_REVIEW_AR.md`
**الحالة:** مراجعة قبل التنفيذ — المخطط الأصلي **نموذج أولي** وليس مخطط إنتاج (FINAL_PACKAGE_REVIEW §ملاحظات)

---

## 1. الخلاصة

مخطط §6 جيد كـ **نقطة بداية** (13 جدول، مفاتيح أجنبية، `clinic_id` في كل جدول). لكنه **لا يفي** بمتطلبات:

- §11.1 (نموذج البيانات الإضافي المطلوب) — **13 جدول ناقص بالكامل**
- §10.2 العزل — لا توجد قيود مركبة تمنع ربط سجل بعيادة بسجل عيادة أخرى
- §10.3 التدقيق — لا يوجد `audit_logs`
- AI §10.9 / §14 — لا يوجد سجل مسودات AI ولا سجل مهام AI ولا سجل تكلفة
- FINAL_PACKAGE_REVIEW — "بعض جداول قاعدة البيانات في المخطط نموذج أولي وليست مخططًا إنتاجيًا مكتملًا"

**القرار:** لا ننفّذ مخطط §6 كما هو. ننفّذ **46 جدولًا** موزعة على 5 migrations، مبنية على Postgres قياسي (قابلة للنقل إلى Postgres مستضاف في مصر لاحقًا).

---

## 2. مشاكل مخطط §6 (محددة)

| # | المشكلة | المخاطرة | المعالجة |
|---|---|---|---|
| P1 | `clinics.owner_user_id` بلا جدول عضويات | مستخدم واحد = عيادة واحدة | `user_clinic_memberships` + فصل `auth_user_id` عن العضوية (§10.1) |
| P2 | لا توجد قيود مركبة (composite FK) | ربط سجل عيادة A بسجل عيادة B | `UNIQUE (id, clinic_id)` + composite FK على كل علاقة |
| P3 | `staff_profiles.auth_user_id` يخلط الحساب بالعضوية | لا يمكن العمل في أكتر من عيادة | نقل إلى `user_clinic_memberships` |
| P4 | لا `audit_logs` | مخالفة §10.3 | جدول سجل تدقيق مركزي، append-only |
| P5 | `medical_records` قابلة للكتابة فوق السعر | محو تاريخ التعديل | `medical_record_versions` + trigger يمنع UPDATE يمحو |
| P6 | `qr_access_token` دائم | تسريب سجل طبي بمجرد تسريب الرابط | رمز عشوائي 32+ byte + `expires_at` + حد أدنى بيانات |
| P7 | `patients.chronic_diseases TEXT[]` / `allergies TEXT[]` | لا مصدر ولا تاريخ ولا مراجعة | جداول `patient_conditions` / `patient_allergies` بمصدر وتاريخ |
| P8 | `appointments` بلا قيد منع الحجز المزدوج | حجز مزدوج | partial unique index على (doctor_id, appointment_date, appointment_time) للحالات النشطة |
| P9 | `invoices` تجمع الدفعات | تكرار/التباس مالي | فصل `invoices` / `payment_transactions` / `refunds` / `settlements` |
| P10 | `patient_packages.used_sessions` عدّاد مخزّن | تعارض مع سجلات الجلسات | يُشتق من `package_sessions` + trigger incremented آمن |
| P11 | لا `clinic_id` في `subscription_plans` |الخطط عامة للمنصة — الصحيح | يُبقى عام (منصة) لكن `clinics.plan_id` FK |
| P12 | لا فهارس | بطء عند الإحصاء | قائمة فهارس في §6 أدناه |
| P13 | لا `deleted_at` soft delete | فقدان بيانات | `deleted_at` + `deleted_by` على الجداول الحساسة + استرجاع (سلة) |
| P14 | `ai_medical_summary` نص حر في `patients` | خلط بالمصدر المؤكد | `patient_ai_summaries` منفصلة + `source` + `generated_at` + `model` |
| P15 | لا `ai_drafts` ولا دورة حياة | لا يمكن تطبيق §10.9 | `ai_drafts` بحالات `created→processing→draft_ready→needs_review→approved/rejected/failed` |
| P16 | `staff_profiles.role` CHECK بـ 7 أدوار | ناقص (محاسب/مخزون/دعم) | enum موسّع + `role_permissions` |
| P17 | لا `feature_flags` | لا يمكن إيقاف ميزة عالية المخاطر بسرعة | `feature_flags` + `clinic_feature_overrides` |
| P18 | لا `message_outbox` / `message_attempts` | تكرار رسائل + فقدان حالة | outbox + attempts + idempotency_key |
| P19 | لا `background_jobs` | لا حالة/تقدم/فشل | `background_jobs` + `job_attempts` + `dead_letter` |
| P20 | لا `usage_events` | لا قياس تكلفة AI/واتساب | `usage_events` + `usage_monthly_aggregates` |

---

## 3. الجداول النهائية (46)

### 3.1 المنصة والاشتراكات (8)
```
subscription_plans, subscriptions, subscription_invoices,
subscription_payments, subscription_events, saas_affiliates,
affiliate_commissions, feature_flags
```

### 3.2 الهوية والصلاحيات (7)
```
profiles, clinics, clinic_branches, specialties,
user_clinic_memberships, membership_branch_scopes,
permissions, role_permissions
```
> `permissions` + `role_permissions` هما بديل RBAC. الأدوار الـ11 في `ROLE_PERMISSION_MATRIX.md` تُخزّن في `role_permissions` كـ rows.

### 3.3 العيادات والمواعيد (6)
```
staff_profiles, doctor_schedules, doctor_time_off,
patients, patient_packages, package_sessions
```

### 3.4 السجلات الطبية (7)
```
appointments, queue_tickets, medical_records,
medical_record_versions, patient_conditions, patient_allergies,
patient_ai_summaries
```

### 3.5 المرفقات والموافقات (6)
```
attachments, attachment_access_logs, patient_consents,
communication_preferences, medical_templates, specialty_form_schemas
```

### 3.6 الذكاء الاصطناعي (6)
```
ai_drafts, ai_draft_sections, ai_task_runs, ai_usage_log,
ai_prompt_versions, ai_reference_claims
```
> `ai_reference_claims` = تنبيهات الأدوية: كل تنبيه له مصدر + تاريخ نسخة + سبب (§10.7).
> `ai_draft_sections` = الحقول لكل تخصص + `confidence` + `needs_review` + `source_ref` (§10.3).

### 3.7 المال (8)
```
invoices, invoice_items, payment_transactions, refunds,
settlements, cash_movements, clinic_expenses, shifts
```

### 3.8 الرسائل والمهام (6)
```
message_outbox, message_attempts, whatsapp_instances,
background_jobs, job_attempts, dead_letter_queue
```

### 3.9 التدقيق والقياس (6)
```
audit_logs, usage_events, usage_monthly_aggregates,
clinics_meta, consent_policies, api_keys
```
> `clinics_meta` = إعدادات JSONB (الوقت، العملة، حدود،Feature toggles).

**المجموع: 60 جدول** (بما فيها المفاتيح والجداول الوسيطة أعلاه)

---

## 4. قواعد العزل (RLS)

### 4.1 النمط
كل جدول يحمل `clinic_id`:
```sql
ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <t> FORCE ROW LEVEL SECURITY;   -- حتى owner لا يتجاوزها

CREATE POLICY <t>_sel ON <t> FOR SELECT TO authenticated
  USING (clinic_id = nullif(current_setting('app.clinic_id', true), '')::uuid);

CREATE POLICY <t>_ins ON <t> FOR INSERT TO authenticated
  WITH CHECK (clinic_id = nullif(current_setting('app.clinic_id', true), '')::uuid);

CREATE POLICY <t>_upd ON <t> FOR UPDATE TO authenticated
  USING (clinic_id = nullif(current_setting('app.clinic_id', true), '')::uuid)
  WITH CHECK (clinic_id = nullif(current_setting('app.clinic_id', true), '')::uuid);
```
`FORCE ROW LEVEL SECURITY` مهم: بدونه يتجاوز `postgres` (service) السياسات — وده المقصود للـ backend، لكن أي مستخدم `service_role` في المتصفح كارثة.

### 4.2(setting) من الخادم
```sql
-- داخل transaction واحدة في الخادم
BEGIN;
  SELECT set_config('app.clinic_id', $1, true);
  SELECT set_config('app.user_id',   $2, true);
  SELECT set_config('app.role',      $3, true);
  -- ... الاستعلام
COMMIT;
```
`true` = local to transaction (لا يسرّب للجلسات).

### 4.3 منع الربط بين العيادات (composite FK)
```sql
ALTER TABLE patients  ADD CONSTRAINT patients_id_clinic_key UNIQUE (id, clinic_id);
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_fk
  FOREIGN KEY (patient_id, clinic_id) REFERENCES patients(id, clinic_id);
```
كل علاقة ثنائية داخل عيادة تأخذ نفس المعاملة. أي محاولة ربط مريض من عيادة أخرى تفشل على مستوى constraint — حتى لو تخطت RLS.

### 4.4 `service_role` و n8n
- `service_role` **لا يُستخدم من المتصفح إطلاقًا**.
- n8n يستخدم connection string بدور **`authenticated` + `app.clinic_id`** محدد لكل مهمة، أو service_role **مع** `clinic_id` صريح في كل استعلام — أيهما، لا تخلط.
- R11 `integration_service` لا يقرر صلاحيات.

---

## 5. الفهارس المقترحة

```sql
CREATE INDEX idx_appointments_clinic_date  ON appointments (clinic_id, appointment_date);
CREATE INDEX idx_appointments_doctor_slot  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('booked','confirmed','waiting','in_progress');
CREATE UNIQUE INDEX uq_appointments_no_double_booking ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('booked','confirmed');
CREATE INDEX idx_patients_clinic_file       ON patients (clinic_id, file_number);
CREATE INDEX idx_patients_clinic_phone      ON patients (clinic_id, phone);
CREATE INDEX idx_medrec_patient_created     ON medical_records (patient_id, created_at DESC);
CREATE INDEX idx_audit_clinic_time          ON audit_logs (clinic_id, created_at DESC);
CREATE INDEX idx_audit_entity               ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_outbox_pending             ON message_outbox (status, next_attempt_at)
  WHERE status IN ('queued','retrying');
CREATE INDEX idx_jobs_running               ON background_jobs (status, created_at)
  WHERE status IN ('queued','running');
CREATE INDEX idx_usage_clinic_month         ON usage_events (clinic_id, created_at);
CREATE INDEX idx_attachments_entity         ON attachments (entity_type, entity_id);
```

---

## 6. خطة الـ Migrations (5 ملفات)

| # | الملف | المحتوى | حجم تقريبي |
|---|---|---|---|
| M1 | `0001_core_plATFORM.sql` | plans, subscriptions, profiles, clinics, branches, specialties, permissions, role_permissions, memberships, feature_flags, audit_logs, clinics_meta | ~400 سطر |
| M2 | `0002_clinic_staff_patients.sql` | staff_profiles, schedules, time_off, patients, packages, sessions, conditions, allergies, consents, communication_preferences | ~300 سطر |
| M3 | `0003_clinical_appointments.sql` | appointments, queue_tickets, medical_records, versions, templates, specialty schemas, attachments + access logs | ~350 سطر |
| M4 | `0004_finance_usage.sql` | invoices, items, payments, refunds, settlements, cash_movements, expenses, shifts, usage_events, aggregates, api_keys, affiliate tables | ~350 سطر |
| M5 | `0005_ai_messaging_jobs.sql` | ai_drafts, sections, task_runs, usage_log, prompt_versions, reference_claims, message_outbox, attempts, whatsapp_instances, background_jobs, attempts, dead_letter | ~300 سطر |

**كل migration:**
- Forward-only، مرقّم بالتاريخ.
- Seed data وهمية (`seed.sql`) — **لا بيانات مرضى حقيقية**.
- `down` section للـ rollback (§"سياسة rollback عند الحاجة").
- RLS مفعّل في نفس ملف الـ migration الذي ينشئ الجدول (لا تُنسى).

---

## 7. نموذج البيانات والـ AI (§10.3, §10.5, §10.6)

| الحقل | النوع | المعنى |
|---|---|---|
| `source` | enum | `doctor_input` \| `extracted` \| `ai_inferred` \| `imported` |
| `source_ref` | jsonb | `{attachment_id, page, bbox}` أو `{appointment_id}` |
| `confidence` | numeric | 0..1 — أقل من 0.8 ⇒ `needs_review` تلقائيًا |
| `confirmed_by` / `confirmed_at` | uuid / timestamptz | من اعتمد، ومتى (§10.8) |
| `ai_model` / `ai_prompt_version` | text / uuid | لأغراض التدقيق والتكرار |

**قاعدة (§10.3):** لا يُنشأ "فحص سريري" لم يحدث — الحقول السريرية لا تُملأ إلا من `doctor_input` أو `extracted` من مصدر موثوق.

---

## 8. Portability (نقل قاعدة البيانات لاحقًا)

كل ما سبق **Postgres قياسي** — لا اعتمادية على امتدادات Supabase خاصة:
- ✅ `uuid`, `jsonb`, `timestamptz`, `numeric`, `pgcrypto` (`gen_random_uuid` مدمج في PG13+)
- ✅ RLS, partial indexes, composite FKs, triggers
- ❌ لا نستخدم: `pg_graphql`, Supabase Storage API المدمج (نستخدمه عبر REST عادي)

**النقل إلى Postgres مصري (Raya/Link/EGIT/WE) = تغيير connection string + auth provider فقط**، مع:
- `supabase.auth` → يُستبدل بـ auth layer مطابق (أو يبقى Supabase Auth وهي layer منفصلة أصلًا)
- Storage → Supabase Storage أو S3/MinIO — نستخدم **bucket + signed URL** عبر interface واحد

> **هذا مقصود:** §31.2 يفرض أن الاستضافة داخل مصر هي الخيار الافتراضي للإصدار الأول، وDEC-005 غير محسوم قانونيًا. البناء على Postgres قياسي يجعل الانتقال ممكنًا، لا مؤجلًا.

---

## 9. قرارات معلّقة

| # | السؤال | الأثر على المخطط |
|---|---|---|
| D1 | تأجير عيادات: `clinics` واحد أم `organizations` فوقها؟ | نبدأ بـ clinic واحد = tenant (يبقى أبسط ويفي) |
| D2 | ترقيم الحالات ترقيم: `file_number` تسلسلي لكل عيادة أم مركزي؟ | نبدأ تسلسلي لكل عيادة (`(clinic_id, file_number)` unique) |
| D3 | هل نحتاج `insurance_companies` + `claims` في الإصدار الأول؟ | ليس في §11 — نؤجله لتقرير Phase 3 |
| D4 | العيادة تتعدد الفروع بحد أقصى (باقة Center = 3) | نضع soft limit في `clinics_meta` |
| D5 | الترقيمFiscal: هل نخزّن `invoice_number` centrally أم لكل عيادة؟ | لكل عيادة + unique |

---

**المراجع:** blueprint §6, §10.2, §10.3, §11.1, §25, §31.1, §31.5 · FINAL_PACKAGE_REVIEW §2 · DECISION_LOG DEC-001/002
