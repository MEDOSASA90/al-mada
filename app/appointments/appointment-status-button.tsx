'use client';

import { useState } from 'react';
import Link from 'next/link';
import { changeAppointmentStatusAction, issueQueueTicketAction } from './actions';

type Props = {
  appointmentId: string;
  currentStatus: string;
};

export function AppointmentStatusButtons({ appointmentId, currentStatus }: Props) {
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState('');

  async function handleStatus(status: 'confirmed' | 'canceled' | 'no_show', reason?: string) {
    setBusy(true);
    setMessage('');
    const fd = new FormData();
    fd.set('id', appointmentId);
    fd.set('status', status);
    if (reason) fd.set('reason', reason);

    const res = await changeAppointmentStatusAction({ message: '', success: false }, fd);
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setCancelOpen(false);
    }
  }

  async function handleQueueTicket() {
    setBusy(true);
    setMessage('');
    const res = await issueQueueTicketAction(appointmentId);
    setMessage(res.message);
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* If booked, allow confirm or issue queue ticket */}
      {currentStatus === 'booked' && (
        <button
          onClick={() => handleStatus('confirmed')}
          disabled={busy}
          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1.5 font-medium transition"
          type="button"
        >
          تأكيد الموعد
        </button>
      )}

      {/* If confirmed or booked, allow sending patient to waiting room */}
      {['booked', 'confirmed'].includes(currentStatus) && (
        <button
          onClick={handleQueueTicket}
          disabled={busy}
          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1.5 font-medium transition"
          type="button"
          title="تسجيل حضور المريض وإعطاؤه تذكرة انتظار"
        >
          حضور (طابور الانتظار)
        </button>
      )}

      {/* If in waiting or in_progress, doctor can enter clinical examination */}
      {['waiting', 'confirmed', 'in_progress'].includes(currentStatus) && (
        <Link
          href={`/clinical/${appointmentId}`}
          className="text-xs bg-teal-800 text-white hover:bg-teal-900 rounded-lg px-2.5 py-1.5 font-medium transition shadow-xs"
        >
          بدء الكشف الطبي ←
        </Link>
      )}

      {/* Cancellation controls */}
      {['booked', 'confirmed', 'waiting'].includes(currentStatus) && !cancelOpen && (
        <button
          onClick={() => setCancelOpen(true)}
          disabled={busy}
          className="text-xs text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2 py-1 transition"
          type="button"
        >
          إلغاء
        </button>
      )}

      {/* Mark no-show */}
      {['booked', 'confirmed', 'waiting'].includes(currentStatus) && !cancelOpen && (
        <button
          onClick={() => handleStatus('no_show')}
          disabled={busy}
          className="text-xs text-slate-400 hover:text-slate-700 rounded-lg px-2 py-1 transition"
          type="button"
        >
          لم يحضر
        </button>
      )}

      {cancelOpen && (
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="سبب الإلغاء…"
            className="field text-xs py-1 px-2 w-32"
          />
          <button
            onClick={() => handleStatus('canceled', cancelReason)}
            disabled={busy}
            className="bg-rose-600 text-white rounded px-2 py-1 font-medium"
            type="button"
          >
            تأكيد
          </button>
          <button
            onClick={() => setCancelOpen(false)}
            className="text-slate-400 hover:text-slate-600 px-1"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {message && (
        <span className="text-[11px] text-slate-600 block w-full mt-1">
          {message}
        </span>
      )}
    </div>
  );
}
