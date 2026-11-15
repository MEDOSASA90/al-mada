import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClinicForm } from './clinic-form';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('user_clinic_memberships').select('id').limit(1).maybeSingle();
  if (membership) redirect('/');

  return (
    <main className="auth-shell" dir="rtl">
      <section className="auth-card">
        <p className="eyebrow">إعداد مساحة العمل</p>
        <h1 className="text-2xl font-bold">ابدأ بإنشاء عيادتك</h1>
        <p className="mt-2 mb-6 text-sm text-slate-600">سيتم إنشاء العيادة والفرع الرئيسي وربط حسابك كمالك في خطوة واحدة.</p>
        <ClinicForm />
      </section>
    </main>
  );
}
