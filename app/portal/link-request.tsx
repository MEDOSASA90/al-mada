'use client';

import { useActionState } from 'react';
import { requestPortalLink, type PortalLinkRequestState } from './link-actions';

const initialState: PortalLinkRequestState = { message: '', submitted: false };

export function PortalLinkRequest() {
  const [state, action, pending] = useActionState(requestPortalLink, initialState);
  return <details className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
    <summary className="cursor-pointer font-semibold text-amber-950">طلب ربط ملفي من عيادتي</summary>
    <p className="my-3 text-sm text-slate-600">استخدم البيانات المسجلة لدى العيادة. سيصل الطلب لمراجعة موظف العيادة، ولن تظهر أي معلومات قبل اعتماده.</p>
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm">رمز العيادة<input name="clinic_slug" required minLength={3} maxLength={50} pattern="[a-zA-Z0-9-]+" className="field mt-1" dir="ltr" /></label>
      <label className="text-sm">رقم الملف<input name="file_number" required maxLength={50} className="field mt-1" dir="ltr" /></label>
      <label className="text-sm">تاريخ الميلاد<input name="birth_date" required type="date" className="field mt-1" /></label>
      {state.message && <p role="status" className="sm:col-span-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{state.message}</p>}
      <button disabled={pending} className="primary-button sm:col-span-3">{pending ? 'جارٍ إرسال الطلب…' : 'إرسال طلب الربط'}</button>
    </form>
  </details>;
}
