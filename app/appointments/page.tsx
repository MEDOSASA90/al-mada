import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listAppointmentsForDate } from '@/lib/appointments';
import { listPatients } from '@/lib/patients';
import { listDoctors, listBranches } from '@/lib/staff';
import { AppointmentForm } from './appointment-form';
import { AppointmentStatusButtons } from './appointment-status-button';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; doctor_id?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { date, doctor_id } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;

  const [rawAppointments, patients, doctors, branches] = await Promise.all([
    listAppointmentsForDate(selectedDate),
    listPatients({ limit: 100 }),
    listDoctors(),
    listBranches(),
  ]);

  const appointments = doctor_id
    ? rawAppointments.filter((a) => a.doctor_id === doctor_id)
    : rawAppointments;

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    waiting: appointments.filter((a) => a.status === 'waiting').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    canceled: appointments.filter((a) => a.status === 'canceled' || a.status === 'no_show').length,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm text-teal-800 hover:underline">← لوحة العيادة</Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">جدول المواعيد</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">إدارة المواعيد والكشوفات</h1>
            <p className="mt-1 text-sm text-slate-600">جدول الزيارات والحجوزات اليومية للعيادة.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/queue" className="secondary-button inline-flex items-center text-sm">
              طابور الانتظار
            </Link>
            <Link href="/patients" className="secondary-button inline-flex items-center text-sm">
              سجل المرضى
            </Link>
          </div>
        </header>

        {/* Date Selector & Stats */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <form action="/appointments" method="GET" className="flex flex-wrap items-center gap-2">
              <label htmlFor="date-input" className="text-sm font-medium text-slate-700">التاريخ:</label>
              <input
                id="date-input"
                type="date"
                name="date"
                defaultValue={selectedDate}
                className="field text-sm py-1.5 px-3 w-auto"
              />
              <label htmlFor="doc-input" className="text-sm font-medium text-slate-700 mr-2">الطبيب:</label>
              <select
                id="doc-input"
                name="doctor_id"
                defaultValue={doctor_id || ''}
                className="field text-sm py-1.5 px-3 w-auto"
              >
                <option value="">كل الأطباء</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
              <button type="submit" className="primary-button text-sm py-1.5 px-3">
                تصفية
              </button>
              {doctor_id && (
                <Link
                  href={`/appointments?date=${selectedDate}`}
                  className="secondary-button text-xs py-1.5 px-2"
                >
                  إلغاء تصفية الطبيب
                </Link>
              )}
            </form>

            <div className="flex items-center gap-2 text-xs">
              <Link
                href={`/appointments?date=${today}${doctor_id ? `&doctor_id=${doctor_id}` : ''}`}
                className={`rounded-lg px-3 py-1.5 font-medium border ${
                  selectedDate === today ? 'bg-teal-800 text-white border-teal-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                اليوم
              </Link>
              <Link
                href={`/appointments?date=${getNextDate(today, 1)}${doctor_id ? `&doctor_id=${doctor_id}` : ''}`}
                className={`rounded-lg px-3 py-1.5 font-medium border ${
                  selectedDate === getNextDate(today, 1) ? 'bg-teal-800 text-white border-teal-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                غداً
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs">
              <p className="text-xs text-slate-500">إجمالي المواعيد</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4 shadow-xs">
              <p className="text-xs text-emerald-800">مؤكدة</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">{stats.confirmed}</p>
            </div>
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4 shadow-xs">
              <p className="text-xs text-blue-800">في الانتظار</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{stats.waiting}</p>
            </div>
            <div className="rounded-xl bg-purple-50/70 border border-purple-100 p-4 shadow-xs">
              <p className="text-xs text-purple-800">تم الكشف</p>
              <p className="mt-1 text-2xl font-bold text-purple-950">{stats.completed}</p>
            </div>
            <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-4 shadow-xs">
              <p className="text-xs text-rose-800">ملغية / لم يحضر</p>
              <p className="mt-1 text-2xl font-bold text-rose-950">{stats.canceled}</p>
            </div>
          </div>
        </section>

        {/* Booking Form Component */}
        <AppointmentForm
          patients={patients}
          doctors={doctors}
          branches={branches}
          defaultDate={selectedDate}
        />

        {/* Appointments List for the day */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              قائمة المواعيد ({formatDateArabic(selectedDate)})
            </h2>
            <span className="text-xs text-slate-500">{appointments.length} موعد</span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">لا توجد مواعيد مسجلة في هذا اليوم.</p>
              <p className="mt-1 text-xs text-slate-400">استخدم نموذج الحجز أعلاه لتسجيل موعد جديد.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <div key={a.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 text-center shrink-0">
                      <span className="block text-sm font-bold text-teal-900" dir="ltr">
                        {String(a.appointment_time).slice(0, 5)}
                      </span>
                      <span className="block text-[11px] text-teal-700">{a.duration_minutes} د</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${a.patient_id}`}
                          className="font-semibold text-slate-900 hover:text-teal-800 truncate"
                        >
                          {a.patient_name}
                        </Link>
                        <span className="text-xs text-slate-400">({a.patient_file_number})</span>
                        <StatusBadge status={a.status} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>الطبيب: <strong className="text-slate-700">{a.doctor_name}</strong></span>
                        <span>{a.branch_name}</span>
                        <span>{visitTypeLabel(a.visit_type)}</span>
                        {a.patient_phone && <span dir="ltr">{a.patient_phone}</span>}
                      </div>

                      {a.reason && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                          الشكوى: {a.reason}
                        </p>
                      )}

                      {a.cancel_reason && (
                        <p className="mt-2 text-xs text-rose-700 bg-rose-50 rounded-lg p-2 border border-rose-100">
                          سبب الإلغاء: {a.cancel_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {a.patient_phone && (
                      <a
                        href={`https://wa.me/${(a.patient_phone.replace(/[^0-9]/g, '').startsWith('0') ? '2' : '') + a.patient_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `عزيزنا المريض ${a.patient_name}، نود تذكيركم بموعد كشفكم في عيادة المدى يوم ${a.appointment_date} الساعة ${String(a.appointment_time).slice(0, 5)} مع ${a.doctor_name}. برجاء الحضور قبل الموعد بـ 10 دقائق.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                        title="إرسال رسالة تذكير بالموعد للمريض عبر واتساب"
                      >
                        <span>💬</span>
                        <span>تذكير واتساب</span>
                      </a>
                    )}
                    <AppointmentStatusButtons
                      appointmentId={a.id}
                      currentStatus={a.status}
                      appointmentDate={a.appointment_date}
                      appointmentTime={a.appointment_time}
                      patientName={a.patient_name ?? 'المريض'}
                    />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    booked: 'bg-slate-100 text-slate-700',
    confirmed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    waiting: 'bg-blue-50 text-blue-800 border border-blue-200',
    in_progress: 'bg-amber-50 text-amber-900 border border-amber-200',
    completed: 'bg-purple-50 text-purple-900 border border-purple-200',
    canceled: 'bg-rose-50 text-rose-800 border border-rose-200',
    no_show: 'bg-rose-50 text-rose-800 border border-rose-200',
  };

  const labels: Record<string, string> = {
    booked: 'محجوز',
    confirmed: 'مؤكد',
    waiting: 'في الانتظار',
    in_progress: 'جاري الكشف',
    completed: 'تم الكشف',
    canceled: 'ملغي',
    no_show: 'لم يحضر',
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.booked}`}>
      {labels[status] ?? status}
    </span>
  );
}

function visitTypeLabel(type: string) {
  const labels: Record<string, string> = {
    clinic: 'كشف بالعيادة',
    telemedicine: 'استشارة عن بُعد',
    home: 'زيارة منزلية',
    emergency: 'طوارئ',
  };
  return labels[type] ?? type;
}

function getNextDate(dateStr: string, daysOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function formatDateArabic(dateStr: string): string {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
