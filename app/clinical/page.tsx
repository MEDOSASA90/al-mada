import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listAppointmentsForDate } from '@/lib/appointments';

export const dynamic = 'force-dynamic';

export default async function ClinicalHubPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  const isDoctor = membership.role === 'doctor' || membership.role === 'visiting_doctor';
  const isOwner = ['clinic_owner', 'clinic_admin'].includes(membership.role);

  if (!isDoctor && !isOwner) {
    redirect('/');
  }

  const today = new Date().toISOString().slice(0, 10);
  const rawAppointments = await listAppointmentsForDate(today);
  const appointments = isDoctor && !isOwner
    ? rawAppointments.filter((a) => a.doctor_id === session.user.id)
    : rawAppointments;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="text-teal-800 hover:underline">
                ← لوحة العيادة
              </Link>
              <span>/</span>
              <span>العيادة الطبية</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              جلسات الكشف الطبي والروشتات الإلكترونية
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              قائمة مواعيد اليوم المؤكدة وجاهزة للكشف الطبي والتشخيص وإصدار الروشتة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/queue" className="secondary-button text-xs py-2 px-3">
              شاشة طابور الانتظار
            </Link>
          </div>
        </header>

        {/* Appointments Ready for Clinical Consultation */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-sm">
              مواعيد اليوم الجاهزة للكشف ({appointments.length})
            </h2>
            <span className="text-xs text-slate-500">تاريخ اليوم: {today}</span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              لا توجد كشوفات مسجلة لليوم حتى الآن.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{appt.patient_name}</h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        ملف #{appt.patient_file_number}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        appt.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                        appt.status === 'waiting' ? 'bg-teal-100 text-teal-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {appt.status === 'in_progress' ? 'بالعيادة الآن' :
                         appt.status === 'waiting' ? 'في الانتظار' : appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      الطبيب المعالج: <strong>{appt.doctor_name}</strong> · توقيت الموعد: <strong>{appt.appointment_time}</strong>
                    </p>
                    {appt.reason && (
                      <p className="text-xs text-slate-500">
                        سبب الزيارة: {appt.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/clinical/${appt.id}`}
                      className="primary-button text-xs py-2 px-3 inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <span>🩺</span>
                      <span>جلسة الكشف</span>
                    </Link>
                    <Link
                      href={`/clinical/${appt.id}/prescription`}
                      className="secondary-button text-xs py-2 px-3 inline-flex items-center gap-1.5"
                    >
                      <span>💊</span>
                      <span>الروشتة</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
