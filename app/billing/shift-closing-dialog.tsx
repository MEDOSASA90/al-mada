'use client';

import { useState } from 'react';
import { closeShiftAction } from './actions';
import type { CashierShift } from '@/lib/billing';

export function ShiftClosingDialog({ shift }: { shift: CashierShift | null }) {
  const [open, setOpen] = useState(false);
  const [actualCash, setActualCash] = useState<number>(shift?.expected_cash ?? 0);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const expected = shift?.expected_cash ?? 0;
  const diff = actualCash - expected;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = await closeShiftAction(actualCash, notes);
    setBusy(false);
    setMsg(res.message);
    if (res.ok) {
      setTimeout(() => setOpen(false), 1500);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="secondary-button inline-flex items-center gap-1.5 text-xs py-2 px-3 font-bold text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100"
      >
        <span>🔒</span>
        <span>تقفيل الوردية والخزينة اليومية</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">تقفيل الخزينة والوردية (الكاشير)</h3>
                <p className="text-xs text-slate-500 mt-0.5">مطابقة النقدية الفعلية في الدرج مع الإيصالات والمصروفات المسجلة.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">المقبوضات نقدًا (الكاش المستلم):</span>
                <strong className="text-emerald-800 font-mono text-sm">{shift?.cash_collected ?? 0} ج.م</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">المصروفات النثرية المنصرفة من الدرج:</span>
                <strong className="text-rose-800 font-mono text-sm">-{shift?.expenses_paid ?? 0} ج.م</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-800">النقدية المفترضة بالدرج (Expected Cash):</span>
                <strong className="text-slate-900 font-mono text-base font-black">{expected} ج.م</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1" htmlFor="actual_cash">
                  النقدية الفعلية بعد الجرد اليدوي (Actual Cash):
                </label>
                <input
                  id="actual_cash"
                  type="number"
                  step="0.5"
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="field w-full text-base font-mono font-bold"
                  required
                />
              </div>

              {/* Discrepancy indicator */}
              <div
                className={`p-3 rounded-xl text-xs font-bold flex justify-between items-center ${
                  diff === 0
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : diff < 0
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}
              >
                <span>حالة الجرد والتطابق:</span>
                <span>
                  {diff === 0
                    ? '✓ الخزينة مطابقة تماماً (بدون عجز أو زيادة)'
                    : diff < 0
                    ? `⚠️ يوجد عجز في الدرج بمقدار (${Math.abs(diff)} ج.م)`
                    : `ℹ️ توجد زيادة في الدرج بمقدار (${diff} ج.م)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="shift_notes">
                  ملاحظات الاستلام والتسليم:
                </label>
                <textarea
                  id="shift_notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات العجز/الزيادة، اسم الشخص المستلم للخزينة…"
                  className="field w-full text-xs"
                />
              </div>

              {msg && <p className="text-xs text-teal-800 font-bold">{msg}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="secondary-button text-xs py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="primary-button text-xs py-2 px-5 font-bold"
                >
                  {busy ? 'جارٍ الاعتماد…' : 'اعتماد وإغلاق الخزينة اليومية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
