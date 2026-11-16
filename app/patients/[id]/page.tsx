import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getPatient } from '@/lib/patients';
import { listMedicalRecordsForPatient } from '@/lib/medical-records';
import { listInvoicesForPatient } from '@/lib/billing';
import { PatientEditForm } from '../patient-edit-form';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect('/login');
  const patient = await getPatient(id);
  if (!patient || patient.deleted_at) notFound();

  const [records, invoices] = await Promise.all([
    listMedicalRecordsForPatient(id),
    listInvoicesForPatient(id),
  ]);

  const isDoctor = session.membership.role === 'doctor' || session.membership.role === 'visiting_doctor';
  const isOwner = session.membership.role === 'clinic_owner' || session.membership.role === 'clinic_admin';
  const canViewClinical = isDoctor || isOwner;

  // WhatsApp link preparation
  const cleanPhone = patient.phone ? patient.phone.replace(/[^0-9]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const waGreeting = encodeURIComponent(`أهلاً بك أستاذ ${patient.full_name}، نتواصل معك من عيادة المدى التخصصية.`);
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waGreeting}` : null;

  // Financial summary
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paid_total) || 0), 0);
  const balanceDue = Math.max(0, totalBilled - totalPaid);

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Profile */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Link href="/patients" className="text-teal-800 hover:underline">
                  ← سجل المرضى
                </Link>
                <span>/</span>
                <span>الملف الطبي #{patient.file_number}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>رقم الهاتف: <strong dir="ltr" className="text-slate-800">{patient.phone}</strong></span>
                {patient.gender && (
                  <span>النوع: {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : 'آخر'}</span>
                )}
                {patient.birth_date && (
                  <span>الميلاد: {patient.birth_date}</span>
                )}
                <span>تاريخ فتح الملف: {new Date(patient.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  <span>💬</span>
                  <span>مراسلة واتساب</span>
                </a>
              )}
              <Link
                href={`/appointments`}
                className="secondary-button text-xs py-2 px-3"
              >
                📅 حجز كشف
              </Link>
              <Link
                href={`/billing`}
                className="secondary-button text-xs py-2 px-3"
              >
                🧾 إصدار فاتورة
              </Link>
            </div>
          </div>

          {/* Quick Snapshot KPIs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-5">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <span className="block text-xs text-slate-500">عدد الزيارات والكشوفات</span>
              <span className="mt-1 block text-xl font-bold text-slate-900">{records.length} زيارة</span>
            </div>
            <div className="rounded-xl bg-teal-50/60 p-3.5 border border-teal-100">
              <span className="block text-xs text-teal-800">إجمالي الفواتير</span>
              <span className="mt-1 block text-xl font-bold text-teal-950">{totalBilled.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <div className="rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-100">
              <span className="block text-xs text-emerald-800">المسدد فعلياً</span>
              <span className="mt-1 block text-xl font-bold text-emerald-950">{totalPaid.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <div className={`rounded-xl p-3.5 border ${
              balanceDue > 0 ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
            }`}>
              <span className="block text-xs">المتبقي على المريض</span>
              <span className="mt-1 block text-xl font-bold">
                {balanceDue > 0 ? `${balanceDue.toLocaleString('ar-EG')} ج.م` : 'خالص بالكامل ✓'}
              </span>
            </div>
          </div>
        </header>

        {/* Section 1: Clinical History & Medical Records (with Egyptian Law 151/2020 privacy enforcement) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                السجل الطبي والتشخيصات السابقة ({records.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تاريخ الاستشارات الطبية والأعراض وخطة العلاج لكل زيارة.
              </p>
            </div>
            {!canViewClinical && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-900">
                <span>🔒</span>
                <span>التشخيصات محجوبة عن الاستقبال (قانون 151/2020)</span>
              </span>
            )}
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 p-5 rounded-xl text-center">
              لا توجد كشوفات أو زيارات طبية مسجلة لهذا المريض حتى الآن.
            </p>
          ) : (
            <div className="space-y-4">
              {records.map((rec) => (
                <article
                  key={rec.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 hover:bg-slate-50/40 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {rec.chief_complaint || 'كشف واستشارة طبية'}
                      </h3>
                      {rec.doctor_name && (
                        <p className="text-xs text-teal-800 font-medium mt-0.5">
                          الطبيب المعالج: {rec.doctor_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        rec.is_locked ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {rec.is_locked ? 'معتمد ومقفل' : 'مسودة'}
                      </span>
                      <time className="text-xs text-slate-400">
                        {new Date(rec.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </time>
                    </div>
                  </div>

                  {/* Vitals signs if present and clinical access permitted */}
                  {canViewClinical && rec.vitals && Object.keys(rec.vitals).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">العلامات الحيوية:</span>
                      {rec.vitals.blood_pressure && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          الضغط: <strong>{rec.vitals.blood_pressure}</strong>
                        </span>
                      )}
                      {rec.vitals.heart_rate && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          النبض: <strong>{rec.vitals.heart_rate} bpm</strong>
                        </span>
                      )}
                      {rec.vitals.temperature && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          الحرارة: <strong>{rec.vitals.temperature} °C</strong>
                        </span>
                      )}
                      {rec.vitals.weight && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          الوزن: <strong>{rec.vitals.weight} كجم</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Clinical Diagnosis (Protected) */}
                  {canViewClinical ? (
                    <>
                      {rec.diagnosis && (
                        <p className="text-xs text-slate-800 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                          <strong>التشخيص الطبي:</strong> {rec.diagnosis}
                        </p>
                      )}
                      {rec.treatment_plan && (
                        <div className="text-xs text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <strong>الخطة العلاجية والتعليمات:</strong>
                          <p className="mt-1">{rec.treatment_plan}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200 flex items-center gap-2">
                      <span>🔒</span>
                      <span>
                        تفاصيل التشخيص والروشتة محجوبة عن موظف الاستقبال لحماية سرية المريض (قانون حماية البيانات الشخصية المصري 151/2020).
                      </span>
                    </div>
                  )}

                  {/* Quick Prescription & Details Link */}
                  {rec.appointment_id && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <Link
                        href={`/clinical/${rec.appointment_id}/prescription`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition shadow-xs"
                      >
                        <span>💊</span>
                        <span>عرض وطباعة الروشتة الإلكترونية (PDF)</span>
                      </Link>
                      {canViewClinical && (
                        <Link
                          href={`/clinical/${rec.appointment_id}`}
                          className="text-xs text-teal-800 font-semibold hover:underline"
                        >
                          تعديل أو استكمال الكشف الطبي ←
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Patient Invoices & Billing History */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                الفواتير والمدفوعات ({invoices.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                سجل الفواتير الصادرة وسداد الكشوفات ومتابعة الحساب المالي.
              </p>
            </div>
            <Link
              href="/billing"
              className="text-xs text-teal-800 font-semibold hover:underline"
            >
              شاشة الكاشير العامة ←
            </Link>
          </div>

          {invoices.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl text-center">
              لا توجد فواتير سابقة مسجلة لهذا المريض.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-semibold text-slate-900">
                        فاتورة #{inv.invoice_number}
                      </strong>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة بالكامل' : inv.status === 'partially_paid' ? 'مسددة جزئياً' : 'مستحقة'}
                      </span>
                    </div>
                    <time className="text-xs text-slate-400 block mt-0.5">
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('ar-EG') : 'اليوم'}
                    </time>
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold text-slate-900">
                      {Number(inv.total).toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className="block text-xs text-emerald-700">
                      المسدد: {Number(inv.paid_total).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Demographic Edit Form */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">تعديل بيانات المريض وإدارة الملف</h2>
          <PatientEditForm patient={patient} />
        </section>
      </div>
    </main>
  );
}
