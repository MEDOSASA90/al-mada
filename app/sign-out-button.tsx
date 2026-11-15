'use client';

import { createClient } from '@/lib/supabase/browser';

export function SignOutButton() {
  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // ignore
    }
    document.cookie = 'almada_demo_role=; path=/; max-age=0; SameSite=Lax';
    window.location.href = '/login';
  }
  return <button onClick={signOut} className="secondary-button">تسجيل الخروج</button>;
}
