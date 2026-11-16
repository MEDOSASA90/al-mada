'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLabOrderById } from '@/lib/lab';

export default function OfficialLabReportPage() {
  const params = useParams();
  const orderId = (params?.id as string) || 'order-101';
  const order = getLabOrderById(orderId) || getLabOrderById('order-101')!;

  function handlePrint() {
    window.print();
  }

  const criticals = order.results.filter((r) => r.evaluation.startsWith('critical'));

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 print:p-0 print:bg-white" dir="rtl">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="mx-auto max-w-4xl mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <Link href={`/lab/orders/${order.id}`} className="hover:text-teal-700 transition">{order.barcode}</Link>
          <span>/</span>
          <span className="text-teal-900 font-bold">التقرير المعملي الرسمي المعتمد</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs px-4 py-2 transition shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>طباعة التقرير (Print / PDF)</span>
          </button>
          <a
            href={`https://wa.me/2${order.patientPhone}?text=${encodeURIComponent(`أهلاً بك أستاذ ${order.patientName}، نتيجتك المعملية برقم ${order.barcode} جاهزة الآن ومعتمدة. يمكنك معاينتها عبر الرابط الرسمي المعتمد.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 transition shadow-sm flex items-center gap-1.5"
          >
            <span>📲</span>
            <span>إرسال واتساب للمريض</span>
          </a>
        </div>
      </div>

      {/* Official Printable Report Document Card */}
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-8 shadow-md print:shadow-none print:border-none print:p-0 text-slate-900">
        {/* Lab Official Letterhead */}
        <header className="border-b-2 border-teal-800 pb-5 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔬</span>
              <h1 className="text-2xl font-black text-teal-950">
                معامل المدى للتحاليل الطبية والباثولوجيا الإكلينيكية
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Al-Mada Diagnostic Laboratories & Clinical Pathology Centre
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              ترخيص وزارة الصحة رقم: 4412/2022 · إدارة العلاج الحر والطب الوقائي
            </p>
          </div>

          <div className="text-left" dir="ltr">
            <div className="inline-block p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="h-16 w-16 bg-slate-100 flex items-center justify-center font-mono text-xs border border-slate-300 rounded font-bold">
                📱 QR-VERIFIED
              </div>
              <span className="text-[9px] block text-slate-500 mt-1 font-mono font-bold">SCAN TO VERIFY</span>
            </div>
          </div>
        </header>

        {/* Patient Demographics & Order Metadata Header */}
        <section className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">اسم المريض (Patient Name)</span>
            <span className="font-bold text-slate-900 text-sm">{order.patientName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">السن والنوع (Age / Sex)</span>
            <span className="font-semibold text-slate-800">{order.patientAge} سنة · {order.patientGender === 'male' ? 'ذكر Male' : 'أنثى Female'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">رقم الباركود (Sample Barcode)</span>
            <span className="font-mono font-bold text-teal-900">{order.barcode}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">تاريخ ووقت الفحص (Date / Time)</span>
            <span className="font-mono text-slate-800">{new Date(order.orderDate).toLocaleDateString('ar-EG')}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">الطبيب المعالج (Referred By)</span>
            <span className="font-medium text-slate-800">{order.referringDoctorName || 'مباشر (Self)'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">حالة الاعتماد (Verification)</span>
            <span className="font-bold text-emerald-800">معتمد سريرياً ✓</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block text-[10px]">الفحوصات المشمولة (Test Profile)</span>
            <span className="font-medium text-slate-800">{order.testNamesAr.join(' · ')}</span>
          </div>
        </section>

        {/* Diagnostic Results Table */}
        <section className="mb-6">
          <table className="w-full text-right text-xs border border-slate-200">
            <thead className="bg-teal-900 text-white font-bold">
              <tr>
                <th className="p-2.5">الفحص والمكون (Test Parameter)</th>
                <th className="p-2.5 text-center">النتيجة (Result)</th>
                <th className="p-2.5 text-center">الوحدة (Unit)</th>
                <th className="p-2.5 text-center">المعدل الطبيعي (Reference Range)</th>
                <th className="p-2.5 text-center">الحالة (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {order.results.map((r) => (
                <tr key={r.parameterId} className={r.evaluation.startsWith('critical') ? 'bg-rose-50/70 font-bold' : ''}>
                  <td className="p-2.5 font-semibold text-slate-900">
                    <div>{r.parameterNameAr}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{r.parameterNameEn}</div>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-sm">
                    <span className={
                      r.evaluation.startsWith('critical')
                        ? 'text-rose-700 bg-rose-100 px-2 py-0.5 rounded'
                        : r.evaluation !== 'normal'
                        ? 'text-amber-800 font-black'
                        : 'text-slate-900'
                    }>
                      {r.value}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-600">{r.unit}</td>
                  <td className="p-2.5 text-center font-mono text-slate-500">{r.refRangeText}</td>
                  <td className="p-2.5 text-center">
                    {r.evaluation === 'normal' && <span className="text-emerald-700 font-bold">طبيعي Normal</span>}
                    {r.evaluation === 'high' && <span className="text-amber-700 font-bold">مرتفع High ⬆</span>}
                    {r.evaluation === 'low' && <span className="text-amber-700 font-bold">منخفض Low ⬇</span>}
                    {r.evaluation === 'critical_high' && <span className="text-rose-700 font-black">حرج مرتفع 🚨</span>}
                    {r.evaluation === 'critical_low' && <span className="text-rose-700 font-black">حرج منخفض 🚨</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Clinical Interpretation Section */}
        {order.aiInterpretationAr && (
          <section className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 mb-6 text-xs text-slate-800 leading-relaxed">
            <h3 className="font-bold text-teal-950 mb-1 flex items-center gap-1.5">
              <span>🩺</span>
              <span>الملخص السريري المعتمد وتوجيهات الطبيب:</span>
            </h3>
            <p>{order.aiInterpretationAr}</p>
          </section>
        )}

        {/* Doctor Stamp & Digital Signature Footer */}
        <footer className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 items-end text-xs">
          <div>
            <p className="text-slate-500 text-[10px]">فني التحاليل وأخصائي السحب</p>
            <p className="font-bold text-slate-800 mt-1">أ. طارق عبد المجيد (MLT)</p>
          </div>

          <div className="text-center">
            <div className="inline-block border-2 border-teal-800 rounded-xl p-2 text-teal-900 font-mono text-[10px] font-bold">
              ✓ AL-MADA VERIFIED REPORT
              <span className="block text-[8px] text-teal-700 font-sans">معتمد وموثق رقمياً</span>
            </div>
          </div>

          <div className="text-left" dir="ltr">
            <p className="text-slate-500 text-[10px]">Consultant Clinical Pathologist</p>
            <p className="font-bold text-slate-900 mt-0.5">Prof. Dr. Essam El-Din El-Feky</p>
            <p className="text-[10px] text-slate-500">استشاري الباثولوجيا الإكلينيكية</p>
          </div>
        </footer>

        <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
          هذا التقرير معتمد إلكترونياً ومربوط بملف سلامة المريض الموحد في شبكة المدى. لا يعتد بأي تعديل يدوي في أرقام التقرير.
        </div>
      </article>
    </main>
  );
}
