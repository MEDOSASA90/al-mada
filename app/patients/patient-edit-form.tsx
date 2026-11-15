'use client';

import { useActionState } from 'react';
import { archivePatientAction, updatePatientAction, type PatientFormState } from './actions';
import type { Patient } from '@/lib/supabase/types';

const initial: PatientFormState = { message: '', success: false };

export function PatientEditForm({ patient }: { patient: Patient }) {
  const [state, action, pending] = useActionState(updatePatientAction, initial);
  const [archiveState, archiveAction, archiving] = useActionState(archivePatientAction, initial);
  return <>
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <input type="hidden" name="id" value={patient.id}/>
      <label className="text-sm font-medium">الاسم الكامل<input name="full_name" required minLength={2} maxLength={160} defaultValue={patient.full_name} className="field mt-1"/></label>
      <label className="text-sm font-medium">رقم الهاتف<input name="phone" required type="tel" defaultValue={patient.phone} className="field mt-1" dir="ltr"/></label>
      <label className="text-sm font-medium">البريد الإلكتروني<input name="email" type="email" defaultValue={patient.email ?? ''} className="field mt-1" dir="ltr"/></label>
      <label className="text-sm font-medium">النوع<select name="gender" defaultValue={patient.gender ?? ''} className="field mt-1"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="other">آخر</option></select></label>
      <label className="text-sm font-medium">تاريخ الميلاد<input name="birth_date" type="date" defaultValue={patient.birth_date ?? ''} className="field mt-1"/></label>
      <div className="flex items-end"><button disabled={pending} className="primary-button w-full">{pending ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</button></div>
      {state.message && <p role="status" className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{state.message}</p>}
    </form>
    <section className="rounded-2xl border border-rose-200 bg-white p-5"><h2 className="font-semibold text-rose-900">أرشفة الملف</h2><p className="my-2 text-sm text-slate-600">تخفي الأرشفة السجل من قائمة المرضى النشطين. تبقى بياناته الطبية محفوظة وفق سياسة الاحتفاظ وسجل التدقيق.</p><form action={archiveAction} onSubmit={(event) => { if (!window.confirm('تأكيد أرشفة ملف هذا المريض؟')) event.preventDefault(); }}><input type="hidden" name="id" value={patient.id}/><button disabled={archiving} className="secondary-button border-rose-300 text-rose-800">{archiving ? 'جارٍ التنفيذ…' : 'أرشفة ملف المريض'}</button></form>{archiveState.message && <p role="status" className="mt-3 text-sm text-rose-800">{archiveState.message}</p>}</section>
  </>;
}
