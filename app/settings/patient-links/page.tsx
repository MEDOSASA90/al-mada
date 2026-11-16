import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PatientLinkQueue } from './request-queue';

export const dynamic = 'force-dynamic';

export default async function PatientLinkRequestsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  const { membership, isDemo } = session;
  if (!['clinic_owner', 'clinic_admin', 'receptionist'].includes(membership.role)) redirect('/');

  if (isDemo) {
    const demoRequests = [
      {
        id: 'link-req-001',
        patient_name: 'محمد إبراهيم حسن',
        file_number: '000101',
        requester_email: 'm.ibrahim@example.com',
        requested_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Link href="/" className="text-teal-800 hover:underline">
                لوحة العيادة
              </Link>
              <span>/</span>
              <Link href="/settings" className="text-teal-800 hover:underline">
                مركز الإعدادات
              </Link>
              <span>/</span>
              <span>طلبات ربط المرضى</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">طلبات ربط حسابات المرضى بالبوابة</h1>
            <p className="mt-2 text-sm text-slate-600">
              لا يعتمد الطلب تلقائيًا. تحقق من هوية المريض أو ممثله قبل اعتماد ربط سجله بالبوابة الإلكترونية.
            </p>
          </header>
          <PatientLinkQueue requests={demoRequests} />
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_patient_portal_link_requests_for_current_clinic');
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="text-teal-800 hover:underline">
              لوحة العيادة
            </Link>
            <span>/</span>
            <Link href="/settings" className="text-teal-800 hover:underline">
              مركز الإعدادات
            </Link>
            <span>/</span>
            <span>طلبات ربط المرضى</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">طلبات ربط حسابات المرضى بالبوابة</h1>
          <p className="mt-2 text-sm text-slate-600">
            لا يعتمد الطلب تلقائيًا. تحقق من هوية المريض أو ممثله قبل اعتماد ربط سجله بالبوابة الإلكترونية.
          </p>
        </header>
        {error ? (
          <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            تعذّر تحميل الطلبات.
          </div>
        ) : (
          <PatientLinkQueue
            requests={
              (data ?? []) as Array<{
                id: string;
                patient_name: string;
                file_number: string;
                requester_email: string;
                requested_at: string;
              }>
            }
          />
        )}
      </div>
    </main>
  );
}
