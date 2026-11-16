import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/session';
import { SignOutButton } from '@/app/sign-out-button';
import { AttachmentLink } from './attachment-link';
import { PortalLinkRequest } from './link-request';

export const dynamic = 'force-dynamic';

type PortalPatient = {
  id: string; clinic_id: string; file_number: string; full_name: string;
  clinic_name: string; last_visit_at: string | null;
};
type PortalSnapshot = {
  patients: PortalPatient[];
  appointments: Array<{ id: string; date: string; time: string; status: string; clinic_name: string; doctor_name: string | null }>;
  records: Array<{ id: string; created_at: string; chief_complaint: string | null; diagnosis: string | null; treatment_plan: string | null; clinic_name: string; doctor_name: string | null }>;
  conditions: Array<{ id: string; name: string; status: string; diagnosed_at: string | null; source: string; clinic_name: string }>;
  allergies: Array<{ id: string; substance: string; reaction: string | null; severity: string | null; source: string; clinic_name: string }>;
  attachments: Array<{ id: string; file_name: string; mime_type: string; size_bytes: number; kind: string; created_at: string; clinic_name: string }>;
};

export default async function PatientPortalPage() {
  if (await isDemoSession() || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const demoSnapshot: PortalSnapshot = {
      patients: [
        {
          id: '33333333-3333-3333-3333-333333333331',
          clinic_id: '00000000-0000-0000-0000-000000000001',
          file_number: '000101',
          full_name: 'محمد إبراهيم حسن',
          clinic_name: 'عيادة المدى التخصصية',
          last_visit_at: new Date().toISOString(),
        },
      ],
      appointments: [
        {
          id: '44444444-4444-4444-4444-444444444441',
          date: new Date().toISOString().slice(0, 10),
          time: '10:00',
          status: 'confirmed',
          clinic_name: 'عيادة المدى التخصصية',
          doctor_name: 'د. أحمد مصطفى شريف',
        },
      ],
      records: [
        {
          id: '55555555-5555-5555-5555-555555555551',
          created_at: new Date().toISOString(),
          chief_complaint: 'المريض يعاني من إجهاد عام واضطراب في قراءات السكر.',
          diagnosis: 'داء السكري من النوع الثاني غير المنضبط جزئياً.',
          treatment_plan: '1. Metformin 1000mg قرص مرتين يومياً.\n2. المشي 30 دقيقة يومياً.',
          clinic_name: 'عيادة المدى التخصصية',
          doctor_name: 'د. أحمد مصطفى شريف',
        },
      ],
      conditions: [
        {
          id: 'cond-1',
          name: 'داء السكري (Type 2 Diabetes)',
          status: 'active',
          diagnosed_at: '2024-02-10',
          source: 'clinical',
          clinic_name: 'عيادة المدى التخصصية',
        },
      ],
      allergies: [
        {
          id: 'all-1',
          substance: 'Penicillin (بنسلين)',
          reaction: 'طفح جلدي وضيق تنفس',
          severity: 'high',
          source: 'patient_reported',
          clinic_name: 'عيادة المدى التخصصية',
        },
      ],
      attachments: [],
    };
    return (
      <PortalShell email="patient@example.com">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="ملفات مرتبطة بحسابك" value={demoSnapshot.patients.length} />
          <SummaryCard label="مواعيد مسجلة" value={demoSnapshot.appointments.length} />
          <SummaryCard label="زيارات موثقة" value={demoSnapshot.records.length} />
          <SummaryCard label="تقارير ومرفقات" value={demoSnapshot.attachments.length} />
        </section>

        <section id="records" className="portal-card">
          <SectionHeading title="ملفي الصحي (معاينة تجريبية)" note="نعرض السجلات التي اعتمدها الطبيب فقط، مع اسم العيادة وتاريخ الزيارة." />
          <ul className="divide-y divide-slate-100">
            {demoSnapshot.records.map((record) => (
              <li key={record.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{record.diagnosis || 'تشخيص عام'}</p>
                  <span className="text-xs text-slate-500">{record.clinic_name} · {record.doctor_name}</span>
                </div>
                {record.treatment_plan && <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap font-sans">{record.treatment_plan}</pre>}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/clinical/44444444-4444-4444-4444-444444444441/prescription"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition"
                  >
                    <span>💊</span>
                    <span>عرض وتحميل الروشتة الإلكترونية الرسمية (PDF)</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="appointments" className="portal-card">
          <SectionHeading title="مواعيدي القادمة" note="يمكنك مراجعة مواعيدك المحجوزة لدى العيادة." />
          <ul className="divide-y divide-slate-100">
            {demoSnapshot.appointments.map((a) => (
              <li key={a.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{a.clinic_name} — {a.doctor_name}</p>
                  <p className="text-xs text-slate-500">التاريخ: {a.date} الساعة {a.time}</p>
                </div>
                <span className="rounded-full bg-teal-100 text-teal-800 px-3 py-1 text-xs font-semibold">{a.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </PortalShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase.rpc('get_my_patient_portal_snapshot');
  if (error) {
    return <PortalShell email={user.email ?? ''}><Notice>تعذّر تحميل الملف الصحي الآن. حاول مرة أخرى لاحقًا.</Notice></PortalShell>;
  }
  const snapshot = (data ?? {}) as PortalSnapshot;
  const patients = snapshot.patients ?? [];
  const records = snapshot.records ?? [];
  const attachments = snapshot.attachments ?? [];
  const appointments = snapshot.appointments ?? [];
  const conditions = snapshot.conditions ?? [];
  const allergies = snapshot.allergies ?? [];

  return <PortalShell email={user.email ?? ''}>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="ملفات مرتبطة بحسابك" value={patients.length} />
      <SummaryCard label="مواعيد مسجلة" value={appointments.length} />
      <SummaryCard label="زيارات موثقة" value={records.length} />
      <SummaryCard label="تقارير ومرفقات" value={attachments.length} />
    </section>

    {patients.length === 0 && <section className="portal-card"><Notice>لا يوجد ملف مريض مرتبط بحسابك حتى الآن. أرسل طلب ربط؛ لن تظهر أي بيانات قبل مراجعة العيادة لهويتك واعتماده.</Notice><PortalLinkRequest /></section>}

    <section id="records" className="portal-card">
      <SectionHeading title="ملفي الصحي" note="نعرض السجلات التي اعتمدها الطبيب فقط، مع اسم العيادة وتاريخ الزيارة." />
      {records.length === 0 ? <Empty>لا توجد زيارات موثقة مرتبطة بحسابك.</Empty> : <div className="space-y-3">
        {records.map((record) => <article key={record.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{record.chief_complaint || 'زيارة طبية'}</h3><time className="text-xs text-slate-500">{formatDate(record.created_at)}</time></div>
          <p className="mt-1 text-sm text-slate-600">{record.clinic_name}{record.doctor_name ? ` · ${record.doctor_name}` : ''}</p>
          {record.diagnosis && <p className="mt-3 text-sm"><strong>التشخيص المسجل:</strong> {record.diagnosis}</p>}
          {record.treatment_plan && <p className="mt-2 whitespace-pre-wrap text-sm"><strong>الخطة المسجلة:</strong> {record.treatment_plan}</p>}
        </article>)}
      </div>}
    </section>

    <section id="reports" className="portal-card">
      <SectionHeading title="التحاليل والأشعة والمرفقات" note="التقارير محفوظة في مساحة خاصة. روابط العرض مؤقتة وتُنشأ بعد التحقق من صلاحيتك." />
      {attachments.length === 0 ? <Empty>لا توجد تقارير أو مرفقات مرتبطة بملفك.</Empty> : <ul className="divide-y divide-slate-100">
        {attachments.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="min-w-0"><p className="break-words font-medium">{file.file_name}</p><p className="mt-1 text-xs text-slate-500">{fileKind(file.kind)} · {file.clinic_name} · {formatDate(file.created_at)} · {formatSize(file.size_bytes)}</p></div>
          <AttachmentLink id={file.id} fileName={file.file_name} />
        </li>)}
      </ul>}
    </section>

    <section id="conditions" className="grid gap-4 lg:grid-cols-2">
      <div className="portal-card"><SectionHeading title="الحالات المسجلة" note="يظهر مصدر المعلومة لتمييز ما أدخله الطبيب عما استُخرج أو استورد." />{conditions.length === 0 ? <Empty>لا توجد حالات مسجلة.</Empty> : <ul className="space-y-3">{conditions.map((condition) => <li key={condition.id} className="rounded-lg bg-slate-50 p-3"><p className="font-medium">{condition.name}</p><p className="mt-1 text-xs text-slate-500">{condition.clinic_name} · {condition.status}{condition.diagnosed_at ? ` · ${formatDate(condition.diagnosed_at)}` : ''}</p><p className="mt-1 text-xs text-slate-500">المصدر: {sourceLabel(condition.source)}</p></li>)}</ul>}</div>
      <div className="portal-card"><SectionHeading title="الحساسية المسجلة" note="المعلومة كما سجلتها العيادة، راجع طبيبك للتأكد من حداثتها." />{allergies.length === 0 ? <Empty>لا توجد حساسية مسجلة.</Empty> : <ul className="space-y-3">{allergies.map((allergy) => <li key={allergy.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="font-semibold">{allergy.substance}{allergy.severity ? ` · ${allergy.severity}` : ''}</p>{allergy.reaction && <p className="mt-1 text-sm">رد الفعل المسجل: {allergy.reaction}</p>}<p className="mt-1 text-xs text-slate-600">{allergy.clinic_name} · المصدر: {sourceLabel(allergy.source)}</p></li>)}</ul>}</div>
    </section>

    <section id="appointments" className="portal-card">
      <SectionHeading title="مواعيدي" />
      {appointments.length === 0 ? <Empty>لا توجد مواعيد مسجلة.</Empty> : <ul className="divide-y divide-slate-100">{appointments.map((appointment) => <li key={appointment.id} className="flex flex-wrap justify-between gap-2 py-3"><div><p className="font-medium">{appointment.clinic_name}{appointment.doctor_name ? ` · ${appointment.doctor_name}` : ''}</p><p className="text-sm text-slate-500">{appointment.status}</p></div><time className="text-sm text-slate-600">{formatDate(appointment.date)} · {String(appointment.time).slice(0, 5)}</time></li>)}</ul>}
    </section>

    {patients.length > 0 && <section id="privacy" className="portal-card"><SectionHeading title="ربط ملف آخر" note="إذا كنت تراجع عيادة أخرى، أرسل طلبًا مستقلًا. كل عيادة تتحقق من الهوية قبل إتاحة سجلها لك." /><PortalLinkRequest /></section>}

    <section className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
      <h2 className="font-semibold text-teal-950">اكتشاف الرعاية والعروض</h2>
      <p className="mt-1 text-sm text-teal-900">دليل الأطباء والعيادات والمعامل والأشعة والعروض المعلنة سيظهر هنا بعد استكمال التحقق من الجهات وإعداد ضوابط الخصوصية.</p>
    </section>
  </PortalShell>;
}

function PortalShell({ email, children }: { email: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8" dir="rtl"><div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="eyebrow">المدى · بوابة المريض</p><h1 className="text-2xl font-bold">ملفي الصحي</h1><p className="mt-1 text-sm text-slate-600">{email}</p></div><SignOutButton /></header>
    <nav aria-label="أقسام بوابة المريض" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 text-sm"><a className="nav-chip" href="#records">ملفي الصحي</a><a className="nav-chip" href="#reports">التحاليل والأشعة</a><a className="nav-chip" href="#conditions">الحساسية والحالات</a><a className="nav-chip" href="#appointments">المواعيد</a><a className="nav-chip" href="#privacy">ربط ملف آخر</a></nav>
    {children}
    <footer className="px-2 pb-4 text-xs leading-6 text-slate-500">هذه البوابة تعرض ما ربطته العيادات بحسابك. قد تكون المعلومات غير مكتملة أو قديمة؛ لا تعتمد عليها وحدها في قرار علاجي أو طارئ.</footer>
  </div></main>;
}

function SummaryCard({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>; }
function SectionHeading({ title, note }: { title: string; note?: string }) { return <div className="mb-4"><h2 className="text-lg font-bold">{title}</h2>{note && <p className="mt-1 text-sm text-slate-600">{note}</p>}</div>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{children}</p>; }
function Notice({ children }: { children: React.ReactNode }) { return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{children}</div>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ar-EG'); }
function formatSize(size: number) { if (!Number.isFinite(size) || size <= 0) return 'حجم غير محدد'; return size < 1_000_000 ? `${Math.round(size / 1000)} كيلوبايت` : `${(size / 1_000_000).toFixed(1)} ميجابايت`; }
function fileKind(kind: string) { const value = kind.toLowerCase(); if (value.includes('lab') || value.includes('analysis')) return 'تحليل'; if (value.includes('image') || value.includes('radiology')) return 'أشعة'; return 'مرفق طبي'; }
function sourceLabel(source: string) { const labels: Record<string, string> = { doctor_input: 'أدخله الطبيب', extracted: 'مستخرج من مستند', ai_inferred: 'استنتاج آلي يحتاج تأكيد الطبيب', imported: 'مستورد ويحتاج مراجعة المصدر' }; return labels[source] ?? 'غير محدد'; }
