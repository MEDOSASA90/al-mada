import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listClinicExports } from '@/lib/exports';
import { ExportForm } from './export-form';

export const dynamic = 'force-dynamic';

export default async function ExportPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  if (!['clinic_owner', 'clinic_admin'].includes(membership.role)) {
    redirect('/');
  }

  const exportsHistory = await listClinicExports();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="text-teal-800 hover:underline">
                لوحة العيادة
              </Link>
              <span>/</span>
              <Link href="/settings" className="text-teal-800 hover:underline">
                مركز الإعدادات
              </Link>
              <span>/</span>
              <span>تصدير البيانات</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">تصدير بيانات العيادة (Data Export)</h1>
            <p className="mt-1 text-sm text-slate-600">
              تصدير كامل وشفاف لجميع سجلات المرضى والمواعيد والتقارير المالية وفق اشتراطات حماية البيانات وقانون 151 لسنة 2020.
            </p>
          </div>
          <Link href="/settings/trash" className="secondary-button text-sm">
            سلة المحذوفات ←
          </Link>
        </header>

        {/* Export Action Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">توليد حزمة تصدير جديدة</h2>
          <ExportForm />
        </section>

        {/* Export Archive History */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">سجل حزم التصدير والنسخ السابقة</h2>
            <p className="text-xs text-slate-500 mt-1">تُحفظ سجلات التصدير لأغراض التدقيق الإداري والأمني.</p>
          </div>

          {exportsHistory.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {exportsHistory.map((exp) => (
                <div key={exp.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">
                      {exp.export_type === 'full_backup' ? 'نسخة احتياطية شاملة' : exp.export_type}
                    </span>
                    <span className="mx-2 text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      الصيغة: {exp.export_format.toUpperCase()} · السجلات: {exp.records_count}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      التاريخ: {new Date(exp.created_at).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
                    مكتمل ({Math.round(exp.file_size_bytes / 1024)} KB)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              لا توجد عمليات تصدير سابقة مسجلة للعيادة.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
