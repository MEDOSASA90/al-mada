'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DemoRoleSwitcher({ currentRole }: { currentRole: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchRole(role: string) {
    document.cookie = `almada_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const roles = [
    { id: 'clinic_owner', label: '👑 مالك العيادة / المدير', desc: 'صلاحيات كاملة + المالية والإدارة' },
    { id: 'receptionist', label: '📋 موظف الاستقبال (شامل)', desc: 'مواعيد + كاشير + مخزن بدون الكشف الطبي' },
    { id: 'doctor', label: '🩺 طبيب العيادة', desc: 'كشف وروشتة وحساباته الخاصة فقط' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-teal-200/60 mt-2">
      <span className="text-xs font-bold text-teal-900">
        تجربة الصلاحيات الحية (فصل الأقسام):
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {roles.map((r) => {
          const active = currentRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              disabled={isPending || active}
              onClick={() => switchRole(r.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                active
                  ? 'bg-teal-900 text-white cursor-default'
                  : 'bg-white text-slate-700 hover:bg-teal-100 hover:text-teal-950 border border-teal-200'
              }`}
              title={r.desc}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      {isPending && <span className="text-xs text-teal-700 animate-pulse">جارٍ التبديل…</span>}
    </div>
  );
}
