'use client';

import { useActionState, useState } from 'react';
import { createPackageAction, type PackageFormState } from './actions';

const initialState: PackageFormState = { message: '', success: false };

export function PackageCreateForm({
  patients,
}: {
  patients: Array<{ id: string; full_name: string; file_number: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPackageAction, initialState);

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">إصدار باقة جلسات جديدة</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            بيع باقة علاجية أو جلسات متابعة لمريض (علاج طبيعي، جلدية، جلسات أسنان…).
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="primary-button inline-flex items-center gap-1.5"
          type="button"
        >
          <span>+</span>
          <span>إصدار باقة</span>
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-900 text-lg">اشتراك جديد في باقة علاجية</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-700"
          type="button"
        >
          إلغاء ✕
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">المريض *</label>
            <select name="patient_id" required className="field mt-1">
              <option value="" disabled>اختر المريض…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.file_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">اسم الباقة *</label>
            <input
              name="name"
              required
              placeholder="مثال: باقة علاج طبيعي 10 جلسات"
              className="field mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">عدد الجلسات الإجمالي *</label>
            <input
              type="number"
              name="total_sessions"
              required
              min={1}
              defaultValue={5}
              className="field mt-1 text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">السعر الإجمالي للباقة (ج.م)</label>
            <input
              type="number"
              name="price"
              min={0}
              defaultValue={1000}
              className="field mt-1 text-left font-bold"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">تاريخ انتهاء الصلاحية</label>
            <input
              type="date"
              name="valid_until"
              className="field mt-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">ملاحظات وشروط الباقة</label>
          <input
            name="notes"
            placeholder="مثال: تشمل الجلسات الفحص الدوري وتكون أسبوعية…"
            className="field mt-1 text-sm"
          />
        </div>

        {state.message && (
          <div
            className={`rounded-xl p-3 text-sm ${
              state.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="secondary-button"
          >
            إلغاء
          </button>
          <button disabled={isPending} className="primary-button">
            {isPending ? 'جارٍ إصدار الباقة…' : 'حفظ واشتراك'}
          </button>
        </div>
      </form>
    </section>
  );
}
