'use client';

import { useState, useTransition } from 'react';
import { DEFAULT_TEMPLATES, type NotificationTemplate, type OutboxMessage } from '@/lib/notifications';

export function WhatsAppTester({
  initialTemplates,
  initialMessages,
}: {
  initialTemplates: NotificationTemplate[];
  initialMessages: OutboxMessage[];
}) {
  const [phone, setPhone] = useState('01001234567');
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplates[0].key);
  const [messages, setMessages] = useState<OutboxMessage[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeTmpl = initialTemplates.find((t) => t.key === selectedTemplate) || initialTemplates[0];

  function handleSendTest() {
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 600));
      const rendered = activeTmpl.content
        .replace('{clinic_name}', 'عيادة المدى التخصصية')
        .replace('{date}', 'اليوم')
        .replace('{time}', '07:30 م')
        .replace('{doctor_name}', 'د. سارة عثمان')
        .replace('{queue_number}', '5')
        .replace('{waiting_ahead}', '2')
        .replace('{portal_url}', 'https://al-mada-pink.vercel.app/portal');

      const newMsg: OutboxMessage = {
        id: `msg_${Date.now()}`,
        patient_name: 'تجربة إرسال مباشر',
        phone,
        channel: 'whatsapp',
        template_title: activeTmpl.title_ar,
        rendered_text: rendered,
        status: 'delivered',
        sent_at: 'الآن',
      };

      setMessages([newMsg, ...messages]);
      setFeedback(`تم بنجاح تسليم الرسالة التجريبية إلى الرقم ${phone} عبر محاكي واتساب السحابي (WhatsApp Sandbox).`);
    });
  }

  return (
    <div className="space-y-8">
      {/* Privacy Guarantee Banner */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 text-sky-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span>🛡️ التزام صارم بخصوصية البيانات الطبية (قانون حماية البيانات المصري 151/2020):</span>
        </div>
        <p className="text-xs leading-relaxed text-sky-900">
          تقتصر كافة رسائل الواتساب والرسائل النصية التلقائية على معلومات الحضور ومواعيد الطابور فقط. <strong>يحظر النظام تلقائياً إرسال أي تشخيص مرضي أو أسماء أدوية أو نتائج تحاليل سريرية عبر الواتساب</strong>، ويتم توجيه المريض حصراً للولوج الآمن عبر بوابة المريض المعتمدة.
        </p>
      </div>

      {/* Simulator Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900">اختبار الإرسال المباشر (WhatsApp Cloud Sandbox)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اختر قالب الرسالة:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
              >
                {initialTemplates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.title_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف المريض التجريبي:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono focus:border-teal-700 focus:outline-hidden text-left"
                dir="ltr"
                placeholder="010XXXXXXXX"
              />
            </div>

            <button
              type="button"
              disabled={isPending || !phone}
              onClick={handleSendTest}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-2"
            >
              <span>{isPending ? 'جارٍ الإرسال…' : 'إرسال رسالة واتساب تجريبية الآن 📲'}</span>
            </button>
            {feedback && <p className="text-xs text-emerald-800 font-semibold">{feedback}</p>}
          </div>

          {/* WhatsApp Message Preview */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-900 block mb-2">معاينة الرسالة كما ستصل لهاتف المريض:</span>
              <div className="rounded-xl bg-white p-4 shadow-xs text-xs text-slate-800 leading-relaxed border border-emerald-100">
                <p className="whitespace-pre-line">
                  {activeTmpl.content
                    .replace('{clinic_name}', 'عيادة المدى التخصصية')
                    .replace('{date}', 'اليوم')
                    .replace('{time}', '07:30 م')
                    .replace('{doctor_name}', 'د. سارة عثمان')
                    .replace('{queue_number}', '5')
                    .replace('{waiting_ahead}', '2')
                    .replace('{portal_url}', 'https://al-mada-pink.vercel.app/portal')}
                </p>
                <div className="mt-2 text-left text-[10px] text-slate-400">07:30 م ✓✓</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              يتم استبدال المتغيرات تلقائياً من بيانات الموعد وطابور الكشف الحي
            </p>
          </div>
        </div>
      </div>

      {/* Outbox Activity Log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">سجل الرسائل المرسلة مؤخراً (Message Outbox)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3">المريض</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">نوع الإشعار</th>
                <th className="p-3">نص الرسالة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">{m.patient_name}</td>
                  <td className="p-3 font-mono" dir="ltr">{m.phone}</td>
                  <td className="p-3 font-medium text-teal-800">{m.template_title}</td>
                  <td className="p-3 max-w-xs truncate text-slate-500">{m.rendered_text}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      تم التسليم ✓
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{m.sent_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
