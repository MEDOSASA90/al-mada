'use client';

import { useState } from 'react';

export function DemoRoleSwitcher({ currentRole }: { currentRole: string }) {
  const [switching, setSwitching] = useState(false);

  function switchRole(role: string) {
    setSwitching(true);
    document.cookie = `almada_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    window.location.reload();
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
              disabled={switching || active}
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
      {switching && <span className="text-xs text-teal-700 animate-pulse font-medium">جارٍ التبديل…</span>}
    </div>
  );
}
