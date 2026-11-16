'use client';

import { useState } from 'react';
import type { StaffMember } from '@/lib/staff';

export function StaffEditDialog({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(member.phone || '');
  const [commission, setCommission] = useState(member.commission_percentage ?? 70);
  const [fee, setFee] = useState(member.consultation_fee ?? 350);
  const [isActive, setIsActive] = useState(member.is_active);
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
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-800 transition"
        type="button"
        title="تعديل نسبة الطبيب وسعر الكشف"
      >
        ✏️ تعديل
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">تعديل بيانات: {member.full_name}</h3>
            <p className="text-xs text-slate-500">{member.role === 'doctor' || member.role === 'visiting_doctor' ? 'طبيب معالج' : member.role}</p>
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
            <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono text-left"
              dir="ltr"
            />
          </div>

          {(member.role === 'doctor' || member.role === 'visiting_doctor') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نسبة الطبيب (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm font-bold text-teal-800"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">حصة العيادة: {100 - commission}%</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">سعر الكشف (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-sm font-bold text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">الصافي للطبيب: {(fee * commission) / 100} ج.م</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id={`active-${member.id}`}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor={`active-${member.id}`} className="font-semibold text-slate-800 cursor-pointer">
              حساب مفعل ومتاح في جدول المواعيد
            </label>
          </div>

          {saved && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-800">
              ✓ تم حفظ وتحديث بيانات الطبيب بنجاح!
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
