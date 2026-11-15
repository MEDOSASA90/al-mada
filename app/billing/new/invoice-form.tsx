'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createInvoiceAction, type BillingFormState } from '../actions';

const initialState: BillingFormState = { message: '', success: false };

type Props = {
  patients: Array<{ id: string; full_name: string; file_number: string }>;
  branches: Array<{ id: string; name: string; name_ar: string }>;
  defaultPatientId?: string;
  defaultAppointmentId?: string;
};

export function InvoiceCreateForm({
  patients,
  branches,
  defaultPatientId,
  defaultAppointmentId,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState([
    { id: 1, desc: 'كشف طبي بالعيادة', qty: 1, price: 300 },
  ]);
  const [discount, setDiscount] = useState(0);

  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), desc: '', qty: 1, price: 0 },
    ]);
  }

  function removeItem(id: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.qty) || 1) * (Number(it.price) || 0), 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <form action={formAction} className="space-y-6">
      {defaultAppointmentId && (
        <input type="hidden" name="appointment_id" value={defaultAppointmentId} />
      )}

      {/* Basic details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-base">بيانات الفاتورة الأساسية</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">المريض *</label>
            <select
              name="patient_id"
              required
              defaultValue={defaultPatientId || ''}
              className="field mt-1"
            >
              <option value="" disabled>اختر المريض…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.file_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">الفرع</label>
            <select name="branch_id" defaultValue={branches[0]?.id || ''} className="field mt-1">
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_ar || b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Line Items */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base">بنود الفاتورة والخدمات</h2>
          <button
            type="button"
            onClick={addItem}
            className="secondary-button text-xs py-1 px-3"
          >
            + إضافة بند
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6 sm:col-span-6">
                <input
                  name="item_description"
                  required
                  defaultValue={it.desc}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, desc: val } : x)));
                  }}
                  placeholder="وصف الخدمة (كشف، غيار، استشارة…)"
                  className="field text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  type="number"
                  name="item_quantity"
                  required
                  min={1}
                  defaultValue={it.qty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, qty: val } : x)));
                  }}
                  className="field text-sm text-center"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="number"
                  name="item_price"
                  required
                  min={0}
                  defaultValue={it.price}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, price: val } : x)));
                  }}
                  className="field text-sm text-left"
                  dir="ltr"
                  placeholder="السعر ج.م"
                />
              </div>
              <div className="col-span-1 text-center">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="text-slate-400 hover:text-rose-600 text-lg"
                    title="حذف البند"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Calculation summary */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>المجموع الفرعي:</span>
            <span className="font-bold">{subtotal} ج.م</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>الخصم:</span>
            <div className="flex items-center gap-1 w-28">
              <input
                type="number"
                name="discount_total"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="field text-sm py-1 text-left"
                dir="ltr"
              />
              <span className="text-xs">ج.م</span>
            </div>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-2">
            <span>الإجمالي المستحق:</span>
            <span className="text-teal-800 text-lg">{total} ج.م</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">ملاحظات الفاتورة</label>
          <input
            name="notes"
            placeholder="ملاحظات اختيارية تظهر في الإيصال…"
            className="field mt-1 text-sm"
          />
        </div>
      </section>

      {state.message && (
        <div
          role="alert"
          className={`rounded-xl p-4 text-sm ${
            state.success
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {state.message}
          {state.success && state.invoiceId && (
            <div className="mt-2">
              <Link
                href={`/billing/${state.invoiceId}`}
                className="font-bold underline text-emerald-950"
              >
                عرض الفاتورة وتسجيل الدفعة ←
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/billing" className="secondary-button text-sm">
          إلغاء
        </Link>
        <button disabled={isPending} className="primary-button">
          {isPending ? 'جارٍ إصدار الفاتورة…' : 'إصدار الفاتورة'}
        </button>
      </div>
    </form>
  );
}
