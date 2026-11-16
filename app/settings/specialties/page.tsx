import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { SpecialtyHub } from './specialty-hub';

export const dynamic = 'force-dynamic';

export default async function SpecialtiesSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  const isOwner = ['clinic_owner', 'clinic_admin', 'doctor', 'visiting_doctor'].includes(membership.role);
  if (!isOwner) {
    redirect('/');
  }

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
                <span>الحزم التخصصية للعيادة</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  الحزم والقوالب التخصصية (Specialty Clinical Packs)
                </h1>
                <span className="rounded-full bg-rose-800 text-white text-xs font-bold px-2.5 py-0.5">
                  المرحلة 8
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                حاسبات طب النساء والتوليد، جدول تطعيمات الأطفال المعتمد بوزارة الصحة المصرية، وضوابط جلسات الليزر التجميلي.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/settings/feature-flags"
                className="secondary-button inline-flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <span>🎛️</span>
                <span>إطلاق الميزات</span>
              </Link>
            </div>
          </div>
        </header>

        <SpecialtyHub />
      </div>
    </main>
  );
}
