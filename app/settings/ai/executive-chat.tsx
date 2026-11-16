'use client';

import { useState } from 'react';
import Link from 'next/link';
import { askExecutiveAssistantAction, toggleAIKillSwitchAction } from '@/app/clinical/ai-actions';
import type { ExecutiveQueryResponse } from '@/lib/ai';

type Props = {
  initialStatus: {
    isEnabled: boolean;
    activeModel: string;
    whisperModel: string;
    totalCalls: number;
    totalTokens: number;
    totalCostEgp: number;
  };
  initialLogs: Array<{
    id: string;
    taskType: string;
    model: string;
    tokens: number;
    costEgp: number;
    durationMs: number;
    status: string;
    createdAt: string;
  }>;
};

export function ExecutiveChat({ initialStatus, initialLogs }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [conversation, setConversation] = useState<ExecutiveQueryResponse[]>([
    {
      question: 'ملخص أداء العيادة العام',
      answer:
        'مرحباً بك يا دكتور! منظومة الذكاء الاصطناعي مربوطة مباشرة بقواعد بيانات العيادة المالية والتشغيلية. يمكنك سؤالي عن صافي الأرباح، النواقص، أو تقييم أداء الفروع والأطباء.',
      generatedAt: 'الآن',
      sourceUrl: '/billing',
      sourceLabel: 'لوحة الأرباح والمصروفات',
    },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  const quickPrompts = [
    'ما هو إجمالي دخل وصافي أرباح العيادة اليوم؟',
    'ما هي النواقص الحرجة في المخزن الطبي حالياً؟',
    'من هو أكثر طبيب تنفيذاً للكشوفات وما هي عمولته؟',
    'ما هي الفروع النشطة ومواعيد عملها؟',
  ];

  async function handleAsk(promptToUse?: string) {
    const q = promptToUse || question;
    if (!q.trim()) return;

    setErrorMsg('');
    setIsAsking(true);
    setQuestion('');

    const res = await askExecutiveAssistantAction(q);
    setIsAsking(false);

    if (res.success && res.response) {
      setConversation((prev) => [res.response!, ...prev]);
    } else {
      setErrorMsg(res.message || 'تعذّر الحصول على رد.');
    }
  }

  async function handleToggleKillSwitch() {
    if (
      !confirm(
        status.isEnabled
          ? 'هل تريد تعطيل منظومة الذكاء الاصطناعي بالكامل في العيادة؟'
          : 'هل تريد إعادة تفعيل منظومة الذكاء الاصطناعي؟'
      )
    ) {
      return;
    }

    setIsToggling(true);
    const res = await toggleAIKillSwitchAction(!status.isEnabled);
    setIsToggling(false);

    if (res.success && res.status) {
      setStatus(res.status);
    }
  }

  return (
    <div className="space-y-6">
      {/* Kill Switch & Model Specs Control Bar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-4 w-4 rounded-full ${
                status.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                حالة محرك الذكاء الاصطناعي:{' '}
                <span className={status.isEnabled ? 'text-emerald-700' : 'text-rose-700'}>
                  {status.isEnabled ? 'نشط ويعمل بكامل طاقته' : 'معطل بقرار إداري (Kill-Switch Active)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                النموذج النشط: {status.activeModel} · معالج الصوت: {status.whisperModel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleKillSwitch}
            disabled={isToggling}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              status.isEnabled
                ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isToggling
              ? 'جارٍ التحديث…'
              : status.isEnabled
              ? '🛑 إيقاف منظومة الذكاء الاصطناعي (Kill Switch)'
              : '⚡ تفعيل منظومة الذكاء الاصطناعي'}
          </button>
        </div>

        {/* Live Metrics */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-slate-500 block">إجمالي العمليات المنفذة</span>
            <strong className="text-slate-900 text-lg font-bold font-mono">{status.totalCalls} طلب</strong>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-slate-500 block">إجمالي استهلاك الرموز (Tokens)</span>
            <strong className="text-teal-900 text-lg font-bold font-mono">{status.totalTokens.toLocaleString('ar-EG')} توكن</strong>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="text-slate-500 block">التكلفة التقديرية للاستهلاك</span>
            <strong className="text-emerald-900 text-lg font-bold font-mono">{status.totalCostEgp} ج.م</strong>
          </div>
        </div>
      </section>

      {/* Interactive Chat with Executive Copilot */}
      <section className="rounded-2xl border border-teal-200 bg-linear-to-b from-teal-50/50 to-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">💼</span>
          <div>
            <h3 className="font-bold text-slate-900 text-base">المساعد التنفيذي والمالي الذكي (Executive Copilot)</h3>
            <p className="text-xs text-slate-600">
              استعلم باللغة الطبيعية عن أي مؤشر مالي أو تشغيلي في العيادة، مع ربط إجابات الأرقام بمصادرها الأصلية.
            </p>
          </div>
        </div>

        {/* Prompt Chips */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5">أسئلة تنفيذية شائعة:</span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAsk(p)}
                className="rounded-lg border border-teal-200 bg-white px-3 py-1 text-xs text-teal-900 hover:bg-teal-50 transition shadow-2xs"
              >
                💬 {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب سؤالك لمدير العيادة الذكي... مثال: ما هو صافي الدخل اليوم؟ أو ما هي النواقص؟"
            className="field flex-1 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="rounded-xl bg-teal-800 text-white hover:bg-teal-900 px-5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isAsking ? 'جارٍ الحساب…' : 'إرسال السؤال'}
          </button>
        </form>

        {errorMsg && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Conversation Stream */}
        <div className="space-y-3 pt-2">
          {conversation.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <strong className="text-teal-950 font-bold flex items-center gap-1.5 text-xs">
                  <span>❓</span>
                  <span>{item.question}</span>
                </strong>
                <span>{item.generatedAt}</span>
              </div>

              <p className="text-slate-800 leading-relaxed text-xs">{item.answer}</p>

              {item.metrics && Object.keys(item.metrics).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {Object.entries(item.metrics).map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[11px] text-teal-900"
                    >
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}

              {item.sourceUrl && (
                <div className="pt-1 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    href={item.sourceUrl}
                    className="text-[11px] font-semibold text-teal-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>عرض السجلات المصدرية في {item.sourceLabel || 'النظام'} ←</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Audit Trail & Task Log */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">سجل عمليات وتدقيق الذكاء الاصطناعي (AI Task Audit)</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              توثيق شفاف لكافة الطلبات، التوكنز المستهلكة، وزمن الاستجابة طبقاً للمعيار 14 في متطلبات المرحلة 6.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
            {initialLogs.length} عمليات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">نوع المهمة</th>
                <th className="p-3">النموذج</th>
                <th className="p-3 text-center">الرموز (Tokens)</th>
                <th className="p-3 text-center">التكلفة (EGP)</th>
                <th className="p-3 text-center">زمن المعالجة</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-semibold text-slate-900">
                    {log.taskType === 'clinical_scribe'
                      ? 'مساعد الكشف السريري (Scribe)'
                      : log.taskType === 'drug_interaction_check'
                      ? 'فحص تعارضات الأدوية'
                      : log.taskType}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{log.model}</td>
                  <td className="p-3 text-center font-mono font-bold">{log.tokens}</td>
                  <td className="p-3 text-center font-mono text-emerald-800">{log.costEgp} ج.م</td>
                  <td className="p-3 text-center font-mono text-slate-500">{log.durationMs} ms</td>
                  <td className="p-3 text-center">
                    <span className="inline-block rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                      {log.status === 'succeeded' ? 'ناجح' : log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
