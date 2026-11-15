'use client';

import { useState, useTransition } from 'react';
import {
  SUBSCRIPTION_PLANS,
  calculateProration,
  type ClinicSubscriptionInfo,
  type SubscriptionInvoice,
  type EgyptianPaymentMethod,
} from '@/lib/subscriptions';

export function SubscriptionManager({
  subscription,
  invoices,
}: {
  subscription: ClinicSubscriptionInfo;
  invoices: SubscriptionInvoice[];
}) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(subscription.billing_cycle);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(subscription.plan.code);
  const [paymentMethod, setPaymentMethod] = useState<EgyptianPaymentMethod>('fawry');
  const [walletPhone, setWalletPhone] = useState('01012345678');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    fawryCode?: string;
    transaction_id?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'plans' | 'invoices'>('plans');

  const usagePercent = {
    doctors: Math.round((subscription.usage.doctors_count / subscription.plan.max_doctors) * 100),
    branches: Math.round((subscription.usage.branches_count / subscription.plan.max_branches) * 100),
    whatsapp: Math.round((subscription.usage.whatsapp_messages_sent / 300) * 100),
  };

  const isChangingPlan = selectedPlanCode !== subscription.plan.code || cycle !== subscription.billing_cycle;
  const proration = calculateProration(subscription.plan.code, selectedPlanCode, cycle);

  function handleProcessPayment() {
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 700));
      const chosen = SUBSCRIPTION_PLANS.find((p) => p.code === selectedPlanCode) || SUBSCRIPTION_PLANS[1];
      const dueAmount = isChangingPlan ? proration.netDue : cycle === 'yearly' ? chosen.yearly_price : chosen.monthly_price;

      if (paymentMethod === 'fawry') {
        const generatedCode = `948${Math.floor(100000 + Math.random() * 900000)}`;
        setFeedback({
          success: true,
          message: `تم إنشاء كود دفع فوري لتفعيل ${chosen.name_ar}. توجه لأي منفذ فوري أو استخدم تطبيق ماي فوري للدفع بمبلغ ${dueAmount} ج.م قبل انتهاء الصلاحية.`,
          fawryCode: generatedCode,
          transaction_id: `FAW-${generatedCode}`,
        });
      } else if (paymentMethod === 'vodafone_cash') {
        setFeedback({
          success: true,
          message: `تم تسجيل طلب التجديد عبر محفظة كاش (${walletPhone}) بقيمة ${dueAmount} ج.م. تم تفعيل الباقة مؤقتاً لحين مراجعة التحويل.`,
          transaction_id: `VOD-${Math.floor(100000 + Math.random() * 900000)}`,
        });
      } else if (paymentMethod === 'instapay') {
        setFeedback({
          success: true,
          message: `تم تسجيل التحويل عبر إنستاباي إلى حساب (almada@instapay) بقيمة ${dueAmount} ج.م. تم تفعيل اشتراك العيادة فوراً.`,
          transaction_id: `IPA-${Math.floor(100000 + Math.random() * 900000)}`,
        });
      } else {
        setFeedback({
          success: true,
          message: `تم خصم ${dueAmount} ج.م وتجديد اشتراك ${chosen.name_ar} بنجاح عبر البطاقة البنكية / ميزة.`,
          transaction_id: `CARD-EGY-${Math.floor(100000 + Math.random() * 900000)}`,
        });
      }
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
                ● اشتراك المنصة سارٍ ونشط
              </span>
              <h2 className="text-xl font-bold text-slate-900">{subscription.plan.name_ar}</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              تاريخ التجديد القادم: <strong className="text-slate-800">{subscription.current_period_end}</strong> · دورة الفوترة: <strong>{subscription.billing_cycle === 'yearly' ? 'سنوية' : 'شهرية'}</strong>
            </p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-teal-800">
              {subscription.billing_cycle === 'yearly' ? subscription.plan.yearly_price : subscription.plan.monthly_price} ج.م
            </span>
            <span className="text-xs text-slate-500 block">/ {subscription.billing_cycle === 'yearly' ? 'سنوياً' : 'شهرياً'}</span>
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
                className="h-full rounded-full bg-teal-700"
                style={{ width: `${Math.min(usagePercent.doctors, 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">متاح إضافة {subscription.plan.max_doctors - subscription.usage.doctors_count} أطباء جدد</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>فروع العيادة النشطة</span>
              <span>{subscription.usage.branches_count} من {subscription.plan.max_branches}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-700"
                style={{ width: `${Math.min(usagePercent.branches, 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">فرع مصر الجديدة + فرع التجمع</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>إشعارات الواتساب المرسلة</span>
              <span>{subscription.usage.whatsapp_messages_sent} رسالة</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(usagePercent.whatsapp, 100)}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">تأكيد المواعيد وطابور الكشف الحي</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'plans'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          ترقية وتغيير الباقات وطرق الدفع
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'invoices'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          سجل فواتير الاشتراك والإيصالات ({invoices.length})
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div className="space-y-8">
          {/* Cycle Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">اختر الباقة المناسبة للعيادة</h3>
              <p className="text-xs text-slate-500">أسعار واضحة بالجنيه المصري شاملة كافة التحديثات السحابية:</p>
            </div>
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
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-800 font-black">وفر شهرين</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanCode === plan.code;
              const isCurrent = subscription.plan.code === plan.code;
              const price = cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanCode(plan.code)}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-700 ring-2 ring-teal-700/30 bg-teal-50/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.is_popular && (
                    <span className="absolute -top-3 right-6 rounded-full bg-teal-800 px-3 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                      الأكثر استخداماً في العيادات ⭐
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900">{plan.name_ar}</h4>
                      {isCurrent && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          الحالية
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{price}</span>
                      <span className="text-xs text-slate-500 font-bold">ج.م / {cycle === 'yearly' ? 'سنة' : 'شهر'}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      <strong>{plan.max_doctors} أطباء</strong> · <strong>{plan.max_branches} فرع</strong> · <strong>{plan.max_patients.toLocaleString('ar-EG')} مريض</strong>
                    </p>

                    <ul className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-teal-700 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100">
                    <div className={`w-full py-2 text-center rounded-xl font-bold text-xs ${
                      isSelected ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isSelected ? '✓ الباقة المحددة' : 'تحديد هذه الباقة'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Proration and Payment Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">طريقة الدفع المحلية وتأكيد الاشتراك</h3>

            {/* Proration details if changing */}
            {isChangingPlan && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs space-y-2 text-amber-950">
                <p className="font-bold">⚖️ الحساب النسبي للترقية (Prorated Balance):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <p>قيمة الباقة الجديدة: <strong>{proration.newPrice} ج.م</strong></p>
                  <p>خصم رصيد الأيام المتبقية: <strong className="text-emerald-700">-{proration.credit} ج.م</strong></p>
                  <p>الصافي المطلوب دفعه الآن: <strong className="text-teal-900 text-sm">{proration.netDue} ج.م</strong></p>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { id: 'fawry', label: '⚡ فوري باي (Fawry)', desc: 'كود دفع فوري لأي منفذ أو تطبيق' },
                { id: 'vodafone_cash', label: '📱 محفظة إلكترونية', desc: 'فودافون كاش / أورنج / وي' },
                { id: 'instapay', label: '💳 إنستاباي (InstaPay)', desc: 'تحويل بنكي لحظي فوري' },
                { id: 'card', label: '💳 بطاقة بنكية / ميزة', desc: 'فيزا وماستركارد وكارت ميزة' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as EgyptianPaymentMethod)}
                  className={`p-3.5 rounded-xl border text-right transition ${
                    paymentMethod === m.id
                      ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{m.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Conditional input for wallet / instapay */}
            {paymentMethod === 'vodafone_cash' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <p className="font-semibold text-slate-800">
                  📲 رقم التحويل المعتمد لشركة المنصة: <strong className="font-mono text-teal-900">01029384756</strong> (فودافون كاش)
                </p>
                <div>
                  <label className="block text-slate-600 mb-1">أدخل رقم محفظتك المحول منها:</label>
                  <input
                    type="tel"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 text-xs w-64 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'instapay' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
                <p className="font-semibold text-slate-800">
                  🏦 عنوان الدفع اللحظي عبر إنستاباي (IPA): <strong className="font-mono text-teal-900">almada@instapay</strong>
                </p>
                <p className="text-slate-500">سيتم تفعيل الباقة ومطابقة الحساب فور إتمام التحويل من تطبيقك البنكي.</p>
              </div>
            )}

            {/* Action button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                المبلغ الإجمالي للدفع:{' '}
                <strong className="text-xl text-teal-800">
                  {isChangingPlan ? proration.netDue : cycle === 'yearly' ? SUBSCRIPTION_PLANS.find(p=>p.code===selectedPlanCode)?.yearly_price : SUBSCRIPTION_PLANS.find(p=>p.code===selectedPlanCode)?.monthly_price} ج.م
                </strong>
              </span>

              <button
                type="button"
                disabled={isPending}
                onClick={handleProcessPayment}
                className="py-2.5 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition shadow-xs"
              >
                {isPending ? 'جارٍ المعالجة…' : 'تأكيد الدفع والتجديد الآن ➔'}
              </button>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 space-y-2">
                <p className="font-bold text-sm">✅ {feedback.message}</p>
                {feedback.fawryCode && (
                  <div className="rounded-lg bg-white p-3 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">كود دفع فوري (صالح 48 ساعة):</span>
                      <span className="text-2xl font-black font-mono text-amber-800 tracking-wider">
                        {feedback.fawryCode}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-800 font-semibold">ادفع بالرقم المرجعي ⚡</span>
                  </div>
                )}
                {feedback.transaction_id && (
                  <p className="text-xs text-emerald-800 font-mono">رقم المعاملة: {feedback.transaction_id}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Invoices Tab */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">سجل فواتير الاشتراكات السحابية</h3>
            <span className="text-xs text-slate-400">إيصالات ضريبية معتمدة قابلة للطباعة</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">الفترة المغطاة</th>
                  <th className="p-3">الباقة</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">المبلغ الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-3 text-slate-500">{inv.period}</td>
                    <td className="p-3 font-medium text-teal-900">{inv.plan_name}</td>
                    <td className="p-3">
                      <span>{inv.payment_method_name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{inv.reference_no}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{inv.total} ج.م</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        مدفوعة ✓
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                      >
                        طباعة الإيصال 🖨️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
