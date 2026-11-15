'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError('');
    const supabase = createClient();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: String(formData.get('full_name') ?? '').trim() },
          },
        });

    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      setError('تم إنشاء الحساب. راجع بريدك لتأكيده، ثم سجّل الدخول.');
      setMode('login');
      setBusy(false);
      return;
    }
    const nextPath = searchParams.get('next');
    router.replace(nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/');
    router.refresh();
  }

  return (
    <form action={configured ? submit : undefined} className="space-y-4">
      {mode === 'signup' && (
        <label className="block text-sm font-medium">الاسم الكامل
          <input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="field mt-1" disabled={!configured} />
        </label>
      )}
        <label className="block text-sm font-medium">البريد الإلكتروني
          <input name="email" required type="email" autoComplete="email" className="field mt-1" disabled={!configured} />
      </label>
      <label className="block text-sm font-medium">كلمة المرور
          <input name="password" required type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="field mt-1" disabled={!configured} />
      </label>
      {error && <p role="status" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button disabled={busy || !configured} className="primary-button w-full">{busy ? 'جارٍ المعالجة…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</button>
      {configured && mode === 'login' && <Link href="/forgot-password" className="block text-center text-sm text-teal-800">نسيت كلمة المرور؟</Link>}
      <button type="button" disabled={!configured} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="w-full py-2 text-sm text-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
        {mode === 'login' ? 'إنشاء حساب جديد' : 'لديك حساب؟ سجّل الدخول'}
      </button>
    </form>
  );
}
