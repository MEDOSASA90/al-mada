'use client';

import { useState } from 'react';
import Link from 'next/link';

type RxItem = {
  id?: string;
  medication_name: string;
  form?: string;
  dose?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  instructions?: string;
};

type Props = {
  appointmentId: string;
  clinicName: string;
  doctorName: string;
  doctorTitle?: string;
  licenseNumber?: string;
  patientName: string;
  patientFileNumber: string;
  patientPhone?: string | null;
  patientBirthDate?: string | null;
  patientGender?: string | null;
  diagnosis?: string | null;
  prescriptionItems: RxItem[];
  generalInstructions?: string | null;
  appointmentDate: string;
  isLocked: boolean;
};

export function PrescriptionView({
  appointmentId,
  clinicName,
  doctorName,
  doctorTitle = 'استشاري الباطنة والجهاز الهضمي',
  licenseNumber = '34892/2018',
  patientName,
  patientFileNumber,
  patientPhone,
  patientBirthDate,
  patientGender,
  diagnosis,
  prescriptionItems,
  generalInstructions,
  appointmentDate,
  isLocked,
}: Props) {
  const [withHeader, setWithHeader] = useState(true);

  // Calculate age if birth date is available
  const age = patientBirthDate
    ? Math.floor((new Date().getTime() - new Date(patientBirthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  function handlePrint() {
    window.print();
  }

  // Format phone and WhatsApp message
  const cleanPhone = patientPhone ? patientPhone.replace(/[^0-9]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const medsSummary = prescriptionItems.map((item, i) => `${i + 1}. ${item.medication_name} (${item.frequency || ''} - ${item.timing || ''})`).join('\n');
  const waMsg = encodeURIComponent(
    `أهلاً بك أستاذ ${patientName}،\nإليك الروشتة الطبية الإلكترونية الصادرة لك من ${clinicName} بتاريخ ${appointmentDate} مع ${doctorName}:\n\nالتشخيص: ${diagnosis || 'متابعة وفحص'}\n\nالأدوية المقررة:\n${medsSummary}\n\n${generalInstructions ? `نصائح وإرشادات: ${generalInstructions}\n\n` : ''}نتمنى لكم دوام الصحة والعافية.`
  );
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

  // QR Code payload for digital verification
  const qrPayload = encodeURIComponent(
    `https://almada.eg/verify/rx?file=${patientFileNumber}&date=${appointmentDate}&doc=${encodeURIComponent(
      doctorName
    )}`
  );

  return (
    <div className="space-y-6">
      {/* Control Bar - Hidden when printing */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/clinical/${appointmentId}`}
            className="secondary-button inline-flex items-center text-xs py-2 px-3 text-slate-700"
          >
            ← العودة لملف الكشف
          </Link>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs font-semibold text-slate-700">
            الحالة: {isLocked ? '🔒 روشتة معتمدة نهائياً' : '📝 مسودة روشتة'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => setWithHeader(!withHeader)}
            className={`text-xs py-2 px-3 rounded-xl border font-semibold transition ${
              withHeader
                ? 'bg-teal-50 text-teal-900 border-teal-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {withHeader ? '✓ طباعة بترويسة العيادة' : '📄 وضع الورق المطبوع مسبقاً (بدون ترويسة)'}
          </button>

          {/* Send via WhatsApp */}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              title="إرسال بيانات الروشتة والأدوية للمريض مباشرة عبر واتساب"
            >
              <span>💬</span>
              <span>إرسال بالواتساب للمريض</span>
            </a>
          )}

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="primary-button inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
          >
            <span>🖨️</span>
            <span>طباعة أو حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* Official Prescription Paper (A5 / A4 Printable Sheet) */}
      <article
        id="prescription-sheet"
        dir="rtl"
        className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-md print:border-none print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: '800px' }}
      >
        {/* Prescription Header */}
        <div
          className={`border-b-2 border-slate-800 pb-5 transition-all ${
            withHeader ? 'block' : 'invisible print:hidden'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                Al-Mada Specialized Clinic
              </p>
              <h1 className="text-2xl font-black text-slate-900">{clinicName}</h1>
              <p className="mt-1 text-sm font-bold text-slate-800">{doctorName}</p>
              <p className="text-xs text-slate-600">{doctorTitle}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ترخيص مزاولة المهنة / نقابة الأطباء: <span dir="ltr">{licenseNumber}</span>
              </p>
            </div>

            <div className="text-left text-xs text-slate-600 space-y-1" dir="ltr">
              <p className="font-bold text-slate-900">Medical Prescription (روشتة علاجية)</p>
              <p>Hotline: 19888 · Cairo, Egypt</p>
              <p className="text-[11px] text-slate-500">Date: {appointmentDate}</p>
            </div>
          </div>
        </div>

        {/* Patient Details Stripe */}
        <section className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 print:bg-transparent print:border-slate-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">اسم المريض:</span>
              <strong className="text-slate-900 text-sm">{patientName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">رقم الملف:</span>
              <strong className="text-slate-900 font-mono text-sm">{patientFileNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">السن / النوع:</span>
              <strong className="text-slate-900">
                {age ? `${age} سنة` : 'غير محدد'} · {patientGender === 'female' ? 'أنثى' : 'ذكر'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">تاريخ الكشف:</span>
              <strong className="text-slate-900">{appointmentDate}</strong>
            </div>
          </div>

          {diagnosis && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">التشخيص الطبي (Diagnosis): </span>
              <strong className="text-teal-900 font-bold">{diagnosis}</strong>
            </div>
          )}
        </section>

        {/* Prescription Body (Rx) */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="text-3xl font-black font-serif text-teal-800 select-none">℞</span>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Prescribed Medications & Dosages
            </span>
          </div>

          {/* Medication Items */}
          {prescriptionItems.length > 0 ? (
            <ol className="divide-y divide-slate-100 space-y-3">
              {prescriptionItems.map((item, idx) => (
                <li key={idx} className="pt-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-900">
                          {idx + 1}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 font-sans tracking-tight" dir="ltr">
                          {item.medication_name}
                        </h3>
                        {item.form && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                            {item.form}
                          </span>
                        )}
                      </div>

                      {/* Dosage & Timing */}
                      <div className="mr-7 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800">
                        {item.dose && (
                          <span>
                            <strong className="text-slate-600">الجرعة:</strong> {item.dose}
                          </span>
                        )}
                        {item.frequency && (
                          <span>
                            <strong className="text-slate-600">التكرار:</strong> {item.frequency}
                          </span>
                        )}
                        {item.timing && (
                          <span className="rounded bg-emerald-50 text-emerald-900 px-1.5 py-0.5 border border-emerald-200 font-medium">
                            {item.timing}
                          </span>
                        )}
                        {item.duration && (
                          <span className="text-slate-500">
                            المدة: {item.duration}
                          </span>
                        )}
                      </div>

                      {/* Special Instructions */}
                      {item.instructions && (
                        <p className="mr-7 text-xs text-slate-600 italic">
                          ℹ️ {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
              لم يتم إدخال بنود أدوية مهيكلة لهذا الكشف بعد.
            </div>
          )}

          {/* General Lifestyle & Dietary Instructions */}
          {generalInstructions && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
              <p className="font-bold text-slate-800">نصائح وإرشادات عامة للمريض:</p>
              <p className="text-slate-700 whitespace-pre-wrap">{generalInstructions}</p>
            </div>
          )}
        </div>

        {/* Prescription Footer & Stamp Area */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-800 flex flex-wrap items-end justify-between gap-6 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-900">موعد الاستشارة القادمة (Re-visit):</p>
            <p className="text-slate-600">
              خلال 14 يوماً من تاريخ الكشف · يرجى إحضار الروشتة والفحوصات المطلوبة.
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              رقم التحقق الإلكتروني: RX-{appointmentId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* QR Code and Doctor Stamp */}
          <div className="flex items-center gap-6">
            {/* Verification QR Mockup */}
            <div className="text-center">
              <div className="h-16 w-16 bg-slate-900 text-white flex items-center justify-center p-1 rounded-lg">
                <span className="text-[9px] font-mono text-center leading-tight">
                  QR VERIFY
                  <br />
                  AL-MADA
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">امسح للتحقق</span>
            </div>

            {/* Doctor Signature & Stamp */}
            <div className="text-center w-36 border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">{doctorName}</p>
              <p className="text-[10px] text-slate-500">توقيع وخاتم الطبيب المعالج</p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
