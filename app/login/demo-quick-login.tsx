'use client';

import { useState } from 'react';

export function DemoQuickLogin() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  function selectRoleAndEnter(role: string) {
    setSelectedRole(role);
    document.cookie = `almada_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    // Hard redirect to ensure edge middleware receives cookie directly
    window.location.href = '/';
  }

  const demoAccounts = [
    {
      role: 'clinic_owner',
      title: '👑 مالك العيادة / المدير العام',
      subtitle: 'صلاحيات كاملة · أرباح العيادة P&L · تقفيل الخزينة · نسب الأطباء',
      badge: 'إدارة كاملة',
      color: 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950',
    },
    {
      role: 'doctor',
      title: '🩺 الطبيب المعالج (د. سارة عثمان)',
      subtitle: 'كشف وسجلات طبية · روشتة إلكترونية وPDF · أتعابه وحصته فقط دون باقي الأطباء',
      badge: 'طبي واقتصادي خاص',
      color: 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950',
    },
    {
      role: 'receptionist',
      title: '📋 موظف الاستقبال الشامل (عيادة خاصة)',
      subtitle: 'حجز ومواعيد · طابور كشف · كاشير وفواتير · متابعة رصيد المستهلكات (محجوب عنه التشخيص)',
      badge: 'تشغيل واستقبال',
      color: 'border-sky-300 bg-sky-50/70 hover:bg-sky-100/80 text-sky-950',
    },
  ];

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">
          🚀 الدخول الفوري بحسابات تجريبية (بدون كلمة مرور):
        </p>
        {selectedRole && <span className="text-xs text-teal-700 animate-pulse font-medium">جارٍ فتح العيادة…</span>}
      </div>
      <div className="grid gap-2">
        {demoAccounts.map((acc) => (
          <button
            key={acc.role}
            type="button"
            disabled={Boolean(selectedRole)}
            onClick={() => selectRoleAndEnter(acc.role)}
            className={`w-full text-right p-3 rounded-xl border text-xs transition flex items-center justify-between gap-3 shadow-2xs ${acc.color} ${
              selectedRole === acc.role ? 'ring-2 ring-teal-600' : ''
            }`}
          >
            <div>
              <div className="font-bold text-sm text-slate-900">{acc.title}</div>
              <div className="text-slate-600 text-xs mt-0.5 leading-relaxed">{acc.subtitle}</div>
            </div>
            <span className="shrink-0 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold shadow-2xs">
              {selectedRole === acc.role ? 'جارٍ الفتح…' : `${acc.badge} ➔`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
