import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listActiveQueueTickets } from '@/lib/queue';
import { QueueBoard } from './queue-board';

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const tickets = await listActiveQueueTickets();

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
              <span>شاشة الطابور</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              طابور الانتظار والاستدعاء
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              تنظيم دخول المرضى واستدعاء الأدوار للعيادات وغرف الكشف.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/appointments" className="secondary-button text-sm">
              جدول المواعيد
            </Link>
          </div>
        </header>

        <QueueBoard tickets={tickets} />
      </div>
    </main>
  );
}
