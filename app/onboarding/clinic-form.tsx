'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export function ClinicForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError('');
    const { error: rpcError } = await createClient().rpc('create_clinic_for_current_user', {
      p_name: String(formData.get('name') ?? '').trim(),
      p_slug: String(formData.get('slug') ?? '').trim().toLowerCase(),
    });
    if (rpcError) {
      setError(rpcError.message);
      setBusy(false);
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block text-sm font-medium">اسم العيادة
        <input name="name" required minLength={2} maxLength={120} className="field mt-1" placeholder="عيادة د. أحمد" />
      </label>
      <label className="block text-sm font-medium">رابط العيادة
        <input name="slug" required minLength={3} maxLength={50} pattern="[a-zA-Z0-9-]+" className="field mt-1 text-left" dir="ltr" placeholder="ahmed-clinic" />
        <span className="mt-1 block text-xs font-normal text-slate-500">أحرف إنجليزية صغيرة وأرقام وشرطة فقط.</span>
      </label>
      {error && <p role="status" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button disabled={busy} className="primary-button w-full">{busy ? 'جارٍ إنشاء مساحة العيادة…' : 'إنشاء العيادة'}</button>
    </form>
  );
}
