'use client';

import { useState } from 'react';
import { recordPaymentAction } from '../actions';

export function PaymentDialog({
  invoiceId,
  remainingAmount,
}: {
  invoiceId: string;
  remainingAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remainingAmount);
  const [method, setMethod] = useState('cash');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = await recordPaymentAction(invoiceId, Number(amount), method, ref);
    setMsg(res.message);
    setBusy(false);
    if (res.ok) {
      setTimeout(() => setOpen(false), 1200);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setAmount(remainingAmount);
          setOpen(true);
        }}
        className="primary-button text-sm py-2 px-4 shadow-sm"
        type="button"
      >
        💰 تحصيل دفعة / كاشير
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-right space-y-3">
      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
        <h3 className="font-bold text-sm text-teal-950">تسجيل دفعة نقدية / إلكترونية</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-700"
          type="button"
        >
          إلغاء ✕
        </button>
      </div>

      <form onSubmit={handlePay} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">المبلغ المدفوع (ج.م) *</label>
            <input
              type="number"
              required
              min={1}
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="field mt-1 text-sm font-bold text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">طريقة الدفع</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="field mt-1 text-sm"
            >
              <option value="cash">نقداً (كاش)</option>
              <option value="card">بطاقة بنكية (فيزا / ماستركارد)</option>
              <option value="wallet">محفظة إلكترونية (فودافون كاش / إنستاباي)</option>
              <option value="insurance">تأمين طبي</option>
              <option value="transfer">تحويل بنكي</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">رقم المرجع / إيصال الدفع (اختياري)</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="رقم معاملة الـ POS أو رقم المحفظة…"
            className="field mt-1 text-sm"
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
            className="secondary-button text-xs py-1.5 px-3"
          >
            إغلاق
          </button>
          <button
            disabled={busy || amount <= 0}
            className="primary-button text-xs py-1.5 px-4"
          >
            {busy ? 'جارٍ التسجيل…' : 'تأكيد التحصيل'}
          </button>
        </div>
      </form>
    </div>
  );
}
