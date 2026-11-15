import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getClinicSubscription } from '@/lib/subscriptions';
import { SubscriptionManager } from './subscription-manager';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  const isOwner = membership.role === 'clinic_owner' || membership.role === 'clinic_admin';
  if (!isOwner) {
    redirect('/');
  }

  const subscription = await getClinicSubscription();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/" className="hover:text-teal-800">الرئيسية</Link>
              <span>/</span>
              <Link href="/settings/staff" className="hover:text-teal-800">الإعدادات</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">الاشتراك والباقات</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة اشتراك العيادة والفوترة</h1>
            <p className="text-sm text-slate-500">
              متابعة السعة، الفروع، الأطباء، وتجديد باقة المنصة السحابية
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← العودة للرئيسية
          </Link>
        </header>

        <SubscriptionManager subscription={subscription} />
      </div>
    </main>
  );
}
