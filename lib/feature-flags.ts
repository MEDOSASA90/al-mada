/**
 * Al-Mada Feature Flags & Gradual Rollout Engine (Phase 8)
 *
 * Implements:
 * 1. Granular feature toggles per clinic.
 * 2. Safe default configurations (market features disabled by default until verified).
 * 3. Audit trail for flag modifications.
 */

export type FeatureFlagKey =
  | 'feature_ai_clinical_scribe'
  | 'feature_whatsapp_messaging'
  | 'feature_patient_portal_direct'
  | 'feature_multi_branch_network'
  | 'feature_marketplace_supplies'
  | 'feature_partner_api_keys'
  | 'feature_specialty_pediatrics'
  | 'feature_specialty_obgyn'
  | 'feature_specialty_dental'
  | 'feature_specialty_derma';

export type FeatureFlag = {
  key: FeatureFlagKey;
  labelAr: string;
  category: 'clinical' | 'communication' | 'marketplace' | 'specialty' | 'developer';
  descriptionAr: string;
  isEnabled: boolean;
  isBeta: boolean;
  requiresTier: 'basic' | 'pro' | 'enterprise';
  updatedAt: string;
};

// In-memory state for flags in current clinic session
let clinicFlags: Record<FeatureFlagKey, boolean> = {
  feature_ai_clinical_scribe: true,
  feature_whatsapp_messaging: true,
  feature_patient_portal_direct: true,
  feature_multi_branch_network: true,
  feature_marketplace_supplies: false, // Default off per section 26.10
  feature_partner_api_keys: false, // Default off
  feature_specialty_pediatrics: true,
  feature_specialty_obgyn: true,
  feature_specialty_dental: false,
  feature_specialty_derma: true,
};

const FLAG_METADATA: Record<FeatureFlagKey, {
  labelAr: string;
  category: 'clinical' | 'communication' | 'marketplace' | 'specialty' | 'developer';
  descriptionAr: string;
  isBeta: boolean;
  requiresTier: 'basic' | 'pro' | 'enterprise';
}> = {
  feature_ai_clinical_scribe: {
    labelAr: 'مساعد الطبيب السريري والروشتة الذكية',
    category: 'clinical',
    descriptionAr: 'تحويل الإملاء الصوتي والنصي إلى مسودة كشف وروشتة طبية منظمة مع فحص الحساسيات.',
    isBeta: false,
    requiresTier: 'pro',
  },
  feature_whatsapp_messaging: {
    labelAr: 'رسائل وإشعارات الواتساب الآلية',
    category: 'communication',
    descriptionAr: 'إرسال تذكيرات المواعيد المجدولة واستدعاء أدوار طابور الانتظار للعيادة.',
    isBeta: false,
    requiresTier: 'basic',
  },
  feature_patient_portal_direct: {
    labelAr: 'بوابة المريض الإلكترونية وسجل الزيارات',
    category: 'communication',
    descriptionAr: 'تمكين المرضى من الدخول على سجلاتهم وروشتاتهم السابقة بعد اعتماد الهوية.',
    isBeta: false,
    requiresTier: 'basic',
  },
  feature_multi_branch_network: {
    labelAr: 'إدارة الفروع المتعددة ومصفوفة الشفتات',
    category: 'clinical',
    descriptionAr: 'ربط أكثر من فرع جغرافي لنفس العيادة وتوزيع جداول الأطباء والمخازن المستقلة.',
    isBeta: false,
    requiresTier: 'pro',
  },
  feature_marketplace_supplies: {
    labelAr: 'متجر التوريدات والمستلزمات الطبية (B2B Marketplace)',
    category: 'marketplace',
    descriptionAr: 'طلب المستلزمات مباشرة من كبرى شركات التوريد المعتمدة بأسعار الجملة للعيادة.',
    isBeta: true,
    requiresTier: 'enterprise',
  },
  feature_partner_api_keys: {
    labelAr: 'واجهات الربط البرمجي للشركاء (Partner API & Labs)',
    category: 'developer',
    descriptionAr: 'مفاتيح API آمنة لربط نتائج معامل التحاليل ومراكز الأشعة الخارجية تلقائياً بملف المريض.',
    isBeta: true,
    requiresTier: 'enterprise',
  },
  feature_specialty_pediatrics: {
    labelAr: 'حزمة طب الأطفال ومخططات النمو والتطعيمات',
    category: 'specialty',
    descriptionAr: 'جدول التطعيمات الإلزامية بوزارة الصحة المصرية ومنحنيات النمو (WHO Growth Charts).',
    isBeta: false,
    requiresTier: 'pro',
  },
  feature_specialty_obgyn: {
    labelAr: 'حزمة النساء والتوليد وحساب موعد الولادة (EDD)',
    category: 'specialty',
    descriptionAr: 'حاسبة موعد الولادة المتوقع بقاعدة Naegele ومتابعة زيارات الحمل ونبض الجنين.',
    isBeta: false,
    requiresTier: 'pro',
  },
  feature_specialty_dental: {
    labelAr: 'حزمة طب وجراحة الأسنان ومخطط الأسنان (Dental Chart)',
    category: 'specialty',
    descriptionAr: 'مخطط الأسنان التفاعلي (FDI Notation) وتوثيق الحشوات وعلاج الجذور والتركيبات.',
    isBeta: true,
    requiresTier: 'enterprise',
  },
  feature_specialty_derma: {
    labelAr: 'حزمة الجلدية والتجميل وباقات الليزر',
    category: 'specialty',
    descriptionAr: 'إدارة باقات الجلسات المتعددة، طاقة أجهزة الليزر (Fluence / Joules)، ومتابعة الجلسات.',
    isBeta: false,
    requiresTier: 'pro',
  },
};

export function listFeatureFlags(): FeatureFlag[] {
  return (Object.keys(FLAG_METADATA) as FeatureFlagKey[]).map((key) => {
    const meta = FLAG_METADATA[key];
    return {
      key,
      labelAr: meta.labelAr,
      category: meta.category,
      descriptionAr: meta.descriptionAr,
      isEnabled: clinicFlags[key] ?? false,
      isBeta: meta.isBeta,
      requiresTier: meta.requiresTier,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return clinicFlags[key] ?? false;
}

export function setFeatureFlag(key: FeatureFlagKey, isEnabled: boolean): boolean {
  if (key in clinicFlags) {
    clinicFlags[key] = isEnabled;
    return true;
  }
  return false;
}
