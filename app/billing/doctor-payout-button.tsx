'use client';

import { useState } from 'react';
import { addExpenseAction } from './actions';

type Props = {
  doctorId: string;
  doctorName: string;
  amount: number;
};

export function DoctorPayoutButton({ doctorId, doctorName, amount }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [method, setMethod] = useState('cash');

  async function handlePayout() {
    setBusy(true);
    setMsg('');
    const fd = new FormData();
    fd.set('category', 'doctor_payout');
    fd.set('description', `صرف أتعاب ونسبة كشوفات ${doctorName}`);
    fd.set('amount', String(amount));
    fd.set('payment_method', method);
    fd.set('recipient_name', doctorName);

    const res = await addExpenseAction({ message: '', success: false }, fd);
    setMsg(res.message);
    setBusy(false);
    if (res.success) {
      setTimeout(() => setOpen(false), 1500);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs px-2.5 py-1 font-semibold transition"
      >
        💵 صرف الأتعاب
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4" dir="rtl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-base">سند صرف مستحقات الطبيب</h3>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600">
          توثيق تسليم أتعاب الكشوفات للطبيب وإثبات خروج المبلغ من خزينة العيادة.
        </p>

        <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">الطبيب المستلم:</span>
            <strong className="text-slate-900">{doctorName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">المبلغ المستحق:</span>
            <strong className="text-emerald-800 text-sm font-mono">{amount.toLocaleString('ar-EG')} ج.م</strong>
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-700">
          طريقة الصرف
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="field mt-1 text-xs"
          >
            <option value="cash">نقداً من درج الخزينة (Cash)</option>
            <option value="instapay">تحويل إنستاباي (InstaPay)</option>
            <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
            <option value="bank_transfer">تحويل بنكي</option>
          </select>
        </label>

        {msg && (
          <p className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 text-xs font-semibold">
            {msg}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="secondary-button text-xs py-2 px-3"
          >
            إلغاء
          </button>
          <button
            onClick={handlePayout}
            disabled={busy}
            type="button"
            className="primary-button text-xs py-2 px-4 font-bold"
          >
            {busy ? 'جارٍ تسجيل السند…' : 'تأكيد الصرف وتوثيق السند'}
          </button>
        </div>
      </div>
    </div>
  );
}
