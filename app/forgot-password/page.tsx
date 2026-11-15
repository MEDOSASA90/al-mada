import Link from 'next/link';
import { ResetRequestForm } from './reset-form';

export default function ForgotPasswordPage() {
  return <main className="auth-shell" dir="rtl"><section className="auth-card">
    <p className="eyebrow">استعادة الحساب</p><h1 className="text-2xl font-bold">نسيت كلمة المرور؟</h1>
    <p className="mb-6 mt-2 text-sm text-slate-600">أدخل بريدك المسجل لإرسال رابط آمن لتعيين كلمة مرور جديدة.</p>
    <ResetRequestForm /><Link href="/login" className="mt-4 block text-center text-sm text-teal-800">العودة لتسجيل الدخول</Link>
  </section></main>;
}
