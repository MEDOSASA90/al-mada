import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewPasswordForm } from '@/app/forgot-password/reset-form';

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/forgot-password');
  return <main className="auth-shell" dir="rtl"><section className="auth-card">
    <p className="eyebrow">استعادة الحساب</p><h1 className="text-2xl font-bold">اختار كلمة مرور جديدة</h1>
    <p className="mb-6 mt-2 text-sm text-slate-600">استخدم كلمة مرور قوية لا تقل عن 10 أحرف.</p><NewPasswordForm />
  </section></main>;
}
