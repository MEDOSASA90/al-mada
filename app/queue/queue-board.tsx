'use client';

import { useState } from 'react';
import Link from 'next/link';
import { advanceTicketAction } from './actions';
import type { QueueTicket } from '@/lib/queue';

export function QueueBoard({ tickets }: { tickets: QueueTicket[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const calledTickets = tickets.filter((t) => t.status === 'called' || t.status === 'in_service');
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');

  async function updateStatus(ticketId: string, status: string) {
    setBusyId(ticketId);
    setMsg('');
    const res = await advanceTicketAction(ticketId, status);
    if (!res.ok) setMsg(res.message);
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {msg}
        </div>
      )}

      {/* 1. Large Display for Currently Called / In Service */}
      <section className="rounded-2xl border-2 border-teal-500 bg-teal-950 text-white p-6 sm:p-8 shadow-md">
        <div className="flex items-center justify-between border-b border-teal-800 pb-4 mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-teal-400 font-bold">
              شاشة الاستدعاء بالعيادة
            </span>
            <h2 className="text-2xl font-bold mt-1">الدور الحالي (الكشف القائم)</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-800 px-3 py-1 text-xs text-teal-200 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            مباشر
          </span>
        </div>

        {calledTickets.length === 0 ? (
          <div className="py-8 text-center text-teal-300 text-sm">
            لا يوجد مريض مستدعى حالياً. اضغط على «استدعاء الآن» من قائمة الانتظار أدناه.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calledTickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-teal-900/80 border border-teal-700 p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-teal-200">
                      #{t.ticket_number}
                    </span>
                    <span className="text-xs text-teal-400">
                      {t.status === 'called' ? 'مستدعى للغرفة' : 'داخل الكشف'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{t.patient_name}</h3>
                  {t.doctor_name && (
                    <p className="text-xs text-teal-300 mt-0.5">الطبيب: {t.doctor_name}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {t.patient_phone && (
                    <a
                      href={`https://wa.me/${(t.patient_phone.replace(/[^0-9]/g, '').startsWith('0') ? '2' : '') + t.patient_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `عزيزنا ${t.patient_name}، تذكرة رقم #${t.ticket_number}. حان دورك الآن للكشف مع ${t.doctor_name || 'الطبيب'} في عيادة المدى. برجاء التوجه لغرفة الكشف.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-2.5 rounded-lg transition inline-flex items-center gap-1"
                      title="إرسال إشعار استدعاء الدور عبر واتساب"
                    >
                      <span>💬</span>
                      <span>تنبيه واتساب</span>
                    </a>
                  )}
                  {t.appointment_id && (
                    <Link
                      href={`/clinical/${t.appointment_id}`}
                      className="bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs py-2 px-3 rounded-lg transition"
                    >
                      دخول الكشف ←
                    </Link>
                  )}
                  {t.status === 'called' && (
                    <button
                      onClick={() => updateStatus(t.id, 'in_service')}
                      disabled={busyId === t.id}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
                      type="button"
                    >
                      بدء الكشف
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(t.id, 'done')}
                    disabled={busyId === t.id}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
                    type="button"
                  >
                    إنهاء الزيارة
                  </button>
                  <button
                    onClick={() => updateStatus(t.id, 'skipped')}
                    disabled={busyId === t.id}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 px-2.5 rounded-lg transition"
                    type="button"
                    title="تخطي الدور"
                  >
                    تخطي
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Waiting Room Queue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              قائمة الانتظار ({waitingTickets.length} مريض)
            </h2>
            <p className="text-xs text-slate-500">المرضى الحاضرون في صالة الانتظار مرتبون حسب أولوية ورقم التذكرة.</p>
          </div>
        </div>

        {waitingTickets.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            صالة الانتظار فارغة حالياً. عند حضور المريض لموعده، اضغط على «حضور (طابور الانتظار)» في جدول المواعيد.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitingTickets.map((t) => (
              <div
                key={t.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-base">
                    #{t.ticket_number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{t.patient_name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {t.doctor_name && <span>الطبيب: {t.doctor_name}</span>}
                      <span>
                        وقت الحضور: {new Date(t.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {t.patient_phone && (
                    <a
                      href={`https://wa.me/${(t.patient_phone.replace(/[^0-9]/g, '').startsWith('0') ? '2' : '') + t.patient_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `عزيزنا ${t.patient_name}، تذكرة رقم #${t.ticket_number}. حان دورك الآن للكشف مع ${t.doctor_name || 'الطبيب'} في عيادة المدى. برجاء التوجه لغرفة الكشف.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition inline-flex items-center gap-1"
                      title="إرسال تنبيه بالدور للمريض عبر واتساب"
                    >
                      <span>💬</span>
                      <span>واتساب</span>
                    </a>
                  )}
                  <button
                    onClick={() => updateStatus(t.id, 'called')}
                    disabled={busyId === t.id}
                    className="primary-button text-xs py-1.5 px-3"
                    type="button"
                  >
                    📢 استدعاء الآن
                  </button>
                  <button
                    onClick={() => updateStatus(t.id, 'cancelled')}
                    disabled={busyId === t.id}
                    className="text-xs text-slate-400 hover:text-rose-700 px-2 py-1"
                    type="button"
                  >
                    إلغاء التذكرة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
