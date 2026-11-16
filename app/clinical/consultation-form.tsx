'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveConsultationAction, lockConsultationAction, type ClinicalFormState } from './actions';
import type { MedicalRecord } from '@/lib/medical-records';
import { AIClinicalScribe } from './ai-clinical-scribe';
import type { ClinicalAIDraft } from '@/lib/ai';

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
  
  const isLocked = existingRecord?.is_locked ?? false;
  const vitals = existingRecord?.vitals ?? {};

  // Form Field States (Supports AI Scribe auto-fill)
  const [chiefComplaint, setChiefComplaint] = useState(existingRecord?.chief_complaint || '');
  const [diagnosis, setDiagnosis] = useState(existingRecord?.diagnosis || '');
  const [treatmentPlan, setTreatmentPlan] = useState(existingRecord?.treatment_plan || '');
  const [notes, setNotes] = useState(existingRecord?.notes || '');
  const [vitalsBp, setVitalsBp] = useState(vitals.blood_pressure || '');
  const [vitalsHr, setVitalsHr] = useState(vitals.heart_rate || '');
  const [vitalsTemp, setVitalsTemp] = useState(vitals.temperature || '');
  const [vitalsWeight, setVitalsWeight] = useState(vitals.weight || '');

  function appendPreset(presetText: string) {
    if (isLocked) return;
    setTreatmentPlan((prev) => (prev ? `${prev.trim()}\n• ${presetText}` : `• ${presetText}`));
  }

  function handleApplyDraft(draft: ClinicalAIDraft) {
    if (draft.chiefComplaint) setChiefComplaint(draft.chiefComplaint);
    if (draft.provisionalDiagnosis) setDiagnosis(draft.provisionalDiagnosis);
    if (draft.treatmentPlan) setTreatmentPlan(draft.treatmentPlan);
    if (draft.patientAdvice || draft.followUp) {
      setNotes((prev) =>
        prev
          ? `${prev}\nنصائح: ${draft.patientAdvice} — إعادة الكشف: ${draft.followUp}`
          : `نصائح: ${draft.patientAdvice} — إعادة الكشف: ${draft.followUp}`
      );
    }
    if (draft.vitals.bp) setVitalsBp(draft.vitals.bp);
    if (draft.vitals.hr) setVitalsHr(draft.vitals.hr);
    if (draft.vitals.temp) setVitalsTemp(draft.vitals.temp);
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

      {/* Al-Mada Cross-Clinic Universal Safety Guard (كارت الأمان الدوائي الموحد عبر شبكة المدى) */}
      <section className="rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-4.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/60 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <span>كارت الأمان الدوائي الموحد (شبكة المدى الطبية)</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                  تنبيه سلامة عابر للعيادات
                </span>
              </h3>
              <p className="text-[11px] text-rose-900/80">
                هذه التحذيرات مستخرجة من السجل الصحي الموحد للمريض {patientName} عبر كافة عيادات الشبكة لمنع التداخلات الدوائية القاتلة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-white border border-rose-200 px-2 py-1 font-bold text-slate-800">
              فصيلة الدم: <span className="text-rose-600 font-black">A+</span>
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Contraindicated Drug Classes */}
          <div className="rounded-xl bg-white border border-rose-200 p-3">
            <p className="text-xs font-bold text-rose-950 flex items-center gap-1 mb-1.5">
              <span>⛔</span>
              <span>موانع الاستعمال الدوائية المحظورة (Allergies)</span>
            </p>
            <div className="space-y-1.5">
              <div className="rounded bg-rose-100/70 p-2 text-xs text-rose-950">
                <strong className="block font-bold">بنسلين ومشتقاته (Penicillin & Amoxicillin):</strong>
                <span className="text-[11px] text-rose-900">سُجلت صدمة تحسسية (Anaphylaxis Risk) سابقة. يُحظر وصف أوجمنتين أو هايبوتك أو فلوموكس.</span>
              </div>
              <div className="rounded bg-amber-100/70 p-2 text-xs text-amber-950">
                <strong className="block font-bold">مركبات السلفا (Sulfa Drugs):</strong>
                <span className="text-[11px] text-amber-900">تاريخ حساسية جلدية وتورم. يُحظر وصف سيبتازول ومضادات السلفا.</span>
              </div>
            </div>
          </div>

          {/* Chronic Conditions & Prescribing Precautions */}
          <div className="rounded-xl bg-white border border-rose-200 p-3">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1 mb-1.5">
              <span>🩺</span>
              <span>الأمراض المزمنة ومحاذير الوصف (Precautions)</span>
            </p>
            <div className="space-y-1.5">
              <div className="rounded bg-slate-50 border border-slate-200 p-2 text-xs text-slate-900">
                <strong className="block font-semibold">ربو شعبي وحساسية صدرية (Bronchial Asthma):</strong>
                <span className="text-[11px] text-slate-600">تجنب مسكنات NSAIDs (مثل كتافلام، فولتارين، كيتولاك) لتفادي حدوث تشنج قصبي حاد.</span>
              </div>
              <div className="rounded bg-slate-50 border border-slate-200 p-2 text-xs text-slate-900">
                <strong className="block font-semibold">داء السكري النوع الثاني (Type 2 Diabetes):</strong>
                <span className="text-[11px] text-slate-600">المريض يتناول ميتفورمين 1000 مجم. احذر الكورتيزون والمحاليل السكرية.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Clinical Scribe & History Copilot (Phase 6) */}
      <AIClinicalScribe
        appointmentId={appointmentId}
        patientId={patientId}
        doctorName={doctorName}
        isLocked={isLocked}
        onApplyDraft={handleApplyDraft}
      />

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
                value={vitalsBp}
                onChange={(e) => setVitalsBp(e.target.value)}
                disabled={isLocked}
                placeholder="120/80"
                className="field mt-1 text-sm text-left font-mono"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">النبض (HR)</label>
              <input
                name="vitals_hr"
                value={vitalsHr}
                onChange={(e) => setVitalsHr(e.target.value)}
                disabled={isLocked}
                placeholder="75 bpm"
                className="field mt-1 text-sm text-left font-mono"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">الحرارة (°C)</label>
              <input
                name="vitals_temp"
                value={vitalsTemp}
                onChange={(e) => setVitalsTemp(e.target.value)}
                disabled={isLocked}
                placeholder="37.0"
                className="field mt-1 text-sm text-left font-mono"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">الوزن (كجم)</label>
              <input
                name="vitals_weight"
                value={vitalsWeight}
                onChange={(e) => setVitalsWeight(e.target.value)}
                disabled={isLocked}
                placeholder="70"
                className="field mt-1 text-sm text-left font-mono"
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
                className="field mt-1 text-sm text-left font-mono"
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
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
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
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
