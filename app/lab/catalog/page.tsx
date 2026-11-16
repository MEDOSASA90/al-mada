import Link from 'next/link';
import { LAB_TEST_DIRECTORY, LabCategory } from '@/lib/lab';

export default function LabCatalogPage() {
  const tests = LAB_TEST_DIRECTORY;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <span className="text-teal-800 font-bold">دليل التحاليل والفحوصات المعملية</span>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>📋</span>
              <span>دليل التحاليل الطبية والأسعار الرسمية (Test Directory)</span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              دليل الفحوصات التشخيصية المعتمد، شروط الصيام، أنواع الأنابيب، وزمن خروج النتائج.
            </p>
          </div>
          <Link
            href="/lab/orders/new"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 transition shadow-sm"
          >
            ➕ تسجيل فحص جديد
          </Link>
        </header>

        {/* Tests Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                      {test.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{test.nameAr}</h3>
                    <p className="text-xs text-slate-500 font-mono">{test.nameEn}</p>
                  </div>
                  <span className="text-sm font-black text-teal-900 font-mono bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                    {test.priceEgp} ج.م
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {test.clinicalSignificanceAr}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">أنبوبة العينة المطلوبة</span>
                    <span className="font-bold text-slate-800">{test.tubeLabelAr}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">شروط الصيام والتحضير</span>
                    <span className="font-medium text-slate-800">{test.fastingRequirementsAr}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">نوع العينة</span>
                    <span className="font-medium text-slate-800">{test.sampleTypeAr}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">زمن خروج النتيجة (TAT)</span>
                    <span className="font-bold text-teal-800">{test.turnaroundTimeHours} ساعات</span>
                  </div>
                </div>

                {/* Sub-parameters count */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>المكونات المشملة:</span>
                  <span className="font-bold text-slate-800">
                    {test.parameters.map((p) => p.nameAr).join(' · ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{test.categoryLabelAr}</span>
                <Link
                  href="/lab/orders/new"
                  className="font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1"
                >
                  <span>طلب الفحص لمريض</span>
                  <span>←</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
