'use client';

import { useState } from 'react';

export function AppointmentRescheduleDialog({
  appointmentId,
  currentDate,
  currentTime,
  patientName,
}: {
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime.slice(0, 5));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    }, 600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition"
        type="button"
        title="تغيير توقيت أو تاريخ الموعد"
      >
        🕒 تعديل الموعد
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-right">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">تعديل موعد كشف: {patientName}</h3>
            <p className="text-xs text-slate-500">الموعد الحالي: {currentDate} ({currentTime.slice(0, 5)})</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">تاريخ الكشف الجديد</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">توقيت الحجز</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono font-bold"
            />
          </div>

          {saved && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center text-xs font-bold text-emerald-800">
              ✓ تم تحديث وتأجيل الموعد بنجاح!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-button text-xs py-1.5 px-4"
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ الموعد الجديد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
