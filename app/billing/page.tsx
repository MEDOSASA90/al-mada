import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import {
  listInvoices,
  getTotalRevenue,
  listExpenses,
  getTotalExpenses,
  getTodayShift,
  listDoctorCommissions,
} from '@/lib/billing';
import { ExpenseForm } from './expense-form';
import { ShiftClosingDialog } from './shift-closing-dialog';
import { DoctorPayoutButton } from './doctor-payout-button';

export const dynamic = 'force-dynamic';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { role } = session.membership;
  const isOwner = role === 'clinic_owner' || role === 'clinic_admin';
  const isDoctor = role === 'doctor' || role === 'visiting_doctor';

  const { status } = await searchParams;
  const [invoices, totalRevenue, expenses, totalExpenses, todayShift, doctorCommissions] =
    await Promise.all([
      listInvoices({ status }),
      getTotalRevenue(),
      listExpenses(15),
      getTotalExpenses(),
      getTodayShift(),
      listDoctorCommissions({
        doctorId: session.user.id,
        isOwner,
      }),
    ]);

  const netProfit = totalRevenue - totalExpenses;
  const unpaidCount = invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid').length;

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
              <span>الحسابات والمالية</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {isDoctor && !isOwner ? 'أتعابي وحساباتي المالية' : 'إدارة الفواتير والتحصيل والخزينة'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {isDoctor && !isOwner
                ? 'متابعة كشوفاتك المنفذة ونسبتك المقررة وأرباحك المستحقة للصرف.'
                : 'متابعة الفواتير، التحصيلات النقدية، المصروفات اليومية وتقفيل الوردية.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isDoctor && <ShiftClosingDialog shift={todayShift} />}
            <Link href="/billing/new" className="primary-button inline-flex items-center gap-1.5 text-xs py-2 px-3">
              <span>+</span>
              <span>إصدار فاتورة جديدة</span>
            </Link>
          </div>
        </header>

        {/* Financial Highlights */}
        {isDoctor && !isOwner ? (
          // Doctor View: Only Doctor's own cases and personal earnings
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-5 shadow-xs">
              <p className="text-xs text-teal-800">أرباحي ومستحقاتي الحالية</p>
              <p className="mt-1 text-3xl font-extrabold text-teal-950 font-mono">
                {doctorCommissions.reduce((sum, d) => sum + d.doctor_payout, 0).toLocaleString('ar-EG')}{' '}
                <span className="text-sm font-sans">ج.م</span>
              </p>
              <p className="text-[11px] text-teal-700 mt-1">نسبة أتعابك المقررة: 70%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500">عدد الكشوفات المنجزة</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {doctorCommissions.reduce((sum, d) => sum + d.total_visits, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500">إجمالي قيمة الكشوفات</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-800 font-mono">
                {doctorCommissions.reduce((sum, d) => sum + d.gross_revenue, 0).toLocaleString('ar-EG')}{' '}
                <span className="text-sm font-sans">ج.م</span>
              </p>
            </div>
          </section>
        ) : (
          // Clinic Owner / Manager / Receptionist Financial Cards
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-xs">
              <p className="text-xs text-emerald-800">إجمالي الإيرادات المحصلة</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-950 font-mono">
                {totalRevenue.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-5 shadow-xs">
              <p className="text-xs text-rose-800">المصروفات النثرية والتشغيلية</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-950 font-mono">
                {totalExpenses.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
              </p>
            </div>
            {isOwner && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-5 shadow-xs">
                <p className="text-xs text-teal-800">صافي ربح العيادة</p>
                <p className="mt-1 text-2xl font-extrabold text-teal-950 font-mono">
                  {netProfit.toLocaleString('ar-EG')} <span className="text-xs font-sans">ج.م</span>
                </p>
              </div>
            )}
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-5 shadow-xs">
              <p className="text-xs text-amber-800">فواتير بانتظار التحصيل</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-950">
                {unpaidCount} <span className="text-xs text-amber-800 font-normal">فاتورة</span>
              </p>
            </div>
          </section>
        )}

        {/* 1. Doctor Commissions Table (Visible to Owner, or personal to Doctor) */}
        {(isOwner || isDoctor) && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  {isDoctor && !isOwner ? 'كشف حساب أتعابي' : 'حسابات وتوزيع أتعاب ونسب الأطباء'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  حساب تلقائي لنسبة الطبيب مقابل نصيب العيادة المقتطع من كل كشف وجلسة.
                </p>
              </div>
              <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                نظام النسب المعتمد
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">اسم الطبيب</th>
                    <th className="p-3">التخصص</th>
                    <th className="p-3 text-center">عدد الكشوفات</th>
                    <th className="p-3">إجمالي الكشوفات</th>
                    <th className="p-3 text-center">النسبة</th>
                    <th className="p-3 text-teal-900 font-bold">مستحقات الطبيب</th>
                    {isOwner && <th className="p-3 text-slate-700">نصيب العيادة</th>}
                    {isOwner && <th className="p-3 text-center">توثيق الصرف</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorCommissions.map((doc) => (
                    <tr key={doc.doctor_id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-900">{doc.doctor_name}</td>
                      <td className="p-3 text-slate-500">{doc.specialty}</td>
                      <td className="p-3 text-center font-bold">{doc.total_visits}</td>
                      <td className="p-3 font-mono">{doc.gross_revenue} ج.م</td>
                      <td className="p-3 text-center font-bold text-teal-800">%{doc.commission_rate}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{doc.doctor_payout} ج.م</td>
                      {isOwner && <td className="p-3 font-mono text-slate-600">{doc.clinic_share} ج.م</td>}
                      {isOwner && (
                        <td className="p-3 text-center">
                          <DoctorPayoutButton
                            doctorId={doc.doctor_id}
                            doctorName={doc.doctor_name}
                            amount={doc.doctor_payout}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 2. Petty Expenses Section (Visible to Owner, Admin, and Receptionist) */}
        {!isDoctor && (
          <section className="space-y-4">
            <ExpenseForm />

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <h3 className="font-bold text-slate-900 text-sm">سجل آخر المصروفات النثرية</h3>
                <span className="text-xs text-slate-500">إجمالي: {totalExpenses} ج.م</span>
              </div>
              {expenses.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60">
                      <div>
                        <span className="font-semibold text-slate-800">{exp.description}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                          <span>{exp.category}</span>
                          <span>·</span>
                          <span>المستلم: {exp.recipient_name || 'غير محدد'}</span>
                          <span>·</span>
                          <span>الدفع: {exp.payment_method === 'cash' ? 'كاش من الدرج' : exp.payment_method}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-800 text-sm">
                        -{exp.amount} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-xs text-slate-500">لا توجد مصروفات مسجلة اليوم.</p>
              )}
            </div>
          </section>
        )}

        {/* 3. Invoices Section (Full list) */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 p-5 gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">سجل فواتير المرضى</h2>
              <p className="text-xs text-slate-500 mt-0.5">كافة فواتير الكشوفات والخدمات المصدرة بالعيادة</p>
            </div>
            {/* Filter Navigation */}
            <nav className="flex gap-1.5 text-xs">
              <Link
                href="/billing"
                className={`rounded-lg px-2.5 py-1 border font-medium ${
                  !status ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                الكل
              </Link>
              <Link
                href="/billing?status=issued"
                className={`rounded-lg px-2.5 py-1 border font-medium ${
                  status === 'issued' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                غير مسددة
              </Link>
              <Link
                href="/billing?status=paid"
                className={`rounded-lg px-2.5 py-1 border font-medium ${
                  status === 'paid' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                مسددة
              </Link>
            </nav>
          </div>

          {invoices.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              لا توجد فواتير مطابقة لهذا التصنيف.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/billing/${inv.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-teal-800"
                      >
                        {inv.invoice_number}
                      </Link>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                      <span>المريض: <strong className="text-slate-700">{inv.patient_name}</strong></span>
                      {inv.issued_at && (
                        <span>
                          {new Date(inv.issued_at).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-left" dir="ltr">
                      <span className="font-mono text-base font-bold text-slate-900 block">
                        {inv.total} ج.م
                      </span>
                      {inv.total !== inv.paid_total && (
                        <span className="text-xs text-rose-600 block">
                          متبقي: {Math.max(0, inv.total - inv.paid_total)} ج.م
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/billing/${inv.id}`}
                      className="secondary-button text-xs py-1.5 px-3"
                    >
                      عرض الإيصال ←
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    partially_paid: 'bg-amber-50 text-amber-900 border-amber-200',
    issued: 'bg-blue-50 text-blue-800 border-blue-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const labels: Record<string, string> = {
    paid: 'مسددة بالكامل',
    partially_paid: 'مسددة جزئياً',
    issued: 'بانتظار السداد',
    cancelled: 'ملغاة',
    draft: 'مسودة',
  };

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold border ${styles[status] ?? styles.issued}`}>
      {labels[status] ?? status}
    </span>
  );
}
