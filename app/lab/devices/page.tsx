import Link from 'next/link';
import { listAnalyzers } from '@/lib/lab';

export default function LabDevicesPage() {
  const analyzers = listAnalyzers();

  const demoReagents = [
    {
      id: 'reg-1',
      name: 'Sysmex Cellpack DCL Diluent (20L)',
      analyzerName: 'Sysmex XN-550',
      remainingTests: 840,
      expiryDate: '2027-04-30',
      status: 'good',
      statusLabel: 'رصيد ممتاز',
    },
    {
      id: 'reg-2',
      name: 'Roche Cobas c311 Creatinine Jaffe Gen.2',
      analyzerName: 'Roche Cobas c311',
      remainingTests: 320,
      expiryDate: '2027-02-15',
      status: 'good',
      statusLabel: 'رصيد كافٍ',
    },
    {
      id: 'reg-3',
      name: 'Roche Elecsys TSH Reagent Kit (200 Tests)',
      analyzerName: 'Roche Cobas e411',
      remainingTests: 45,
      expiryDate: '2026-12-28',
      status: 'low',
      statusLabel: '⚠️ رصيد منخفض - بحاجة لإعادة طلب',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <span className="text-teal-800 font-bold">أجهزة المعمل والربط الآلي ومراقبة الجودة (QC)</span>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>⚙️</span>
              <span>أجهزة التحاليل الآلية ومراقبة الجودة (Analyzers & QC)</span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              متابعة حالة الاتصال الآلي للأجهزة، الفحص اليومي لعينات الكنترول (Daily QC)، وأرصدة كواشف ومحاليل الفحص.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>الربط الآلي LIS Interfacing نشط</span>
            </span>
          </div>
        </header>

        {/* Analyzers Grid */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🖥️</span>
            <span>الأجهزة المعملية الآلية المتصلة بالشبكة</span>
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {analyzers.map((dev) => (
              <div
                key={dev.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5">
                      {dev.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dev.status === 'qc_passed' || dev.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dev.status === 'qc_passed' ? 'فحص الجودة معتمد ✓' : dev.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{dev.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{dev.manufacturer}</p>
                  <p className="text-xs text-slate-600 mt-2">الموديل: <strong className="font-mono">{dev.model}</strong></p>

                  <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الطاقة الاستيعابية:</span>
                      <span className="font-bold text-slate-800 font-mono">{dev.throughputPerHour} عينة/ساعة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">آخر فحص كنترول QC:</span>
                      <span className="font-bold text-emerald-700 font-mono">{dev.lastQcDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[10px]">تاريخ التركيب: {dev.installedAt}</span>
                  <button
                    type="button"
                    className="text-teal-700 hover:text-teal-900 font-bold text-xs"
                  >
                    سجل المعايرة ←
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reagents & Consumables Tracker */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📦</span>
                <span>أرصدة كواشف ومحاليل التحاليل (Reagent Kits Tracker)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تنبيهات تلقائية عند انخفاض عدد الاختبارات المتبقية بالكاشف أو اقتراب تاريخ الصلاحية.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {demoReagents.length} كواشف مسجلة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم الكاشف / المحلول</th>
                  <th className="p-3">الجهاز المخصص</th>
                  <th className="p-3">الاختبارات المتبقية</th>
                  <th className="p-3">تاريخ الصلاحية</th>
                  <th className="p-3">الحالة والتنبيه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {demoReagents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="p-3 font-mono text-slate-600">{r.analyzerName}</td>
                    <td className="p-3 font-mono font-bold text-sm text-slate-900">{r.remainingTests} تيست</td>
                    <td className="p-3 font-mono text-slate-600">{r.expiryDate}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        r.status === 'good' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {r.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
