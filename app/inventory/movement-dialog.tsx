'use client';

import { useState } from 'react';
import { recordMovementAction } from './actions';

export function MovementDialog({
  itemId,
  itemName,
  currentQty,
  unit,
}: {
  itemId: string;
  itemName: string;
  currentQty: number;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('in_purchase');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = await recordMovementAction(itemId, type, qty, cost, notes);
    setMsg(res.message);
    setBusy(false);
    if (res.ok) {
      setTimeout(() => setOpen(false), 1200);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="secondary-button text-xs py-1.5 px-3"
        type="button"
      >
        حركة مخزون ⇄
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-right space-y-3">
      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
        <h4 className="font-bold text-xs text-teal-950">
          تسجيل حركة: {itemName} (الرصيد: {currentQty} {unit})
        </h4>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-700"
          type="button"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">نوع الحركة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="field mt-1 text-xs"
            >
              <option value="in_purchase">+ توريد / شراء جديد</option>
              <option value="out_clinical">- صرف لغرفة الكشف</option>
              <option value="out_expired">- إهلاك / منتهي الصلاحية</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">الكمية *</label>
            <input
              type="number"
              required
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="field mt-1 text-xs text-center font-bold"
            />
          </div>

          {type === 'in_purchase' && (
            <div>
              <label className="block text-xs font-medium text-slate-700">سعر الوحدة (ج.م)</label>
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="field mt-1 text-xs text-left"
                dir="ltr"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">ملاحظات الحركة</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: فاتورة توريد رقم 102، أو كشف د. أحمد…"
            className="field mt-1 text-xs"
          />
        </div>

        {msg && (
          <p className="text-xs p-2 rounded-lg bg-emerald-100 text-emerald-800 font-medium">
            {msg}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="secondary-button text-xs py-1 px-3"
          >
            إلغاء
          </button>
          <button
            disabled={busy || qty <= 0}
            className="primary-button text-xs py-1 px-4"
          >
            {busy ? 'جارٍ الحفظ…' : 'تأكيد الحركة'}
          </button>
        </div>
      </form>
    </div>
  );
}
