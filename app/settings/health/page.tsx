import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { checkSystemHealth } from '@/lib/health';
import { HealthDashboard } from './health-dashboard';

export const dynamic = 'force-dynamic';

export default async function SystemHealthSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  const isOwner = ['clinic_owner', 'clinic_admin'].includes(membership.role);
  if (!isOwner) {
    redirect('/');
  }

  const report = await checkSystemHealth();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Link href="/" className="text-teal-800 hover:underline">
                  لوحة العيادة
                </Link>
                <span>/</span>
                <Link href="/settings" className="text-teal-800 hover:underline">
                  مركز الإعدادات
                </Link>
                <span>/</span>
                <span>صحة النظام وجاهزية الإطلاق</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  لوحة صحة النظام والجاهزية التشغيلية
                </h1>
                <span className="rounded-full bg-emerald-800 text-white text-xs font-bold px-2.5 py-0.5">
                  المرحلة 7
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                الفحص التشخيصي المباشر لقاعدة البيانات، سياسات عزل المستأجرين، استقرار الخدمات، والامتثال لقانون حماية البيانات المصري 151 لسنة 2020.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/settings/export"
                className="secondary-button inline-flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <span>📦</span>
                <span>تصدير البيانات</span>
              </Link>
              <Link
                href="/settings/trash"
                className="secondary-button inline-flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <span>🗑️</span>
                <span>سلة المحذوفات</span>
              </Link>
            </div>
          </div>
        </header>

        <HealthDashboard initialReport={report} />
      </div>
    </main>
  );
}
