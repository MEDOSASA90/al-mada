'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }
  return <button onClick={signOut} className="secondary-button">تسجيل الخروج</button>;
}
