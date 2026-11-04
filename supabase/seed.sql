-- =============================================================================
-- Al-Mada / seed.sql — Platform-level reference data (NO patient data)
-- Safe to run repeatedly (idempotent).
-- Clinic/patient demo data lives in scripts/seed_demo.py (needs auth.users).
-- =============================================================================

-- ---------- subscription plans ----------
INSERT INTO public.subscription_plans
  (id, code, name_ar, name_en, price_monthly, price_yearly, currency,
   max_branches, max_doctors, max_staff, max_patients, ai_quota_monthly, features)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'starter', 'البداية', 'Starter',
   1500, 15000, 'EGP', 1, 3, 10, 200, 50,
   '{"whatsapp": false, "ai_assistant": true, "reports": false, "multi_branch": false}'::jsonb),
  ('00000000-0000-4000-8000-000000000002', 'professional', 'الاحترافية', 'Professional',
   3500, 35000, 'EGP', 3, 10, 30, 1000, 300,
   '{"whatsapp": true, "ai_assistant": true, "reports": true, "multi_branch": true}'::jsonb),
  ('00000000-0000-4000-8000-000000000003', 'center', 'المركز', 'Center',
   7000, 70000, 'EGP', 5, 30, 80, 5000, 1000,
   '{"whatsapp": true, "ai_assistant": true, "reports": true, "multi_branch": true, "api": true}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
  price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly,
  max_branches = EXCLUDED.max_branches, max_doctors = EXCLUDED.max_doctors,
  max_staff = EXCLUDED.max_staff, max_patients = EXCLUDED.max_patients,
  ai_quota_monthly = EXCLUDED.ai_quota_monthly, features = EXCLUDED.features,
  updated_at = now();

-- ---------- specialties ----------
INSERT INTO public.specialties (code, name_ar, name_en, sort_order) VALUES
  ('general',    'طب عام',        'General Medicine', 1),
  ('cardio',     'قلب وأوعية',    'Cardiology',       2),
  ('pediatrics', 'أطفال',         'Pediatrics',       3),
  ('derm',       'جلدية',         'Dermatology',      4),
  ('ortho',      'عظام',          'Orthopedics',      5),
  ('gyn',        'نساء وتوليد',   'Obstetrics & Gynecology', 6),
  ('ent',        'أنف وأذن',      'ENT',              7),
  ('eye',        'عيون',          'Ophthalmology',   8),
  ('psych',      'نفسي',          'Psychiatry',       9),
  ('dental',     'أسنان',         'Dentistry',        10)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order, is_active = true;

-- ---------- permissions ----------
INSERT INTO public.permissions (code, resource, action, description) VALUES
  ('patients.view',        'patients',        'view',    'عرض المرضى'),
  ('patients.create',      'patients',        'create',  'إضافة مريض'),
  ('patients.edit',        'patients',        'edit',    'تعديل بيانات مريض'),
  ('patients.delete',      'patients',        'delete',  'حذف مريض'),
  ('patients.export',      'patients',        'export',  'تصدير بيانات المرضى'),
  ('appointments.view',    'appointments',    'view',    'عرض المواعيد'),
  ('appointments.create',  'appointments',    'create',  'حجز موعد'),
  ('appointments.edit',    'appointments',    'edit',    'تعديل موعد'),
  ('appointments.cancel',  'appointments',    'cancel',  'إلغاء موعد'),
  ('medical_records.view', 'medical_records', 'view',    'عرض السجلات الطبية'),
  ('medical_records.create','medical_records','create',  'إنشاء سجل طبي'),
  ('medical_records.edit', 'medical_records', 'edit',    'تعديل السجل الطبي'),
  ('medical_records.lock', 'medical_records', 'lock',    'اعتماد/قفل السجل الطبي'),
  ('finance.view',         'finance',         'view',    'عرض الحسابات'),
  ('finance.create',       'finance',         'create',  'إنشاء فاتورة/تحصيل'),
  ('finance.edit',         'finance',         'edit',    'تعديل مالية'),
  ('finance.approve',      'finance',         'approve', 'اعتماد خصومات/مستحقات'),
  ('finance.reports',      'finance',         'reports', 'تقارير مالية'),
  ('staff.view',           'staff',           'view',    'عرض الموظفين'),
  ('staff.create',         'staff',           'create',  'إضافة موظف'),
  ('staff.edit',           'staff',           'edit',    'تعديل موظف'),
  ('ai.use',               'ai',              'use',     'استخدام مساعد الذكاء الاصطناعي'),
  ('ai.review',            'ai',              'review',  'مراجعة مسودات AI'),
  ('ai.approve',           'ai',              'approve', 'اعتماد مخرجات AI'),
  ('settings.view',        'settings',        'view',    'عرض إعدادات العيادة'),
  ('settings.edit',        'settings',        'edit',    'تعديل إعدادات العيادة'),
  ('memberships.manage',   'memberships',     'manage',  'إدارة عضويات المستخدمين'),
  ('audit.view',           'audit',           'view',    'عرض سجل التدقيق'),
  ('reports.view',         'reports',         'view',    'عرض التقارير')
ON CONFLICT (code) DO UPDATE SET
  resource = EXCLUDED.resource, action = EXCLUDED.action, description = EXCLUDED.description;

-- ---------- role_permissions ----------
-- super_admin: everything
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::user_role, p.id FROM public.permissions p
ON CONFLICT (role, permission_id) DO NOTHING;

-- clinic_owner: everything except platform-only audit
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'clinic_owner'::user_role, p.id FROM public.permissions p
WHERE p.code <> 'audit.view'
ON CONFLICT (role, permission_id) DO NOTHING;

-- clinic_admin: same as owner minus financial approve/reports
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'clinic_admin'::user_role, p.id FROM public.permissions p
WHERE p.code NOT IN ('audit.view','finance.approve','finance.reports')
ON CONFLICT (role, permission_id) DO NOTHING;

-- doctor
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'doctor'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('patients.view','patients.create','patients.edit',
                 'appointments.view','appointments.create','appointments.edit',
                 'medical_records.view','medical_records.create','medical_records.edit',
                 'medical_records.lock','ai.use','ai.review')
ON CONFLICT (role, permission_id) DO NOTHING;

-- nurse
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'nurse'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('patients.view','patients.edit','appointments.view',
                 'medical_records.view','medical_records.create','ai.use')
ON CONFLICT (role, permission_id) DO NOTHING;

-- receptionist
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'receptionist'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('patients.view','patients.create','patients.edit',
                 'appointments.view','appointments.create','appointments.edit','appointments.cancel',
                 'finance.view','finance.create')
ON CONFLICT (role, permission_id) DO NOTHING;

-- accountant
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('patients.view','finance.view','finance.create','finance.edit',
                 'finance.approve','finance.reports','reports.view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- inventory_manager
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'inventory_manager'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('patients.view','finance.view','reports.view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- support_agent: read-only, no PHI details
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'support_agent'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('appointments.view','finance.view','settings.view','reports.view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- integration_service (R11 — decides nothing, only technical access)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'integration_service'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('appointments.view','appointments.create','ai.use')
ON CONFLICT (role, permission_id) DO NOTHING;

-- patient: own data only (enforced by RLS, not just permissions)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'patient'::user_role, p.id FROM public.permissions p
WHERE p.code IN ('appointments.view','medical_records.view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ---------- feature flags ----------
INSERT INTO public.feature_flags (key, description, is_enabled, rollout_pct) VALUES
  ('ai_clinical_notes',   'AI-generated clinical note drafts',           false, 0),
  ('ai_sms_reply',        'AI-drafted replies to patient messages',      false, 0),
  ('whatsapp_integration','WhatsApp Business integration',              false, 0),
  ('telegram_bot',        'Telegram bot notifications',                 true,  100),
  ('voice_transcription', 'Voice note transcription via Whisper',        false, 0),
  ('multi_branch',        'Multi-branch clinics',                        true,  100),
  ('reports_module',      'Reporting and analytics module',             false, 0)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description, updated_at = now();

-- ---------- storage buckets ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('clinic-documents', 'clinic-documents', false, 26214400,
   ARRAY['image/jpeg','image/png','image/webp','application/pdf','text/plain']),
  ('patient-records',  'patient-records',  false, 52428800,
   ARRAY['image/jpeg','image/png','image/webp','application/pdf','text/plain','audio/mpeg','audio/ogg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
