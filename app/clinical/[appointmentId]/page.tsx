import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getAppointment } from '@/lib/appointments';
import { getMedicalRecordByAppointment, listMedicalRecordsForPatient } from '@/lib/medical-records';
import { ConsultationForm } from '../consultation-form';

export const dynamic = 'force-dynamic';

export default async function ClinicalConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const appointment = await getAppointment(appointmentId);
  if (!appointment) notFound();

  const [existingRecord, pastRecords] = await Promise.all([
    getMedicalRecordByAppointment(appointmentId),
    listMedicalRecordsForPatient(appointment.patient_id),
  ]);

  const otherRecords = pastRecords.filter((r) => r.appointment_id !== appointmentId);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Link href="/appointments" className="text-teal-800 hover:underline">
                  المواعيد
                </Link>
                <span>/</span>
                <span>جلسة كشف طبي</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                جلسة الكشف الطبي · {appointment.patient_name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                ملف رقم: <strong>{appointment.patient_file_number}</strong> · الطبيب:{' '}
                <strong>{appointment.doctor_name}</strong> · توقيت الموعد:{' '}
                {appointment.appointment_date} ({String(appointment.appointment_time).slice(0, 5)})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/clinical/${appointment.id}/prescription`}
                className="primary-button inline-flex items-center gap-1.5 text-xs py-2 px-3 shadow-xs"
              >
                <span>💊</span>
                <span>الروشتة الإلكترونية وطباعتها</span>
              </Link>
              <Link
                href={`/billing/new?appointment_id=${appointment.id}&patient_id=${appointment.patient_id}`}
                className="secondary-button inline-flex items-center text-xs py-2 px-3"
              >
                🧾 إصدار فاتورة / كاشير
              </Link>
              <Link
                href={`/patients/${appointment.patient_id}`}
                className="secondary-button inline-flex items-center text-xs py-2 px-3"
              >
                الملف الكامل للمريض
              </Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Consultation Form (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <ConsultationForm
              patientId={appointment.patient_id}
              doctorId={appointment.doctor_id}
              appointmentId={appointment.id}
              existingRecord={existingRecord}
              patientName={appointment.patient_name || 'مريض'}
              doctorName={appointment.doctor_name || 'طبيب'}
            />
          </div>

          {/* Past Clinical History Sidebar (1 Column) */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                سجل الزيارات السابقة ({otherRecords.length})
              </h3>

              {otherRecords.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  هذه أول زيارة طبية موثقة لهذا المريض في العيادة.
                </p>
              ) : (
                <div className="space-y-3">
                  {otherRecords.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{rec.chief_complaint || 'كشف طبي'}</span>
                        <time className="text-slate-400 font-normal">
                          {new Date(rec.created_at).toLocaleDateString('ar-EG')}
                        </time>
                      </div>
                      {rec.diagnosis && (
                        <p className="text-slate-700">
                          <strong>التشخيص:</strong> {rec.diagnosis}
                        </p>
                      )}
                      {rec.treatment_plan && (
                        <p className="text-slate-600 line-clamp-2">
                          <strong>العلاج:</strong> {rec.treatment_plan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
