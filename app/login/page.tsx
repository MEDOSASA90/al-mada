import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { DemoQuickLogin } from './demo-quick-login';

export default function LoginPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <main className="auth-shell" dir="rtl">
      <section className="auth-card max-w-lg w-full">
        <p className="eyebrow">المدى · منصة إدارة العيادات الذكية</p>
        <h1 className="text-2xl font-bold text-slate-900">مرحبًا بك في المنصة</h1>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          استكشف النظام بكامل ميزاته فورياً كمالك للعيادة أو كطبيب أو كموظف استقبال:
        </p>

        <div className="mb-6">
          <DemoQuickLogin />
        </div>

        {configured ? (
          <>
            <div className="relative my-5 text-center text-xs text-slate-400">
              <span className="bg-white px-2 relative z-10">أو سجّل الدخول بحسابك السحابي</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            </div>
            <Suspense fallback={<p className="text-sm text-slate-500">جارٍ تحميل النموذج…</p>}>
              <LoginForm configured={configured} />
            </Suspense>
          </>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
            ℹ️ عند ربط قاعدة بيانات Supabase الحية، سيظهر نموذج تسجيل الدخول بالبريد وكلمة المرور تلقائياً.
          </div>
        )}
      </section>
    </main>
  );
}
