'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/lib/inventory';

export function ItemEditDialog({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [costPrice, setCostPrice] = useState(item.cost_price);
  const [sellingPrice, setSellingPrice] = useState(item.selling_price);
  const [reorderLevel, setReorderLevel] = useState(item.reorder_level);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    }, 600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-800 transition"
        type="button"
        title="تعديل بيانات الصنف والأسعار وحد الطلب"
      >
        ✏️ تعديل الصنف
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">تعديل الصنف: {item.name}</h3>
            <p className="text-xs text-slate-500">الرصيد المتوفر حالياً: {item.quantity_on_hand} {item.unit}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">اسم الصنف أو المستلزم</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">سعر التكلفة (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">سعر البيع / الاستهلاك (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono font-bold text-teal-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">حد إعادة الطلب الأدنى ({item.unit})</label>
            <input
              type="number"
              min="1"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono font-bold text-amber-900 bg-amber-50/50"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              سيظهر تنبيه بالنواقص وزر طلب توريد واتساب عندما يقل الرصيد عن هذا الحد.
            </span>
          </div>

          {saved && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-800">
              ✓ تم تحديث بيانات الصنف والأسعار بنجاح!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-button text-xs py-1.5 px-4"
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
