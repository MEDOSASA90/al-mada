'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { addPatient, type PatientFormState } from './actions';

const initialState: PatientFormState = { message: '', success: false };

const FALLBACK_DOCTORS = [
  { id: '11111111-1111-1111-1111-111111111111', full_name: 'د. محمود مجدي (باطنة وجهاز هضمي)' },
  { id: '11111111-1111-1111-1111-111111111112', full_name: 'د. سارة عادل (جلدية وتجميل)' },
];

const FALLBACK_BRANCHES = [
  { id: 'branch_01', name_ar: 'الفرع الرئيسي - مصر الجديدة', name: 'Main Branch' },
  { id: 'branch_02', name_ar: 'فرع التجمع الخامس - ميديكال بارك', name: 'New Cairo Branch' },
];

type Props = {
  doctors?: Array<{ id: string; full_name: string }>;
  branches?: Array<{ id: string; name_ar: string; name?: string }>;
};

export function PatientForm({ doctors, branches }: Props) {
  const [state, action, pending] = useActionState(addPatient, initialState);
  const [quickIntake, setQuickIntake] = useState(true);

  const doctorList = doctors && doctors.length > 0 ? doctors : FALLBACK_DOCTORS;
  const branchList = branches && branches.length > 0 ? branches : FALLBACK_BRANCHES;

  return (
    <details className="group rounded-2xl border border-teal-200 bg-white shadow-xs overflow-hidden transition-all open:ring-2 open:ring-teal-500/20">
      <summary className="cursor-pointer list-none p-5 font-semibold text-teal-950 flex flex-wrap items-center justify-between gap-3 hover:bg-teal-50/50 select-none">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white text-lg font-bold shadow-xs">
            +
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">تسجيل مريض جديد / كشف فوري سريع (Walk-in Intake)</h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">تسجيل بيانات المريض أو إدخاله مباشرة لطابور الانتظار اليوم بضغطة زر واحدة</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          ⚡ تسجيل + كشف + طابور فوري
        </span>
      </summary>

      <form action={action} className="border-t border-slate-100 p-6 space-y-6">
        {/* Section 1: Patient Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">1. البيانات الشخصية للمريض</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              الاسم الكامل <span className="text-rose-500">*</span>
              <input
                name="full_name"
                required
                minLength={2}
                maxLength={160}
                autoComplete="name"
                placeholder="مثال: محمد عبد الرحمن إبراهيم"
                className="field mt-1.5"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              رقم الهاتف (واتساب) <span className="text-rose-500">*</span>
              <input
                name="phone"
                required
                type="tel"
                autoComplete="tel"
                className="field mt-1.5"
                placeholder="+20 10 1234 5678"
                dir="ltr"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              النوع
              <select name="gender" defaultValue="" className="field mt-1.5">
                <option value="">غير محدد</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
                <option value="other">آخر</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              تاريخ الميلاد
              <input name="birth_date" type="date" className="field mt-1.5" />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              البريد الإلكتروني (اختياري)
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="patient@example.com"
                className="field mt-1.5"
                dir="ltr"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Quick Walk-in Intake Option */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 sm:p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="quick_intake"
              checked={quickIntake}
              onChange={(e) => setQuickIntake(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="block text-sm font-bold text-teal-950">
                حجز كشف فوري وإدخال المريض لطابور الانتظار اليوم (Quick Walk-in Intake)
              </span>
              <span className="block text-xs text-teal-800 mt-0.5">
                تفعيل هذا الخيار يقوم تلقائياً بإنشاء موعد اليوم وإصدار تذكرة انتظار فوريّة برقم تسلسلي دون الحاجة للتنقل بين الشاشات.
              </span>
            </div>
          </label>

          {quickIntake && (
            <div className="grid gap-4 pt-3 border-t border-teal-200/60 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-800">
                الطبيب المعالج <span className="text-rose-500">*</span>
                <select name="doctor_id" required={quickIntake} className="field mt-1.5 bg-white font-medium">
                  {doctorList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-800">
                فرع العيادة
                <select name="branch_id" defaultValue={branchList[0]?.id} className="field mt-1.5 bg-white">
                  {branchList.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name_ar || br.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-800">
                نوع الزيارة
                <select name="visit_type" defaultValue="clinic" className="field mt-1.5 bg-white">
                  <option value="clinic">كشف عيادة عادي (350 ج.م)</option>
                  <option value="telemedicine">استشارة متابعة (مجانًا)</option>
                  <option value="emergency">حالة طارئة عاجلة (500 ج.م)</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-800 sm:col-span-2 lg:col-span-3">
                سبب الزيارة أو الشكوى المبدئية (اختياري)
                <input
                  name="reason"
                  maxLength={500}
                  placeholder="مثال: فحص دوري، مغص معوي، استشارة نتائج تحاليل…"
                  className="field mt-1.5 bg-white"
                />
              </label>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500">
            {quickIntake
              ? '⚡ سيتم تسجيل المريض، حجز موعد اليوم، وإدراجه في طابور انتظار الطبيب.'
              : 'سيتم حفظ المريض فقط في السجل دون حجز موعد.'}
          </p>
          <button
            disabled={pending}
            className="primary-button inline-flex items-center justify-center gap-2 px-6 py-2.5 font-bold"
          >
            <span>{quickIntake ? '⚡' : '💾'}</span>
            <span>
              {pending
                ? 'جارٍ المعالجة الفورية…'
                : quickIntake
                ? 'تسجيل المريض وحجز كشف فوري في الطابور'
                : 'حفظ بيانات المريض في السجل'}
            </span>
          </button>
        </div>

        {/* Feedback Message */}
        {state.message && (
          <div
            role="status"
            className={`rounded-xl p-4 text-sm flex flex-wrap items-center justify-between gap-3 ${
              state.success
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <span className="font-semibold">{state.message}</span>
            {state.success && (
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href="/queue"
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800 transition-colors"
                >
                  عرض طابور الانتظار ←
                </Link>
                <Link
                  href="/appointments"
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-800 hover:bg-emerald-50 transition-colors"
                >
                  جدول المواعيد
                </Link>
              </div>
            )}
          </div>
        )}
      </form>
    </details>
  );
}
