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

export type EgyptianPaymentMethod = 'fawry' | 'vodafone_cash' | 'instapay' | 'card';

export type SubscriptionInvoice = {
  id: string;
  invoice_number: string;
  period: string;
  plan_name: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_method_name: string;
  payment_method_key: EgyptianPaymentMethod;
  reference_no: string;
  status: 'paid' | 'pending';
  issued_at: string;
};

export type ClinicSubscriptionInfo = {
  clinic_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  payment_method: EgyptianPaymentMethod;
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
      'فرعين لنفس العيادة أو المركز الطبي',
      'جدول شفتات ومواعيد عمل الأطباء لكل فرع',
      'إشعارات الواتساب الآلية لتأكيد الموعد مع لوكيشن خرائط جوجل',
      'تنبيهات اقتراب الدور في طابور الانتظار (Queue ETA)',
      'تقفيل الخزائن وحسابات الشركاء وصافي الأرباح P&L',
      'إدارة الباقات والجلسات الطبية المتعددة والمخزون',
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
      'تقارير ضريبية ومحاسبية متقدمة (الفاتورة الإلكترونية)',
      'أولوية الدعم الفني وتدريب طاقم العيادة',
      'نسخ احتياطي فوري وسيرفرات مخصصة داخل مصر',
    ],
  },
];

export const DEMO_SUBSCRIPTION_INVOICES: SubscriptionInvoice[] = [
  {
    id: 'inv_sub_001',
    invoice_number: 'SUB-INV-2026-11-0941',
    period: '01 نوفمبر 2026 - 30 نوفمبر 2026',
    plan_name: 'باقة العيادة التخصصية والشركاء (Pro)',
    subtotal: 1199,
    vat_amount: 0,
    total: 1199,
    payment_method_name: 'فوري باي (Fawry Code)',
    payment_method_key: 'fawry',
    reference_no: 'FAW-948210492',
    status: 'paid',
    issued_at: '2026-11-01',
  },
  {
    id: 'inv_sub_002',
    invoice_number: 'SUB-INV-2026-10-0812',
    period: '01 أكتوبر 2026 - 31 أكتوبر 2026',
    plan_name: 'باقة العيادة الفردية (Solo)',
    subtotal: 499,
    vat_amount: 0,
    total: 499,
    payment_method_name: 'إنستاباي (InstaPay)',
    payment_method_key: 'instapay',
    reference_no: 'IPA-20261001-449',
    status: 'paid',
    issued_at: '2026-10-01',
  },
];

export const DEMO_SUBSCRIPTION: ClinicSubscriptionInfo = {
  clinic_id: DEMO_CLINIC.id,
  plan: SUBSCRIPTION_PLANS[1], // Pro plan
  status: 'active',
  billing_cycle: 'monthly',
  current_period_start: '2026-11-01',
  current_period_end: '2026-12-01',
  auto_renew: true,
  payment_method: 'fawry',
  usage: {
    doctors_count: 2,
    branches_count: 2,
    patients_count: 145,
    storage_mb: 240,
    whatsapp_messages_sent: 88,
  },
};

export async function getClinicSubscription(): Promise<ClinicSubscriptionInfo> {
  return DEMO_SUBSCRIPTION;
}

export async function getSubscriptionInvoices(): Promise<SubscriptionInvoice[]> {
  return DEMO_SUBSCRIPTION_INVOICES;
}

export function calculateProration(
  currentPlanCode: string,
  newPlanCode: string,
  cycle: 'monthly' | 'yearly',
  daysRemaining: number = 14
): {
  credit: number;
  newPrice: number;
  netDue: number;
} {
  const current = SUBSCRIPTION_PLANS.find((p) => p.code === currentPlanCode) || SUBSCRIPTION_PLANS[0];
  const target = SUBSCRIPTION_PLANS.find((p) => p.code === newPlanCode) || SUBSCRIPTION_PLANS[1];

  const totalDays = cycle === 'yearly' ? 365 : 30;
  const currentTotal = cycle === 'yearly' ? current.yearly_price : current.monthly_price;
  const newPrice = cycle === 'yearly' ? target.yearly_price : target.monthly_price;

  const credit = Math.round((currentTotal / totalDays) * daysRemaining);
  const netDue = Math.max(0, newPrice - credit);

  return { credit, newPrice, netDue };
}
