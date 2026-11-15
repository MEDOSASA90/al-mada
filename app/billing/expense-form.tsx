'use client';

import { useActionState } from 'react';
import { addExpenseAction, type BillingFormState } from './actions';

export function ExpenseForm() {
  const [state, formAction, isPending] = useActionState<BillingFormState, FormData>(
    addExpenseAction,
    { message: '', success: false }
  );

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
        <span>💸</span>
        <span>تسجيل مصروفات نثرية أو تشغيلية للعيادة</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="exp_category">
            بند الصرف:
          </label>
          <select id="exp_category" name="category" className="field w-full text-xs">
            <option value="supplies">شراء مستلزمات طبية</option>
            <option value="hospitality">بوفيه واستراحة واستضافة</option>
            <option value="utilities">كهرباء / إنترنت / مياه</option>
            <option value="maintenance">صيانة أجهزة وتكييف</option>
            <option value="salaries">أجور ومكافآت يومية</option>
            <option value="rent">إيجار ومصاريف مقر</option>
            <option value="other">مصروفات أخرى</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="exp_desc">
            بيان المصروف:
          </label>
          <input
            id="exp_desc"
            name="description"
            placeholder="مثال: شراء كحول وقطن، صيانة جهاز الضغط، شحن إنترنت…"
            className="field w-full text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="exp_amount">
            المبلغ (ج.م):
          </label>
          <input
            id="exp_amount"
            name="amount"
            type="number"
            step="0.5"
            min="1"
            placeholder="50"
            className="field w-full text-xs font-mono font-bold"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="exp_method">
            طريقة الدفع:
          </label>
          <select id="exp_method" name="payment_method" className="field w-full text-xs">
            <option value="cash">نقداً من عهدة الدرج (Cash)</option>
            <option value="vodafone_cash">محفظة إلكترونية (فودافون كاش)</option>
            <option value="instapay">تطبيق إنستاباي (InstaPay)</option>
            <option value="card">فيزا / بطاقة بنكية</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="exp_recipient">
            الجهة أو المستلم:
          </label>
          <input
            id="exp_recipient"
            name="recipient_name"
            placeholder="اسم الصيدلية، الفني، المورد…"
            className="field w-full text-xs"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="primary-button w-full text-xs py-2.5 font-bold"
          >
            {isPending ? 'جارٍ التسجيل…' : '+ إضافة المصروف'}
          </button>
        </div>
      </div>

      {state.message && (
        <p
          role="status"
          className={`text-xs p-3 rounded-xl border ${
            state.success ? 'bg-teal-50 text-teal-900 border-teal-200 font-semibold' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
