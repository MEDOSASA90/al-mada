'use client';

import { useActionState, useState } from 'react';
import { requestExportAction, type ExportFormState } from './actions';

export function ExportForm() {
  const [state, formAction, pending] = useActionState<ExportFormState, FormData>(
    requestExportAction,
    { message: '', success: false }
  );

  const [downloadHref, setDownloadHref] = useState<string | null>(null);

  function handleDownloadClick() {
    if (state.downloadJson) {
      const blob = new Blob([state.downloadJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadHref(url);
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1" htmlFor="export_type">
            نطاق تصدير البيانات:
          </label>
          <select id="export_type" name="export_type" className="field w-full">
            <option value="full_backup">نسخة احتياطية شاملة (المرضى + المواعيد + الفواتير)</option>
            <option value="patients">سجل المرضى وملفاتهم الطبية فقط</option>
            <option value="billing">دفتر الفواتير والتحصيلات المالية فقط</option>
            <option value="appointments">جدول المواعيد والحجوزات فقط</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            تتوافق ملفات التصدير بصيغة JSON و CSV القابلة للاستيراد في برامج المحاسبة ونظم السجلات الصحية الوطنية.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="primary-button w-full sm:w-auto"
        >
          {pending ? 'جارٍ تجميع وتشفير البيانات…' : '📦 إنشاء وتنزيل حزمة التصدير الآن'}
        </button>
      </form>

      {state.message && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm ${
            state.success ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <p className="font-semibold">{state.message}</p>
          {state.downloadJson && (
            <div className="mt-3">
              <a
                href={`data:application/json;charset=utf-8,${encodeURIComponent(state.downloadJson)}`}
                download={`almada-clinic-export-${new Date().toISOString().slice(0, 10)}.json`}
                onClick={handleDownloadClick}
                className="secondary-button inline-flex items-center text-xs font-bold"
              >
                📥 حفظ ملف التصدير (JSON) إلى جهازك
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
