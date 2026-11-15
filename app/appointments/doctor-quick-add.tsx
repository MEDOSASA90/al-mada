'use client';

import { useActionState, useState } from 'react';
import { createDoctorAction, type AppointmentFormState } from './actions';

const initialState: AppointmentFormState = { message: '', success: false };

export function DoctorQuickAdd() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createDoctorAction, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="secondary-button text-xs py-1.5 px-3"
        type="button"
      >
        + إضافة طبيب للعيادة
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-right">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-teal-950 text-sm">إضافة طبيب جديد</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-800"
          type="button"
        >
          إلغاء ✕
        </button>
      </div>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">اسم الطبيب الكامل *</label>
          <input
            name="full_name"
            required
            minLength={2}
            maxLength={160}
            className="field mt-1 text-sm"
            placeholder="د. مصطفى محمود"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">رقم الهاتف</label>
            <input
              name="phone"
              type="tel"
              className="field mt-1 text-sm text-left"
              dir="ltr"
              placeholder="+201012345678"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              className="field mt-1 text-sm text-left"
              dir="ltr"
              placeholder="doctor@example.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">رقم ترخيص مزاولة المهنة</label>
          <input
            name="license_number"
            className="field mt-1 text-sm"
            placeholder="12345/2026"
          />
        </div>
        {state.message && (
          <p className={`text-xs p-2 rounded-lg ${state.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {state.message}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="secondary-button text-xs py-1 px-3"
          >
            إغلاق
          </button>
          <button
            disabled={isPending}
            className="primary-button text-xs py-1 px-4"
          >
            {isPending ? 'جارٍ الحفظ…' : 'حفظ الطبيب'}
          </button>
        </div>
      </form>
    </div>
  );
}
