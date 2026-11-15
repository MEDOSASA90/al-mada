import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getPatient } from '@/lib/patients';
import { listMedicalRecordsForPatient } from '@/lib/medical-records';
import { PatientEditForm } from '../patient-edit-form';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect('/login');
  const patient = await getPatient(id);
  if (!patient || patient.deleted_at) notFound();

  const records = await listMedicalRecordsForPatient(id);

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/patients" className="text-sm text-teal-800 hover:underline">
                ← سجل المرضى
              </Link>
              <p className="eyebrow mt-2">ملف المريض · {patient.file_number}</p>
              <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
              <p className="mt-1 text-xs text-slate-500">
                أُنشئ الملف في {new Date(patient.created_at).toLocaleDateString('ar-EG')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/appointments`}
                className="secondary-button text-xs py-2 px-3"
              >
                📅 حجز موعد
              </Link>
              <Link
                href={`/billing/new?patient_id=${patient.id}`}
                className="secondary-button text-xs py-2 px-3"
              >
                🧾 إصدار فاتورة
              </Link>
            </div>
          </div>
        </header>

        {/* Edit Demographic Form */}
        <PatientEditForm patient={patient} />

        {/* Clinical History & Consultations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              السجل الطبي والزيارات السابقة ({records.length})
            </h2>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">
              لا توجد كشوفات أو زيارات مسجلة لهذا المريض بعد.
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <article
                  key={rec.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-2 hover:bg-slate-50/50 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {rec.chief_complaint || 'كشف طبي'}
                      </h3>
                      {rec.doctor_name && (
                        <p className="text-xs text-slate-500 mt-0.5">الطبيب المعالج: {rec.doctor_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rec.is_locked ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.is_locked ? 'معتمد ومقفل' : 'مسودة'}
                      </span>
                      <time className="text-xs text-slate-400">
                        {new Date(rec.created_at).toLocaleDateString('ar-EG')}
                      </time>
                    </div>
                  </div>

                  {rec.diagnosis && (
                    <p className="text-xs text-slate-700">
                      <strong>التشخيص:</strong> {rec.diagnosis}
                    </p>
                  )}
                  {rec.treatment_plan && (
                    <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>الروشتة / الخطة:</strong> {rec.treatment_plan}
                    </p>
                  )}
                  {rec.appointment_id && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-2">
                      <Link
                        href={`/clinical/${rec.appointment_id}/prescription`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition"
                      >
                        <span>💊</span>
                        <span>عرض وطباعة الروشتة الإلكترونية (PDF)</span>
                      </Link>
                      <Link
                        href={`/clinical/${rec.appointment_id}`}
                        className="text-xs text-slate-600 font-semibold hover:underline"
                      >
                        تفاصيل الكشف الطبي ←
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
