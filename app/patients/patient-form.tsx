'use client';

import { useActionState } from 'react';
import { addPatient, type PatientFormState } from './actions';

const initialState: PatientFormState = { message: '', success: false };

export function PatientForm() {
  const [state, action, pending] = useActionState(addPatient, initialState);
  return (
    <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none p-5 font-semibold text-teal-900">+ تسجيل مريض جديد</summary>
      <form action={action} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
        <label className="text-sm font-medium">الاسم الكامل<input name="full_name" required minLength={2} maxLength={160} autoComplete="name" className="field mt-1" /></label>
        <label className="text-sm font-medium">رقم الهاتف<input name="phone" required type="tel" autoComplete="tel" className="field mt-1" placeholder="+20 10 0000 0000" dir="ltr" /></label>
        <label className="text-sm font-medium">البريد الإلكتروني (اختياري)<input name="email" type="email" autoComplete="email" className="field mt-1" dir="ltr" /></label>
        <label className="text-sm font-medium">النوع<select name="gender" defaultValue="" className="field mt-1"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="other">آخر</option></select></label>
        <label className="text-sm font-medium">تاريخ الميلاد<input name="birth_date" type="date" className="field mt-1" /></label>
        <div className="flex items-end"><button disabled={pending} className="primary-button w-full">{pending ? 'جارٍ الحفظ…' : 'حفظ بيانات المريض'}</button></div>
        {state.message && <p role="status" className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{state.message}</p>}
      </form>
    </details>
  );
}
