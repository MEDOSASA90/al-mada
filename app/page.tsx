import { redirect } from 'next/navigation';
import { listPatients } from '@/lib/patients';
import { listDoctors, listBranches } from '@/lib/staff';
import { countAppointmentsForToday } from '@/lib/appointments';
import { getTotalRevenue } from '@/lib/billing';
import { getCurrentSession } from '@/lib/session';
import { SignOutButton } from '@/app/sign-out-button';
import { PatientForm } from '@/app/patients/patient-form';
import { DemoRoleSwitcher } from '@/app/demo-role-switcher';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { user, membership, clinic, isDemo } = session;

  const isDoctor = membership.role === 'doctor' || membership.role === 'visiting_doctor';
  const isOwner = membership.role === 'clinic_owner' || membership.role === 'clinic_admin';
  const isReceptionist = membership.role === 'receptionist';

  let patients: Awaited<ReturnType<typeof listPatients>> = [];
  let doctors: Awaited<ReturnType<typeof listDoctors>> = [];
  let branches: Awaited<ReturnType<typeof listBranches>> = [];
  let todayAppointments = 0;
  let revenue = 0;
  let error: string | null = null;

  try {
    const [pts, docs, branchList, apptsCount, rev] = await Promise.all([
      listPatients({ limit: 25 }),
      listDoctors(),
      listBranches(),
      countAppointmentsForToday(),
      getTotalRevenue(),
    ]);
    patients = pts;
    doctors = docs;
    branches = branchList;
    todayAppointments = apptsCount;
    revenue = rev;
  } catch (e) {
    error = e instanceof Error ? e.message : 'تعذّر تحميل البيانات';
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {isDemo && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/90 p-4 text-teal-950 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <p className="font-bold text-sm">وضع المعاينة الفورية (Demo Preview) مفعّل</p>
                  <p className="text-xs text-teal-800">
                    تصفح كافة شاشات العيادة، الكشوفات، الحجوزات، الفواتير، والأدوية فورياً ببيانات تجريبية كاملة.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold text-white">
                مساحة عمل نشطة
              </span>
            </div>
            <DemoRoleSwitcher currentRole={membership.role} />
          </div>
        )}

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="eyebrow">المدى · مساحة العيادة</p>
            <h1 className="text-2xl font-bold text-slate-900">{clinic?.name_ar || clinic?.name || 'عيادتي'}</h1>
            <p className="mt-1 text-sm text-slate-600">{user.email} · {roleLabel(membership.role)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="secondary-button inline-flex items-center text-sm">
              بوابة المريض
            </Link>
            {['clinic_owner', 'clinic_admin'].includes(membership.role) && (
              <Link
                href="/settings"
                className="secondary-button inline-flex items-center gap-1.5 text-sm font-semibold text-teal-950 bg-teal-50/80 border-teal-300 hover:bg-teal-100"
              >
                <span>⚙️</span>
                <span>مركز الإعدادات</span>
              </Link>
            )}
            {['clinic_owner', 'clinic_admin', 'receptionist'].includes(membership.role) && (
              <Link href="/settings/patient-links" className="secondary-button inline-flex items-center text-sm">
                طلبات ربط المرضى
              </Link>
            )}
            {['clinic_owner', 'clinic_admin'].includes(membership.role) && (
              <>
                <Link href="/settings/staff" className="secondary-button inline-flex items-center text-sm">
                  👥 الطاقم
                </Link>
                <Link href="/settings/branches" className="secondary-button inline-flex items-center text-sm">
                  🏢 الفروع
                </Link>
                <Link href="/settings/notifications" className="secondary-button inline-flex items-center text-sm">
                  📲 الواتساب
                </Link>
                <Link href="/settings/subscription" className="secondary-button inline-flex items-center text-sm">
                  ⭐ الاشتراك
                </Link>
                <Link href="/settings/export" className="secondary-button inline-flex items-center text-sm">
                  📦 تصدير
                </Link>
                <Link href="/settings/trash" className="secondary-button inline-flex items-center text-sm">
                  ♻️ المحذوفات
                </Link>
              </>
            )}
            <SignOutButton />
          </div>
        </header>

        {/* Operational Modules Navigation Bar */}
        <nav aria-label="أقسام العيادة الرئيسية" className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <Link
            href="/appointments"
            className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
          >
            <span className="block text-xl mb-1">📅</span>
            <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">جدول المواعيد</span>
            <span className="block text-[11px] text-slate-500">حجز وتنظيم الكشوفات</span>
          </Link>
          <Link
            href="/patients"
            className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
          >
            <span className="block text-xl mb-1">👥</span>
            <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">سجل المرضى</span>
            <span className="block text-[11px] text-slate-500">ملفات وتاريخ العلاج</span>
          </Link>
          <Link
            href="/queue"
            className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
          >
            <span className="block text-xl mb-1">📢</span>
            <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">طابور الانتظار</span>
            <span className="block text-[11px] text-slate-500">استدعاء الأدوار</span>
          </Link>
          <Link
            href="/billing"
            className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
          >
            <span className="block text-xl mb-1">💳</span>
            <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">
              {isDoctor && !isOwner ? 'أتعابي وحساباتي' : 'الحسابات والكاشير'}
            </span>
            <span className="block text-[11px] text-slate-500">
              {isDoctor && !isOwner ? 'كشف حساب مستحقاتك' : 'فواتير ومصروفات والوردية'}
            </span>
          </Link>
          {isDoctor && (
            <Link
              href="/clinical"
              className="flex-1 min-w-[130px] rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 p-3 text-center transition group"
            >
              <span className="block text-xl mb-1">🩺</span>
              <span className="block text-sm font-bold text-teal-950 group-hover:text-teal-900">العيادة الطبية</span>
              <span className="block text-[11px] text-teal-700">كشوفات وروشتات اليوم</span>
            </Link>
          )}
          {(!isDoctor || isOwner) && (
            <>
              <Link
                href="/packages"
                className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
              >
                <span className="block text-xl mb-1">🎁</span>
                <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">باقات الجلسات</span>
                <span className="block text-[11px] text-slate-500">متابعة الجلسات</span>
              </Link>
              <Link
                href="/inventory"
                className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
              >
                <span className="block text-xl mb-1">📦</span>
                <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">المخزون الطبي</span>
                <span className="block text-[11px] text-slate-500">مستلزمات وعهد العيادة</span>
              </Link>
              {isOwner && (
                <Link
                  href="/settings"
                  className="flex-1 min-w-[130px] rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 p-3 text-center transition group"
                >
                  <span className="block text-xl mb-1">⚙️</span>
                  <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-900">إعدادات النظام</span>
                  <span className="block text-[11px] text-slate-500">الفروع والطاقم والنسخ</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Live Metrics Stats */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="المرضى المسجلون" value={patients.length} tone="blue" href="/patients" />
          <Stat
            label="الأطباء المتاحون"
            value={doctors.length}
            tone="green"
            href={isOwner ? '/settings/staff' : '/appointments'}
          />
          <Stat label="مواعيد اليوم" value={todayAppointments} tone="amber" href="/appointments" />
          <Stat
            label={isDoctor && !isOwner ? 'أتعابي المستحقة' : 'الإيرادات المحصلة'}
            value={isDoctor && !isOwner ? '735 ج.م' : `${revenue.toLocaleString('ar-EG')} ج.م`}
            tone="slate"
            href="/billing"
          />
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            تعذّر تحميل البيانات: {error}
          </div>
        )}

        <PatientForm doctors={doctors} branches={branches} />

        {/* Recent Patients */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">أحدث المرضى</h2>
            <Link href="/patients" className="text-sm font-semibold text-teal-800 hover:underline">
              كل المرضى ←
            </Link>
          </div>
          {patients.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">لا توجد سجلات مرضى حتى الآن.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patients.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                  <Link href={`/patients/${p.id}`} className="min-w-0">
                    <p className="font-medium text-slate-900 hover:text-teal-800">{p.full_name}</p>
                    <p className="text-sm text-slate-500">{p.file_number} · {p.phone}</p>
                  </Link>
                  <time className="shrink-0 text-xs text-slate-400" dateTime={p.created_at}>
                    {new Date(p.created_at).toLocaleDateString('ar-EG')}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    clinic_owner: 'مالك العيادة',
    clinic_admin: 'مدير العيادة',
    doctor: 'طبيب',
    receptionist: 'استقبال',
    nurse: 'تمريض',
    accountant: 'محاسب',
  };
  return labels[role] ?? role;
}

function Stat({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string | number;
  tone: 'blue' | 'green' | 'amber' | 'slate';
  href?: string;
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
    slate: 'bg-slate-100 text-slate-900',
  };
  const content = (
    <div className={`rounded-xl p-5 ${tones[tone]} transition hover:opacity-95`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold truncate">{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
