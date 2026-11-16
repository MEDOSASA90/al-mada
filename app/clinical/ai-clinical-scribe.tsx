'use client';

import { useState } from 'react';
import { generateClinicalDraftAction, getPatientHistorySummaryAction } from './ai-actions';
import type { ClinicalAIDraft } from '@/lib/ai';

type Props = {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  isLocked: boolean;
  onApplyDraft: (draft: ClinicalAIDraft) => void;
};

export function AIClinicalScribe({
  appointmentId,
  patientId,
  doctorName,
  isLocked,
  onApplyDraft,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<ClinicalAIDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [historySummary, setHistorySummary] = useState<{
    summary: string;
    bulletPoints: string[];
    allergies: string[];
    chronicDiseases: string[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Preset clinical scenarios common in Egyptian outpatient clinics
  const sampleScenarios = [
    {
      title: 'باطنة: صداع نصفي وضغط مرتفع',
      text: 'المريض جاي بيشتكي من صداع نصفي شديد وإجهاد عام بقاله يومين، الضغط 140/90 والنبض 84 bpm وحرارته 37.1، كتبنا له كونكور 5 قرص صباحا بعد الفطار وبانادول اكسترا قرصين عند اللزوم، ومتابعة بعد أسبوع مع فحص قاع عين.',
    },
    {
      title: 'صدرية: سعال وأزمة ربوية',
      text: 'المريض يعاني من كحة ناشفة مستمرة بقالها 5 أيام مع ضيق تنفس وأزيز بالصدر ليلاً، الضغط 125/80 والحرارة 37.8، صدره فيه wheezes خفيفة، كتبنا له تافانيك 500 قرص يومياً لمدة 5 أيام وبخاخ فنتولين بختين عند اللزوم وشراب برونكوفين 3 مرات، مع أشعة عادية على الصدر.',
    },
    {
      title: 'جهاز هضمي: نزلة معوية ومغص',
      text: 'المريض بيشتكي من مغص معوي حاد وإسهال وغثيان بعد وجبة طعام، الضغط 115/75 وحرارته 38، كتبنا له كونترولوك 40 قرص على الريق وأنتينال كبسولة كل 6 ساعات وسبازموديجستين 3 مرات، مع تحليل براز وأكل مسلوق خفيف.',
    },
  ];

  async function handleGenerate(notesToUse?: string) {
    const text = notesToUse || rawNotes;
    if (!text.trim()) {
      setErrorMsg('برجاء كتابة أو إملاء الملاحظات أولاً أو اختيار أحد النماذج الجاهزة أدناه.');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);

    const formData = new FormData();
    formData.append('raw_notes', text);
    formData.append('appointment_id', appointmentId);
    formData.append('patient_id', patientId);
    formData.append('doctor_name', doctorName);

    const res = await generateClinicalDraftAction(formData);
    setIsGenerating(false);

    if (res.success && res.draft) {
      setDraft(res.draft);
    } else {
      setErrorMsg(res.message);
    }
  }

  async function handleFetchHistory() {
    setIsLoadingHistory(true);
    const res = await getPatientHistorySummaryAction(patientId);
    setIsLoadingHistory(false);
    if (res.success && res.summary) {
      setHistorySummary(res.summary);
    }
  }

  function handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('ميزة التعرف الصوتي المباشر تعمل في متصفحات كروم أو إيدج الحديثة. يمكنك تجربة كتابة الملاحظات أو استخدام النماذج السريعة أدناه.');
      return;
    }

    try {
      // @ts-expect-error browser speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRawNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  function applyDraftToConsultation() {
    if (!draft) return;
    onApplyDraft(draft);
    alert('✓ تم استيراد مسودة الذكاء الاصطناعي بنجاح إلى حقول الكشف! يمكنك مراجعتها وحفظها الآن.');
  }

  if (isLocked) return null;

  return (
    <section className="rounded-2xl border-2 border-teal-500/80 bg-linear-to-br from-teal-50/90 via-emerald-50/50 to-white p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white text-xl shadow-xs">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">مساعد الطبيب السريري الذكي (AI Copilot)</h3>
              <span className="rounded-full bg-teal-800 text-white text-[10px] font-bold px-2 py-0.5">
                المرحلة 6
              </span>
            </div>
            <p className="text-xs text-slate-600">
              تحويل الإملاء الصوتي والنصي إلى مسودة كشف، روشتة منظمة، وفحص تعارضات الأدوية فورياً.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchHistory}
            disabled={isLoadingHistory}
            className="secondary-button inline-flex items-center gap-1.5 text-xs py-1.5 px-3 bg-white"
          >
            <span>📜</span>
            <span>{isLoadingHistory ? 'جارٍ التلخيص…' : 'ملخص التاريخ المرضي'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl border border-teal-600 bg-teal-800 text-white hover:bg-teal-900 text-xs font-semibold py-1.5 px-3 transition shadow-2xs"
          >
            {isOpen ? 'إخفاء المساعد ▲' : 'فتح المساعد الذكي ▼'}
          </button>
        </div>
      </div>

      {/* Patient History Summary Alert Box */}
      {historySummary && (
        <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 flex items-center gap-1.5 text-sm">
              <span>🩺</span>
              <span>الملخص الذكي للتاريخ الطبي للمريض</span>
            </span>
            <button
              type="button"
              onClick={() => setHistorySummary(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-700 leading-relaxed">{historySummary.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <strong className="text-rose-800">الحساسيات المسجلة:</strong>{' '}
              <span className="text-slate-700">{historySummary.allergies.join('، ')}</span>
            </div>
            <div>
              <strong className="text-slate-800">الأمراض المزمنة:</strong>{' '}
              <span className="text-slate-700">{historySummary.chronicDiseases.join('، ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Copilot Workspace */}
      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-teal-200/60">
          {/* Quick Presets Bar */}
          <div>
            <span className="text-[11px] font-bold text-teal-900 block mb-1.5">
              ⚡ تجربة سريعة بنماذج كشوفات مصرية جاهزة (انقر لتعبئة الملاحظات):
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleScenarios.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setRawNotes(sc.text);
                    handleGenerate(sc.text);
                  }}
                  className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-medium text-teal-950 hover:bg-teal-100 hover:border-teal-300 transition shadow-2xs"
                >
                  + {sc.title}
                </button>
              ))}
            </div>
          </div>

          {/* Dictation Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                ملاحظات الطبيب أو الإملاء الصوتي:
              </label>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white border border-teal-300 text-teal-800 hover:bg-teal-50'
                }`}
              >
                <span>🎙️</span>
                <span>{isListening ? 'جارٍ الاستماع… تحدث الآن' : 'إملاء صوتي مباشر'}</span>
              </button>
            </div>

            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              rows={3}
              placeholder="اكتب أو أملِ الملاحظات كما تشاء (باللهجة المصرية أو المصطلحات الطبية)... مثال: المريض جاي بيشتكي من صداع نصفي شديد، ضغطه 140/90، كتبنا له كونكور 5 وبانادول..."
              className="field w-full text-xs leading-relaxed bg-white"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="rounded-xl border border-teal-700 bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold py-2 px-4 inline-flex items-center gap-2 shadow-xs transition"
            >
              <span>✨</span>
              <span>{isGenerating ? 'جارٍ تحليل الكشف واستخراج الروشتة…' : 'توليد مسودة الكشف الطبي الذكية'}</span>
            </button>

            {draft && (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                ✓ ثقة التحليل: %{Math.round(draft.confidence * 100)} · النموذج: {draft.model}
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Generated Draft Preview */}
          {draft && (
            <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h4 className="font-bold text-slate-900 text-sm">مسودة الكشف المقترحة</h4>
                  <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                    غير معتمدة — تحتاج مراجعة الطبيب
                  </span>
                </div>

                <button
                  type="button"
                  onClick={applyDraftToConsultation}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-3.5 inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>📥</span>
                  <span>تطبيق ونقل المسودة في استمارة الكشف الأصلية</span>
                </button>
              </div>

              {/* Safety Alerts (Allergies & Contraindications) */}
              {draft.safetyAlerts.length > 0 && (
                <div className="space-y-2">
                  {draft.safetyAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs border flex items-start gap-2.5 ${
                        alert.severity === 'critical'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong className="block font-bold">{alert.claim}</strong>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          المصدر: {alert.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Draft Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-800 block">الشكوى الرئيسية وتاريخ المرض:</span>
                  <p className="text-slate-700">{draft.chiefComplaint}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-800 block">التشخيص المقترح:</span>
                  <p className="text-slate-700 font-semibold">{draft.provisionalDiagnosis}</p>
                </div>
              </div>

              {/* Prescriptions List */}
              {draft.prescriptions.length > 0 && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 space-y-2">
                  <span className="font-bold text-teal-950 text-xs block">
                    💊 الأدوية المستخرجة للروشتة ({draft.prescriptions.length}):
                  </span>
                  <div className="divide-y divide-teal-100 text-xs">
                    {draft.prescriptions.map((rx, idx) => (
                      <div key={idx} className="py-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong className="text-teal-950 font-bold">{rx.name}</strong>
                          <p className="text-slate-600 text-[11px]">
                            الجرعة: {rx.dosage} · التكرار: {rx.frequency} · المدة: {rx.duration}
                          </p>
                        </div>
                        {rx.notes && (
                          <span className="text-[10px] text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                            {rx.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investigations & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {draft.investigations.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                    <span className="font-bold text-slate-800 block">🔬 الفحوصات والتحاليل المطلوبة:</span>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {draft.investigations.map((inv, i) => (
                        <li key={i}>{inv}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-800 block">💡 النصائح والمتابعة:</span>
                  <p className="text-slate-700">{draft.patientAdvice}</p>
                  <p className="text-teal-900 font-semibold text-[11px]">موعد الإعادة: {draft.followUp}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
