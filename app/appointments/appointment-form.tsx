'use client';

import { useActionState, useState } from 'react';
import { createAppointmentAction, type AppointmentFormState } from './actions';
import { DoctorQuickAdd } from './doctor-quick-add';

const initialState: AppointmentFormState = { message: '', success: false };

type Props = {
  patients: Array<{ id: string; full_name: string; file_number: string }>;
  doctors: Array<{ id: string; full_name: string }>;
  branches: Array<{ id: string; name: string; name_ar: string }>;
  defaultDate?: string;
};

export function AppointmentForm({ patients, doctors, branches, defaultDate }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createAppointmentAction, initialState);
  const today = defaultDate || new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">حجز موعد جديد</h2>
          <p className="text-xs text-slate-500 mt-0.5">تسجيل موعد مسبق للمريض مع التحقق من عدم تداخل أوقات الطبيب.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="primary-button inline-flex items-center gap-1.5"
          type="button"
        >
          <span>+</span>
          <span>حجز موعد</span>
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">حجز موعد جديد</h2>
          <p className="text-xs text-slate-500">اختر المريض والطبيب والوقت لحجز كشف جديد.</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
          type="button"
        >
          إغلاق ✕
        </button>
      </div>

      {doctors.length === 0 && (
        <div className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 font-medium">
            تنبيه: لا يوجد أطباء مسجلون في هذه العيادة حتى الآن لحجز مواعيد لهم.
          </p>
          <DoctorQuickAdd />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">المريض *</label>
            <select
              name="patient_id"
              required
              className="field mt-1"
              defaultValue=""
            >
              <option value="" disabled>اختر المريض من السجل…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.file_number})
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-xs text-amber-700 mt-1">لا يوجد مرضى مسجلون، سجل مريضاً أولاً.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">الطبيب المعالج *</label>
              {doctors.length > 0 && <DoctorQuickAdd />}
            </div>
            <select
              name="doctor_id"
              required
              className="field mt-1"
              defaultValue=""
            >
              <option value="" disabled>اختر الطبيب…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">الفرع</label>
            <select name="branch_id" className="field mt-1" defaultValue={branches[0]?.id || ''}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_ar || b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">تاريخ الموعد *</label>
            <input
              type="date"
              name="appointment_date"
              required
              defaultValue={today}
              className="field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">وقت الموعد *</label>
            <input
              type="time"
              name="appointment_time"
              required
              defaultValue="10:00"
              className="field mt-1 text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">المدة المتوقعة</label>
            <select name="duration_minutes" className="field mt-1" defaultValue="30">
              <option value="15">15 دقيقة</option>
              <option value="20">20 دقيقة</option>
              <option value="30">30 دقيقة (عادي)</option>
              <option value="45">45 دقيقة</option>
              <option value="60">60 دقيقة (استشارة مطولة)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">نوع الزيارة</label>
            <select name="visit_type" className="field mt-1" defaultValue="clinic">
              <option value="clinic">كشف في العيادة</option>
              <option value="telemedicine">استشارة عن بُعد</option>
              <option value="home">زيارة منزلية</option>
              <option value="emergency">طوارئ</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">سبب الزيارة / شكوى المريض</label>
            <input
              name="reason"
              maxLength={500}
              placeholder="مثال: فحص دوري، كشف باطنة، متابعة تحاليل…"
              className="field mt-1"
            />
          </div>
        </div>

        {state.message && (
          <div
            role="alert"
            className={`rounded-xl p-4 text-sm ${
              state.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="secondary-button"
          >
            إلغاء
          </button>
          <button
            disabled={isPending || doctors.length === 0 || patients.length === 0}
            className="primary-button"
          >
            {isPending ? 'جارٍ حجز الموعد…' : 'تأكيد الحجز'}
          </button>
        </div>
      </form>
    </section>
  );
}
