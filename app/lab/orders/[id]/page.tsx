'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getLabOrderById, evaluateLabResult, generateAILabInterpretation, LabResultValue } from '@/lib/lab';

export default function LabOrderResultsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || 'order-101';
  const order = getLabOrderById(orderId) || getLabOrderById('order-101')!;

  const [results, setResults] = useState<LabResultValue[]>(order.results);
  const [technicalNotes, setTechnicalNotes] = useState(order.technicalNotes || '');
  const [aiSummary, setAiSummary] = useState(order.aiInterpretationAr || '');
  const [status, setStatus] = useState(order.status);
  const [reviewerName, setReviewerName] = useState(order.consultantReviewerName || '');
  const [isApproved, setIsApproved] = useState(order.status === 'approved' || order.status === 'delivered');
  const [saving, setSaving] = useState(false);

  function handleValueChange(paramId: string, newValue: string) {
    if (isApproved) return;
    setResults((prev) =>
      prev.map((r) => {
        if (r.parameterId === paramId) {
          // Automatic evaluation logic
          let evalResult = r.evaluation;
          const num = parseFloat(newValue);
          if (!Number.isNaN(num)) {
            if (num > 7.0 && r.parameterId === 'hba1c_val') evalResult = 'high';
            else if (num > 400 && r.parameterId === 'fbs_val') evalResult = 'critical_high';
            else if (num < 50 && r.parameterId === 'fbs_val') evalResult = 'critical_low';
            else if (num > 16.5 && r.parameterId === 'hb') evalResult = 'high';
            else if (num < 10.0 && r.parameterId === 'hb') evalResult = 'low';
            else evalResult = 'normal';
          }
          return { ...r, value: newValue, evaluation: evalResult };
        }
        return r;
      })
    );
  }

  function handleGenerateAI() {
    const updatedOrder = { ...order, results };
    const summary = generateAILabInterpretation(updatedOrder);
    setAiSummary(summary);
  }

  function handleApprove() {
    if (!confirm('هل أنت متأكد من اعتماد نتائج هذا الفحص وتوقيعه كاستشاري معمل؟ سيتم قفل النتائج وإتاحة التقرير الرسمي للمريض بكود QR.')) {
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setStatus('approved');
      setIsApproved(true);
      setReviewerName('أ.د. عصام الدين الفقي (استشاري الباثولوجيا الإكلينيكية والتحاليل)');
      setSaving(false);
    }, 500);
  }

  const criticals = results.filter((r) => r.evaluation.startsWith('critical'));

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <span>إدارة الفحوصات</span>
          <span>/</span>
          <span className="text-teal-800 font-bold">{order.barcode}</span>
        </div>

        {/* Order Header Card */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-base font-black text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                  {order.barcode}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                  status === 'approved' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {status === 'approved' ? 'معتمد رسمياً وموقع إلكترونياً ✓' : 'قيد التدقيق والاعتماد المعملي'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                فحص المريض: {order.patientName} ({order.patientGender === 'male' ? 'ذكر' : 'أنثى'}، {order.patientAge} سنة)
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                هاتف: <span className="font-mono">{order.patientPhone}</span> · الطبيب المحول: {order.referringDoctorName || 'مباشر'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/lab/orders/${order.id}/report`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 transition shadow-sm"
              >
                <span>📄</span>
                <span>معاينة التقرير الرسمي بـ QR Code</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Critical Value Warning if present */}
        {criticals.length > 0 && (
          <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-rose-950 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <p className="font-black text-sm text-rose-900">تنبيه سريري فوري: توجد نتائج حرجة (Panic Critical Values)!</p>
                <p className="text-xs text-rose-800 mt-0.5">
                  {criticals.map((c) => `${c.parameterNameAr}: ${c.value} ${c.unit}`).join(' — ')}
                </p>
              </div>
            </div>
            <a
              href={`tel:${order.patientPhone}`}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 transition"
            >
              اتصال فوري بالمريض
            </a>
          </div>
        )}

        {/* Results Worksheet Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔬</span>
                <span>كشف إدخال وتدقيق نتائج الفحص المعملي (Worksheet)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                يتم تقييم كل نتيجة تلقائياً مقارنة بالمعدلات المرجعية (Normal Reference Ranges) طبقاً لسن ونوع المريض.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {results.length} بارامترات مطلوبة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الفحص والمكون</th>
                  <th className="p-3">النتيجة المدخلة</th>
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">المعدل الطبيعي المعتمد</th>
                  <th className="p-3">التقييم السريري</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {results.map((item) => (
                  <tr key={item.parameterId} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{item.parameterNameAr}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.parameterNameEn}</div>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.value}
                        disabled={isApproved}
                        onChange={(e) => handleValueChange(item.parameterId, e.target.value)}
                        className={`w-28 rounded-lg border p-1.5 text-xs text-center font-mono font-bold ${
                          isApproved ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white border-slate-300 focus:border-teal-600'
                        }`}
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-600">{item.unit}</td>
                    <td className="p-3 font-mono text-slate-500">{item.refRangeText}</td>
                    <td className="p-3">
                      <EvaluationBadge evaluation={item.evaluation} />
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Clinical Interpretation & Assistant */}
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-bold text-indigo-950 text-sm">التفسير والتحليل الإكلينيكي بالذكاء الاصطناعي (AI Interpretation)</h3>
                <p className="text-[11px] text-indigo-800">
                  صياغة استنتاج سريري أولي لمساعدة الطبيب وتوضيح دلالات الفحوصات للمريض في بوابته.
                </p>
              </div>
            </div>
            {!isApproved && (
              <button
                type="button"
                onClick={handleGenerateAI}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 transition shadow-xs"
              >
                تحديث التفسير الآلي
              </button>
            )}
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-indigo-100 text-xs text-slate-800 leading-relaxed">
            {aiSummary || 'اضغط على «تحديث التفسير الآلي» لتوليد الملخص السريري فورياً.'}
          </div>
        </section>

        {/* Technical Notes & Consultant Review Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>✍️</span>
            <span>الملاحظات الفنية والاعتماد الطبي للاستشاري</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات الفني المسئول (حالة العينة والأجهزة):</label>
            <textarea
              rows={2}
              disabled={isApproved}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600"
              placeholder="سحب طبيعي بدون تحلل أو تخثر، تم فحصها على جهاز Sysmex XN-550..."
            />
          </div>

          {isApproved ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-emerald-950">✓ تم اعتماد وقفل الفحص رسمياً بواسطة:</p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">{reviewerName}</p>
                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">التوقيع والختم الإلكتروني موثق في التقرير الرسمي.</p>
              </div>
              <Link
                href={`/lab/orders/${order.id}/report`}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 transition shadow-xs"
              >
                طباعة التقرير بـ QR
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                الاعتماد يمنح التقرير الصفة الرسمية ويولّد رمز الـ QR للتحقق السحابي.
              </span>
              <button
                type="button"
                onClick={handleApprove}
                disabled={saving}
                className="rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs px-6 py-2.5 transition shadow-sm flex items-center gap-2"
              >
                <span>{saving ? 'جارٍ الاعتماد والتوقيع…' : 'اعتماد وتوقيع التقرير الطبي رسمياً'}</span>
                <span>🔒</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EvaluationBadge({ evaluation }: { evaluation: string }) {
  switch (evaluation) {
    case 'normal':
      return <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-bold text-[10px]">طبيعي ✓</span>;
    case 'high':
      return <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-bold text-[10px]">مرتفع ⬆</span>;
    case 'low':
      return <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-bold text-[10px]">منخفض ⬇</span>;
    case 'critical_high':
      return <span className="rounded bg-rose-600 text-white px-2 py-0.5 font-black text-[10px] animate-pulse">حرج مرتفع 🚨</span>;
    case 'critical_low':
      return <span className="rounded bg-rose-600 text-white px-2 py-0.5 font-black text-[10px] animate-pulse">حرج منخفض 🚨</span>;
    default:
      return <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px]">{evaluation}</span>;
  }
}
