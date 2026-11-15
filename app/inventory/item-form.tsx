'use client';

import { useActionState, useState } from 'react';
import { createInventoryItemAction, type InventoryFormState } from './actions';

const initialState: InventoryFormState = { message: '', success: false };

export function InventoryItemForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createInventoryItemAction, initialState);

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">إضافة صنف أو مستلزم جديد</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل مستلزمات طبية، شاش، سرنجات، مطهرات، أو أدوية بمخزن العيادة.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="primary-button inline-flex items-center gap-1.5"
          type="button"
        >
          <span>+</span>
          <span>إضافة صنف</span>
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-900 text-lg">تعريف صنف جديد بالمخزون</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-700"
          type="button"
        >
          إلغاء ✕
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">اسم الصنف / الدواء *</label>
            <input
              name="name"
              required
              placeholder="مثال: سرنجات 5 سم معقمة (علبة 100)"
              className="field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">التصنيف</label>
            <select name="category" className="field mt-1">
              <option value="supplies">مستلزمات طبية</option>
              <option value="medication">أدوية وحقن</option>
              <option value="consumables">مستهلكات عيادة</option>
              <option value="equipment">أجهزة وأدوات</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">الوحدة</label>
            <input
              name="unit"
              defaultValue="قطعة"
              placeholder="قطعة / علبة / أمبول…"
              className="field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">الرصيد الافتتاحي</label>
            <input
              type="number"
              name="quantity_on_hand"
              min={0}
              defaultValue={10}
              className="field mt-1 text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">حد إعادة الطلب</label>
            <input
              type="number"
              name="reorder_level"
              min={0}
              defaultValue={5}
              className="field mt-1 text-center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">سعر التكلفة (ج.م)</label>
            <input
              type="number"
              name="cost_price"
              min={0}
              defaultValue={0}
              className="field mt-1 text-left"
              dir="ltr"
            />
          </div>
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
            {isPending ? 'جارٍ الحفظ…' : 'حفظ الصنف'}
          </button>
        </div>
      </form>
    </section>
  );
}
