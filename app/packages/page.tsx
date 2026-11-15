import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listAllClinicPackages } from '@/lib/packages';
import { listPatients } from '@/lib/patients';
import { PackageCreateForm } from './package-create-form';
import { SessionConsumeButton } from './session-consume-button';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const [packages, patients] = await Promise.all([
    listAllClinicPackages(),
    listPatients({ limit: 100 }),
  ]);

  const activeCount = packages.filter((p) => p.is_active && p.used_sessions < p.total_sessions).length;
  const totalSessionsCount = packages.reduce((sum, p) => sum + p.total_sessions, 0);
  const usedSessionsCount = packages.reduce((sum, p) => sum + p.used_sessions, 0);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="text-teal-800 hover:underline">
                ← لوحة العيادة
              </Link>
              <span>/</span>
              <span>باقات العلاج والجلسات</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              إدارة باقات العلاج والجلسات
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              متابعة اشتراكات المرضى في الجلسات المتعددة وتتبع رصيد الجلسات المتبقية.
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-5 shadow-xs">
            <p className="text-xs text-teal-800">الباقات النشطة حالياً</p>
            <p className="mt-1 text-3xl font-extrabold text-teal-950">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-xs">
            <p className="text-xs text-emerald-800">إجمالي الجلسات المستخدمة</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-950">{usedSessionsCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs text-slate-500">إجمالي الجلسات المكتتبة</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{totalSessionsCount}</p>
          </div>
        </section>

        {/* Create form */}
        <PackageCreateForm patients={patients} />

        {/* Packages List */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">سجل الباقات ({packages.length})</h2>
          </div>

          {packages.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              لا توجد باقات علاجية مسجلة بعد.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {packages.map((pkg) => {
                const remaining = pkg.total_sessions - pkg.used_sessions;
                const pct = Math.round((pkg.used_sessions / pkg.total_sessions) * 100);

                return (
                  <div
                    key={pkg.id}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="space-y-1.5 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            pkg.is_active && remaining > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pkg.is_active && remaining > 0 ? 'نشطة' : 'منتهية'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        المريض: <strong className="text-slate-800">{pkg.patient_name}</strong> · السعر:{' '}
                        {pkg.price} ج.م
                      </p>

                      {/* Progress Bar for sessions */}
                      <div className="w-56 mt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>
                            المستهلك: {pkg.used_sessions} من {pkg.total_sessions}
                          </span>
                          <span>متبقي: {remaining}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              remaining > 0 ? 'bg-teal-600' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <SessionConsumeButton
                        packageId={pkg.id}
                        remaining={remaining}
                        active={pkg.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
