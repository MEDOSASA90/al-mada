'use client';

import { useState } from 'react';
import { reviewPatientLink } from './actions';

type LinkRequest = { id: string; patient_name: string; file_number: string; requester_email: string; requested_at: string };

export function PatientLinkQueue({ requests }: { requests: LinkRequest[] }) {
  const [items, setItems] = useState(requests);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    setMessage('');
    const result = await reviewPatientLink(id, approve);
    setMessage(result.message);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== id));
    setBusyId('');
  }

  return <div className="space-y-4">
    {message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm">{message}</p>}
    {items.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">لا توجد طلبات ربط معلقة.</p> : items.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{item.patient_name} · ملف {item.file_number}</h2><p className="mt-1 text-sm text-slate-600">الحساب المطلوب ربطه: {item.requester_email}</p></div><time className="text-xs text-slate-500">{new Date(item.requested_at).toLocaleString('ar-EG')}</time></div>
      <p className="mt-3 text-sm text-amber-900">تحقق من هوية صاحب الحساب مع المريض أو ممثله قبل اعتماد الربط.</p>
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={Boolean(busyId)} onClick={() => decide(item.id, true)} className="primary-button">{busyId === item.id ? 'جارٍ الحفظ…' : 'اعتماد بعد التحقق'}</button><button disabled={Boolean(busyId)} onClick={() => decide(item.id, false)} className="secondary-button">رفض الطلب</button></div>
    </article>)}
  </div>;
}
