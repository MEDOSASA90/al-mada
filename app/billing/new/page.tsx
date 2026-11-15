import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listPatients } from '@/lib/patients';
import { listBranches } from '@/lib/staff';
import { InvoiceCreateForm } from './invoice-form';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ appointment_id?: string; patient_id?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { appointment_id, patient_id } = await searchParams;

  const [patients, branches] = await Promise.all([
    listPatients({ limit: 100 }),
    listBranches(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/billing" className="text-teal-800 hover:underline">
              الحسابات والفواتير
            </Link>
            <span>/</span>
            <span>إصدار فاتورة</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">إصدار فاتورة جديدة</h1>
          <p className="mt-1 text-sm text-slate-600">
            تسجيل بنود الكشف والخدمات الطبية لحساب المريض والكاشير.
          </p>
        </header>

        <InvoiceCreateForm
          patients={patients}
          branches={branches}
          defaultPatientId={patient_id}
          defaultAppointmentId={appointment_id}
        />
      </div>
    </main>
  );
}
