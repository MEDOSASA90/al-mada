'use client';

import { useState, useTransition } from 'react';
import { SUBSCRIPTION_PLANS, type ClinicSubscriptionInfo } from '@/lib/subscriptions';

export function SubscriptionManager({ subscription }: { subscription: ClinicSubscriptionInfo }) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string>(subscription.plan.code);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ success: boolean; message: string; transaction_id?: string } | null>(null);

  const usagePercent = {
    doctors: Math.round((subscription.usage.doctors_count / subscription.plan.max_doctors) * 100),
    branches: Math.round((subscription.usage.branches_count / subscription.plan.max_branches) * 100),
    patients: Math.round((subscription.usage.patients_count / subscription.plan.max_patients) * 100),
  };

  function handleUpgrade(planCode: string) {
    startTransition(async () => {
      // Simulate payment processing via sandbox
      await new Promise((r) => setTimeout(r, 800));
      const chosen = SUBSCRIPTION_PLANS.find((p) => p.code === planCode) || SUBSCRIPTION_PLANS[1];
      const amount = cycle === 'yearly' ? chosen.yearly_price : chosen.monthly_price;
      setFeedback({
        success: true,
        message: `تم تجديد باقة العيادة بنجاح إلى "${chosen.name_ar}" بقيمة ${amount} ج.م عبر بوابة الدفع الآمنة (Paymob Sandbox). تم تحديث السعة والحساب فوراً.`,
        transaction_id: `PAYMOB-EGY-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setSelectedPlan(planCode);
    });
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription & Quotas Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                ● اشتراك نشط
              </span>
              <h2 className="text-xl font-bold text-slate-900">{subscription.plan.name_ar}</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              دورة الفوترة الحالية تنتهي في: <strong className="text-slate-700">{subscription.current_period_end}</strong> (تجديد تلقائي)
            </p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-teal-800">
              {cycle === 'yearly' ? subscription.plan.yearly_price : subscription.plan.monthly_price} ج.م
            </span>
            <span className="text-xs text-slate-500 block">/ {cycle === 'yearly' ? 'سنوياً' : 'شهرياً'}</span>
          </div>
        </div>

        {/* Quotas & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>الأطباء المصرح بهم</span>
              <span>{subscription.usage.doctors_count} من {subscription.plan.max_doctors}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${usagePercent.doctors > 80 ? 'bg-amber-500' : 'bg-teal-700'}`}
                style={{ width: `${Math.min(usagePercent.doctors, 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">طبيبان نشطان في الفريق</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>فروع العيادة</span>
              <span>{subscription.usage.branches_count} من {subscription.plan.max_branches}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-700"
                style={{ width: `${Math.min(usagePercent.branches, 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">متاح إضافة فرع ثانٍ</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>رسائل الواتساب الشهرية</span>
              <span>{subscription.usage.whatsapp_messages_sent} رسالة</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: '28%' }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">تذكيرات مواعيد وطابور مرسلة</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 space-y-1">
          <p className="font-bold text-sm">✅ {feedback.message}</p>
          {feedback.transaction_id && (
            <p className="text-xs text-emerald-800 font-mono">رقم العملية المرجعي: {feedback.transaction_id}</p>
          )}
        </div>
      )}

      {/* Plan Switcher & Billing Toggle */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ترقية أو تغيير باقة الاشتراك</h3>
            <p className="text-sm text-slate-500">اختر الباقة المناسبة لحجم ونمو عيادتك الطبية:</p>
          </div>
          {/* Cycle Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                cycle === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دفع شهري
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                cycle === 'yearly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>دفع سنوي</span>
              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-800 font-black">وفر 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = subscription.plan.code === plan.code;
            const price = cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition relative ${
                  plan.is_popular
                    ? 'border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.is_popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-teal-800 px-3 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                    الأكثر اختياراً في مصر ⭐
                  </span>
                )}
                <div>
                  <h4 className="text-base font-bold text-slate-900">{plan.name_ar}</h4>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{price}</span>
                    <span className="text-xs text-slate-500 font-bold">ج.م / {cycle === 'yearly' ? 'سنة' : 'شهر'}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    حدود الاستخدام: <strong>{plan.max_doctors} أطباء</strong> · <strong>{plan.max_branches} فرع</strong>
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-700 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isPending || (isCurrent && cycle === subscription.billing_cycle)}
                    onClick={() => handleUpgrade(plan.code)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition ${
                      isCurrent && cycle === subscription.billing_cycle
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : plan.is_popular
                        ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {isPending
                      ? 'جارٍ معالجة الدفع…'
                      : isCurrent && cycle === subscription.billing_cycle
                      ? 'باقتك الحالية'
                      : 'ترقية وتفعيل الآن ➔'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
