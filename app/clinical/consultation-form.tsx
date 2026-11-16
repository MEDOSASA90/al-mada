'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveConsultationAction, lockConsultationAction, type ClinicalFormState } from './actions';
import type { MedicalRecord } from '@/lib/medical-records';

const initialState: ClinicalFormState = { message: '', success: false };

type Props = {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  existingRecord: MedicalRecord | null;
  patientName: string;
  doctorName: string;
};

export function ConsultationForm({
  patientId,
  doctorId,
  appointmentId,
  existingRecord,
  patientName,
  doctorName,
}: Props) {
  const [state, formAction, isPending] = useActionState(saveConsultationAction, initialState);
  const [locking, setLocking] = useState(false);
  const [lockMsg, setLockMsg] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState(existingRecord?.treatment_plan || '');

  const isLocked = existingRecord?.is_locked ?? false;
  const vitals = existingRecord?.vitals ?? {};

  function appendPreset(presetText: string) {
    if (isLocked) return;
    setTreatmentPlan((prev) => (prev ? `${prev.trim()}\n• ${presetText}` : `• ${presetText}`));
  }

  async function handleLock() {
    if (!existingRecord?.id) return;
    if (!confirm('هل أنت متأكد من اعتماد وقفل هذا الكشف؟ لن يمكنك تعديله بعد الاعتماد طبقاً لمعايير التدقيق الطبي.')) {
      return;
    }
    setLocking(true);
    setLockMsg('');
    const res = await lockConsultationAction(existingRecord.id, appointmentId);
    setLockMsg(res.message);
    setLocking(false);
  }

  return (
    <div className="space-y-6">
      {/* Consultation Status Banner */}
      {isLocked ? (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-purple-950 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">✓ تم اعتماد وقفل هذا السجل الطبي رسمياً</p>
            <p className="text-xs text-purple-800 mt-0.5">
              السجل محفوظ كنسخة نهائية غير قابلة للمحو، وأي تغيير مستقبلي يسجل كملحق تعديل (Amendment).
            </p>
          </div>
          <span className="text-xs bg-purple-200 text-purple-900 rounded-lg px-2.5 py-1 font-bold">
            معتمد ومقفل
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">مسودة كشف طبي قيد التحرير</p>
            <p className="text-xs text-amber-800 mt-0.5">
              يمكنك تعديل وحفظ بيانات الكشف، ثم الضغط على «اعتماد وقفل الكشف» لإنهاء الزيارة.
            </p>
          </div>
          {existingRecord?.id && (
            <button
              onClick={handleLock}
              disabled={locking}
              className="bg-purple-800 text-white hover:bg-purple-900 text-xs font-semibold py-2 px-4 rounded-xl transition shadow-xs"
              type="button"
            >
              {locking ? 'جارٍ الاعتماد…' : '🔒 اعتماد وقفل الكشف'}
            </button>
          )}
        </div>
      )}

      {lockMsg && (
        <div className="rounded-xl bg-purple-100 p-3 text-xs text-purple-900 border border-purple-200">
          {lockMsg}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="patient_id" value={patientId} />
        <input type="hidden" name="doctor_id" value={doctorId} />
        <input type="hidden" name="appointment_id" value={appointmentId} />
        {existingRecord?.id && <input type="hidden" name="record_id" value={existingRecord.id} />}

        {/* 1. Vital Signs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>🩺</span>
            <span>القياسات الحيوية (Vitals)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">ضغط الدم (BP)</label>
              <input
                name="vitals_bp"
                defaultValue={vitals.blood_pressure || ''}
                disabled={isLocked}
                placeholder="120/80"
                className="field mt-1 text-sm text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">النبض (HR)</label>
              <input
                name="vitals_hr"
                defaultValue={vitals.heart_rate || ''}
                disabled={isLocked}
                placeholder="75 bpm"
                className="field mt-1 text-sm text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">الحرارة (°C)</label>
              <input
                name="vitals_temp"
                defaultValue={vitals.temperature || ''}
                disabled={isLocked}
                placeholder="37.0"
                className="field mt-1 text-sm text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">الوزن (كجم)</label>
              <input
                name="vitals_weight"
                defaultValue={vitals.weight || ''}
                disabled={isLocked}
                placeholder="70"
                className="field mt-1 text-sm text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">الطول (سم)</label>
              <input
                name="vitals_height"
                defaultValue={vitals.height || ''}
                disabled={isLocked}
                placeholder="175"
                className="field mt-1 text-sm text-left"
                dir="ltr"
              />
            </div>
          </div>
        </section>

        {/* 2. Clinical Notes & Diagnosis */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>📝</span>
            <span>الشكوى والفحص السريري والتشخيص</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-700">الشكوى الرئيسية وتاريخ المرض الحالي</label>
            <textarea
              name="chief_complaint"
              defaultValue={existingRecord?.chief_complaint || ''}
              disabled={isLocked}
              rows={3}
              placeholder="وصف شكوى المريض، الأعراض، وبدايتها…"
              className="field mt-1 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">التشخيص الطبي (Diagnosis)</label>
            <input
              name="diagnosis"
              defaultValue={existingRecord?.diagnosis || ''}
              disabled={isLocked}
              placeholder="التشخيص الأولي أو النهائي (مثال: نزلة معوية حادة، التهاب شعبي…)"
              className="field mt-1 w-full font-medium"
            />
          </div>
        </section>

        {/* 3. Treatment Plan & Prescription */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>💊</span>
            <span>الخطة العلاجية والروشتة الطبية</span>
          </h3>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-slate-700">الأدوية والجرعات والتعليمات</label>
              <Link
                href={`/clinical/${appointmentId}/prescription`}
                className="text-xs font-semibold text-teal-800 hover:underline inline-flex items-center gap-1"
              >
                <span>معاينة الروشتة الرسمية (PDF) ←</span>
              </Link>
            </div>

            {/* Quick Dosage Presets */}
            {!isLocked && (
              <div className="my-2.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">⚡ قوالب جرعات جاهزة (انقر للإضافة السريعة):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => appendPreset('قرص 3 مرات يومياً بعد الأكل (لمدة 5 أيام)')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + قرص 3 مرات بعد الأكل (5 أيام)
                  </button>
                  <button
                    type="button"
                    onClick={() => appendPreset('قرص مرتين يومياً كل 12 ساعة بعد الأكل (لمدة 7 أيام)')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + قرص مرتين كل 12 ساعة (7 أيام)
                  </button>
                  <button
                    type="button"
                    onClick={() => appendPreset('قرص واحد يومياً صباحاً على الريق (شهر)')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + قرص صباحاً على الريق (شهر)
                  </button>
                  <button
                    type="button"
                    onClick={() => appendPreset('كبسولة واحدة مساءً قبل النوم مباشرة')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + كبسولة قبل النوم
                  </button>
                  <button
                    type="button"
                    onClick={() => appendPreset('مسكن باراسيتامول عند اللزوم (بحد أقصى 3 مرات يومياً بعد الأكل)')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + مسكن عند اللزوم
                  </button>
                  <button
                    type="button"
                    onClick={() => appendPreset('دهان موضعي مرتين يومياً صباحاً ومساءً')}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-teal-900 hover:bg-teal-50 transition"
                  >
                    + دهان موضعي مرتين
                  </button>
                </div>
              </div>
            )}

            <textarea
              name="treatment_plan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              disabled={isLocked}
              rows={5}
              placeholder="اسم الدواء — الجرعة والتكرار — المدة (أو اختر من القوالب السريعة أعلاه)"
              className="field mt-1 w-full font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ملاحظات داخلية / توصيات المتابعة</label>
            <textarea
              name="notes"
              defaultValue={existingRecord?.notes || ''}
              disabled={isLocked}
              rows={2}
              placeholder="توصيات بالفحوصات المطلوبة، موعد الاستشارة القادمة…"
              className="field mt-1 w-full"
            />
          </div>
        </section>

        {state.message && (
          <div
            role="alert"
            className={`rounded-xl p-4 text-sm ${
              state.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {state.message}
          </div>
        )}

        {!isLocked && (
          <div className="flex items-center justify-between pt-2">
            <Link href="/appointments" className="secondary-button text-sm">
              ← عودة لجدول المواعيد
            </Link>

            <button
              disabled={isPending}
              className="primary-button inline-flex items-center gap-2"
            >
              <span>💾</span>
              <span>{isPending ? 'جارٍ الحفظ…' : 'حفظ الكشف الطبي'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
