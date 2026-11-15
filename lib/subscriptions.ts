import { DEMO_CLINIC } from './demo-data';

export type SubscriptionPlan = {
  id: string;
  code: 'starter' | 'pro' | 'enterprise';
  name_ar: string;
  name_en: string;
  monthly_price: number;
  yearly_price: number;
  max_doctors: number;
  max_branches: number;
  max_patients: number;
  features: string[];
  is_popular?: boolean;
};

export type ClinicSubscriptionInfo = {
  clinic_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  usage: {
    doctors_count: number;
    branches_count: number;
    patients_count: number;
    storage_mb: number;
    whatsapp_messages_sent: number;
  };
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_starter',
    code: 'starter',
    name_ar: 'باقة العيادة الفردية (Solo)',
    name_en: 'Starter Solo Clinic',
    monthly_price: 499,
    yearly_price: 4990,
    max_doctors: 1,
    max_branches: 1,
    max_patients: 1000,
    features: [
      'طبيب واحد مع حساب استقبال متعدد المهام',
      'سجلات المرضى الإلكترونية والروشتة الرقمية',
      'طباعة الروشتة بوضعين (ورق عادي أو ورق مطبوع مسبقاً)',
      'إدارة الطابور والكاشير والتقفيل اليومي',
      'مخزون المستهلكات الطبية',
      'بوابة المريض للاطلاع على الروشتات والتحاليل',
    ],
  },
  {
    id: 'plan_pro',
    code: 'pro',
    name_ar: 'باقة العيادة التخصصية والشركاء (Pro)',
    name_en: 'Professional Multi-Doctor',
    monthly_price: 1199,
    yearly_price: 11990,
    max_doctors: 5,
    max_branches: 2,
    max_patients: 10000,
    is_popular: true,
    features: [
      'حتى 5 أطباء مع استقلالية تامة في حسابات الأتعاب والعمولات',
      'فرعين لنفس العيادة أو المركز',
      'إشعارات الواتساب الآلية لتذكير المواعيد والطابور',
      'تقفيل الخزائن وحسابات الشركاء وصافي الأرباح P&L',
      'إدارة الباقات والجلسات الطبية المتعددة',
      'تصدير البيانات واستيراد السجلات وسلة المحذوفات',
    ],
  },
  {
    id: 'plan_enterprise',
    code: 'enterprise',
    name_ar: 'باقة المراكز الطبية والمجمعات (Enterprise)',
    name_en: 'Medical Center Enterprise',
    monthly_price: 2499,
    yearly_price: 24990,
    max_doctors: 25,
    max_branches: 10,
    max_patients: 100000,
    features: [
      'أطباء غير محدودين وموظفين متعددين',
      'فروع ومخازن متعددة ومربوطة بالكامل',
      'تكامل مخصص مع الواتساب والـ SMS ومعامل التحاليل',
      'تقارير ضريبية ومحاسبية متقدمة',
      'أولوية الدعم الفني وتدريب طاقم العيادة',
      'نسخ احتياطي فوري وسيرفرات مخصصة داخل مصر',
    ],
  },
];

export const DEMO_SUBSCRIPTION: ClinicSubscriptionInfo = {
  clinic_id: DEMO_CLINIC.id,
  plan: SUBSCRIPTION_PLANS[1], // Pro plan
  status: 'active',
  billing_cycle: 'monthly',
  current_period_start: '2026-11-01',
  current_period_end: '2026-12-01',
  usage: {
    doctors_count: 2,
    branches_count: 1,
    patients_count: 145,
    storage_mb: 240,
    whatsapp_messages_sent: 88,
  },
};

export async function getClinicSubscription(): Promise<ClinicSubscriptionInfo> {
  return DEMO_SUBSCRIPTION;
}

export async function upgradePlanSimulation(planCode: string, cycle: 'monthly' | 'yearly'): Promise<{ success: boolean; message: string; transaction_id: string }> {
  const chosen = SUBSCRIPTION_PLANS.find((p) => p.code === planCode) || SUBSCRIPTION_PLANS[1];
  const amount = cycle === 'yearly' ? chosen.yearly_price : chosen.monthly_price;
  
  return {
    success: true,
    message: `تم تجديد وتفعيل ${chosen.name_ar} بنجاح بقيمة ${amount} ج.م عبر بوابة الدفع الآمنة (Paymob / Fawry Sandbox).`,
    transaction_id: `TXN-SUB-${Math.floor(100000 + Math.random() * 900000)}`,
  };
}
