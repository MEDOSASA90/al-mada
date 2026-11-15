'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export function ResetRequestForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true);
    const email = String(formData.get('email') ?? '').trim();
    const redirectTo = `${window.location.origin}/auth/callback?next=%2Freset-password`;
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setMessage(error ? 'تعذّر إرسال رسالة الاستعادة. راجع البريد وحاول مرة أخرى.' : 'لو البريد مسجل، ستصلك رسالة لاستعادة كلمة المرور.');
    setBusy(false);
  }
  return <form action={submit} className="space-y-4">
    <label className="block text-sm font-medium">البريد الإلكتروني<input name="email" required type="email" autoComplete="email" className="field mt-1" dir="ltr" /></label>
    {message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    <button disabled={busy} className="primary-button w-full">{busy ? 'جارٍ الإرسال…' : 'إرسال رابط الاستعادة'}</button>
  </form>;
}

export function NewPasswordForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true);
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('confirmation') ?? '');
    if (password.length < 10 || password !== confirmation) {
      setMessage(password !== confirmation ? 'كلمتا المرور غير متطابقتين.' : 'كلمة المرور يجب أن تتكون من 10 أحرف على الأقل.');
      setBusy(false);
      return;
    }
    const { error } = await createClient().auth.updateUser({ password });
    setMessage(error ? 'تعذّر تحديث كلمة المرور. افتح رابط استعادة جديدًا وحاول مرة أخرى.' : 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.');
    setBusy(false);
  }
  return <form action={submit} className="space-y-4">
    <label className="block text-sm font-medium">كلمة المرور الجديدة<input name="password" required minLength={10} type="password" autoComplete="new-password" className="field mt-1" dir="ltr" /></label>
    <label className="block text-sm font-medium">تأكيد كلمة المرور<input name="confirmation" required minLength={10} type="password" autoComplete="new-password" className="field mt-1" dir="ltr" /></label>
    {message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    <button disabled={busy} className="primary-button w-full">{busy ? 'جارٍ التحديث…' : 'حفظ كلمة المرور'}</button>
  </form>;
}
