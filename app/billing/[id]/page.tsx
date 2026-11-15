import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getInvoice } from '@/lib/billing';
import { PaymentDialog } from './payment-dialog';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { clinic } = session;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const remaining = Math.max(0, invoice.total - invoice.paid_total);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Top actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Link href="/billing" className="text-sm text-teal-800 hover:underline">
            ← قائمة الفواتير
          </Link>
          <div className="flex items-center gap-2">
            {remaining > 0 && (
              <PaymentDialog invoiceId={invoice.id} remainingAmount={remaining} />
            )}
          </div>
        </div>

        {/* Printable Receipt Card */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="eyebrow text-teal-800">فاتورة علاجية رسمية</p>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {clinic?.name_ar || clinic?.name || 'العيادة الطبية'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">الرقم الضريبي الموحد للعيادة</p>
            </div>

            <div className="text-left" dir="ltr">
              <span className="font-mono text-lg font-bold text-slate-900 block">
                {invoice.invoice_number}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('ar-EG') : '—'}
              </span>
              <div className="mt-2 text-right">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </header>

          {/* Patient Details */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-wrap justify-between gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">اسم المريض</span>
              <strong className="text-slate-900 font-semibold">{invoice.patient_name}</strong>
            </div>
            {invoice.appointment_id && (
              <div>
                <span className="text-xs text-slate-500 block">مرتبط بالموعد</span>
                <Link href={`/clinical/${invoice.appointment_id}`} className="text-teal-800 text-xs hover:underline">
                  عرض تفاصيل الكشف الطبي
                </Link>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 font-semibold">الخدمة / البند</th>
                <th className="py-2.5 text-center font-semibold">الكمية</th>
                <th className="py-2.5 text-left font-semibold">سعر الوحدة</th>
                <th className="py-2.5 text-left font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.items ?? []).map((it) => (
                <tr key={it.id}>
                  <td className="py-3 font-medium text-slate-800">{it.description}</td>
                  <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                  <td className="py-3 text-left font-mono" dir="ltr">
                    {it.unit_price} ج.م
                  </td>
                  <td className="py-3 text-left font-mono font-bold" dir="ltr">
                    {it.line_total} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total & Balances */}
          <div className="border-t-2 border-slate-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono">{invoice.subtotal} ج.م</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>خصم خاص:</span>
                <span className="font-mono">- {invoice.discount_total} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-2">
              <span>الإجمالي الكلي:</span>
              <span className="font-mono text-lg text-teal-900">{invoice.total} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>المبلغ المسدد:</span>
              <span className="font-mono text-emerald-800 font-bold">{invoice.paid_total} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-dashed border-slate-200 pt-2">
              <span>المتبقي للتحصيل:</span>
              <span className={`font-mono text-base ${remaining > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                {remaining} ج.م
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-100 p-3 text-xs text-amber-900">
              <strong>ملاحظات:</strong> {invoice.notes}
            </div>
          )}

          <footer className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            شكراً لثقتكم بعيادتنا · تمنياتنا لكم بالشفاء العاجل
          </footer>
        </article>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    partially_paid: 'bg-amber-100 text-amber-900 border-amber-300',
    issued: 'bg-blue-100 text-blue-800 border-blue-300',
    cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
  };
  const labels: Record<string, string> = {
    paid: 'مسددة بالكامل ✓',
    partially_paid: 'مسددة جزئياً',
    issued: 'بانتظار السداد',
    cancelled: 'ملغاة',
    draft: 'مسودة',
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold border ${styles[status] ?? styles.issued}`}>
      {labels[status] ?? status}
    </span>
  );
}
