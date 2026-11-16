import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/session';
import { SignOutButton } from '@/app/sign-out-button';
import { AttachmentLink } from './attachment-link';
import { PortalLinkRequest } from './link-request';
import {
  HEALTHCARE_PARTNERS,
  ACTIVE_MEDICAL_OFFERS,
  HEALTHCARE_ADS,
  RECOMMENDED_DOCTORS,
  PartnerCategory,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

type PortalPatient = {
  id: string;
  clinic_id: string;
  file_number: string;
  full_name: string;
  clinic_name: string;
  last_visit_at: string | null;
  blood_type?: string;
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
  const isDemo = await isDemoSession() || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let snapshot: PortalSnapshot;
  let userEmail = 'patient@example.com';

  if (isDemo) {
    snapshot = {
      patients: [
        {
          id: '33333333-3333-3333-3333-333333333331',
          clinic_id: '00000000-0000-0000-0000-000000000001',
          file_number: '000101',
          full_name: 'محمد إبراهيم حسن',
          clinic_name: 'عيادة المدى التخصصية',
          last_visit_at: new Date().toISOString(),
          blood_type: 'A+',
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
          treatment_plan: '1. Metformin 1000mg قرص مرتين يومياً مع وجبات الطعام.\n2. فحص السكر التراكمي دورياً كل 3 أشهر.\n3. المشي 30 دقيقة يومياً وتجنب السكريات البسيطة.',
          clinic_name: 'عيادة المدى التخصصية',
          doctor_name: 'د. أحمد مصطفى شريف',
        },
      ],
      conditions: [
        {
          id: 'cond-1',
          name: 'داء السكري (Type 2 Diabetes Mellitus)',
          status: 'active',
          diagnosed_at: '2024-02-10',
          source: 'clinical',
          clinic_name: 'عيادة المدى التخصصية',
        },
        {
          id: 'cond-2',
          name: 'ارتفاع طفيف في ضغط الدم (Borderline Hypertension)',
          status: 'monitoring',
          diagnosed_at: '2024-05-18',
          source: 'clinical',
          clinic_name: 'عيادة الباطنة الموحدة',
        },
      ],
      allergies: [
        {
          id: 'all-1',
          substance: 'Penicillin (بنسلين ومشتقاته)',
          reaction: 'صدمة حساسية شديدة وطفح جلدي وضيق تنفس (Anaphylaxis Risk)',
          severity: 'high',
          source: 'patient_reported',
          clinic_name: 'عيادة المدى التخصصية',
        },
        {
          id: 'all-2',
          substance: 'Sulfa Drugs (مركبات السلفا)',
          reaction: 'حكة جلدية وتورم بالعينين',
          severity: 'moderate',
          source: 'clinical',
          clinic_name: 'عيادة الصدر والحساسية',
        },
      ],
      attachments: [
        {
          id: 'att-1',
          file_name: 'تقرير_تحليل_سكر_تراكمي_HbA1c_المختبر.pdf',
          mime_type: 'application/pdf',
          size_bytes: 345000,
          kind: 'lab_report',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          clinic_name: 'معامل المختبر المعتمدة',
        },
        {
          id: 'att-2',
          file_name: 'أشعة_سونار_البطن_والحوض_كايرو_سكان.pdf',
          mime_type: 'application/pdf',
          size_bytes: 820000,
          kind: 'radiology_report',
          created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
          clinic_name: 'كايرو سكان للأشعة',
        },
      ],
    };
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    userEmail = user.email ?? '';

    const { data, error } = await supabase.rpc('get_my_patient_portal_snapshot');
    if (error) {
      return (
        <PortalShell email={userEmail}>
          <Notice>تعذّر تحميل الملف الصحي الآن. حاول مرة أخرى لاحقًا.</Notice>
        </PortalShell>
      );
    }
    snapshot = (data ?? {}) as PortalSnapshot;
  }

  const patients = snapshot.patients ?? [];
  const records = snapshot.records ?? [];
  const attachments = snapshot.attachments ?? [];
  const appointments = snapshot.appointments ?? [];
  const conditions = snapshot.conditions ?? [];
  const allergies = snapshot.allergies ?? [];
  const primaryPatient = patients[0] || null;

  return (
    <PortalShell email={userEmail}>
      {/* Overview Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="ملفات مرتبطة بحسابك" value={patients.length} icon="📁" />
        <SummaryCard label="مواعيد مسجلة" value={appointments.length} icon="🗓️" />
        <SummaryCard label="زيارات موثقة" value={records.length} icon="🩺" />
        <SummaryCard label="تقارير ومعامل وأشعة" value={attachments.length} icon="📑" />
      </section>

      {/* 1. Universal Patient Safety Card & Passport (جواز السفر الصحي وكارت سلامة المريض الموحد) */}
      <section id="safety-card" className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl">
        <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>جواز السفر الطبي الذكي · كارت أمان المريض الموحد</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {primaryPatient?.full_name || 'ملف المريض الموحد'}
            </h2>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-2xl">
              كارت الأمان الدوائي الموحد عبر شبكة المدى: تشارك المنصة تلقائياً معلومات السلامة الحرجة (الحساسيات الدوائية المهددة للحياة، الأمراض المزمنة، وفصيلة الدم) مع أي طبيب مرخص بالشبكة يقوم بالكشف عليك لحمايتك الفورية من التداخلات الدوائية الممنوعة والقاتلة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider">فصيلة الدم</p>
              <p className="text-2xl font-black text-rose-400">{primaryPatient?.blood_type || 'A+'}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider">رقم الهوية الطبية</p>
              <p className="text-sm font-mono font-bold text-emerald-300">{primaryPatient?.file_number || 'MED-000101'}</p>
            </div>
            <div className="rounded-xl bg-white p-2 text-center text-slate-900 shadow-md">
              <div className="h-14 w-14 flex items-center justify-center bg-slate-100 rounded text-xl border border-slate-300 font-mono">
                📱 QR
              </div>
              <p className="text-[9px] font-bold text-slate-600 mt-0.5">فحص الطوارئ</p>
            </div>
          </div>
        </div>

        {/* Safety Badges Ribbon */}
        <div className="mt-6 pt-5 border-t border-emerald-500/20 grid gap-4 md:grid-cols-2">
          {/* Critical Allergies */}
          <div className="rounded-xl bg-rose-950/40 border border-rose-500/40 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span>⛔</span>
                <span>الحساسيات الدوائية والغذائية المحظورة</span>
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full font-mono">
                {allergies.length} تنبيهات نشطة
              </span>
            </div>
            {allergies.length === 0 ? (
              <p className="text-xs text-rose-200/70">لم تسجل أي حساسية دوائية حتى الآن.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((all) => (
                  <div key={all.id} className="rounded-lg bg-rose-900/60 border border-rose-500/50 px-2.5 py-1 text-xs">
                    <span className="font-bold text-white">{all.substance}</span>
                    {all.severity === 'high' && (
                      <span className="mr-1.5 rounded bg-rose-600 px-1 py-0.2 text-[9px] font-bold text-white">حرج</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div className="rounded-xl bg-teal-950/40 border border-teal-500/40 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <span>🩺</span>
                <span>الأمراض المزمنة المسجلة بالشبكة</span>
              </span>
              <span className="text-[10px] bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                {conditions.length} حالات
              </span>
            </div>
            {conditions.length === 0 ? (
              <p className="text-xs text-teal-200/70">لا توجد حالات مزمنة مسجلة بملفك.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <div key={c.id} className="rounded-lg bg-teal-900/60 border border-teal-500/50 px-2.5 py-1 text-xs text-white">
                    <span className="font-semibold">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200/90 pt-3 border-t border-emerald-500/10">
          <div className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>مفوض بموجب موافقتك الصريحة وفقاً لقانون حماية البيانات الشخصية رقم 151 لسنة 2020.</span>
          </div>
          <button
            type="button"
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 transition text-xs flex items-center gap-1"
          >
            <span>📥</span>
            <span>تحميل كارت السلامة الطارئ (PDF)</span>
          </button>
        </div>
      </section>

      {/* In-Platform Sponsored Healthcare Awareness / Ads Banner */}
      <section id="ads-hub" className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">شريك معتمد</span>
            <span className="text-xs font-semibold text-indigo-900">توعية دوائية وصحية معتمدة من شبكة شركاء المدى</span>
          </div>
          <span className="text-[10px] text-slate-400">إعلان طبي مرخص ومراقب علمياً</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {HEALTHCARE_ADS.filter(ad => ad.targetAudience === 'patient' || ad.targetAudience === 'all').map((ad) => (
            <div key={ad.id} className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{ad.badgeAr}</span>
                  <span className="text-[11px] text-slate-500">{ad.advertiserName}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ad.titleAr}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{ad.subtitleAr}</p>
                {ad.disclaimerAr && (
                  <p className="mt-2 text-[10px] text-slate-400 italic">{ad.disclaimerAr}</p>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={ad.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition"
                >
                  <span>{ad.callToActionAr}</span>
                  <span>←</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Medical Records & E-Prescriptions */}
      <section id="records" className="portal-card">
        <SectionHeading
          title="ملفي الصحي والروشتات الإلكترونية"
          note="السجلات والروشتات المعتمدة من الأطباء مع خطط العلاج وتعليمات الجرعات."
        />
        {records.length === 0 ? (
          <Empty>لا توجد زيارات طبية موثقة بملفك حتى الآن.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {records.map((record) => (
              <li key={record.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩺</span>
                    <div>
                      <p className="font-bold text-slate-900">{record.diagnosis || record.chief_complaint || 'زيارة طبية عامة'}</p>
                      <span className="text-xs text-slate-500">
                        {record.clinic_name} {record.doctor_name ? `· ${record.doctor_name}` : ''} · {formatDate(record.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 font-bold">معتمد سريرياً</span>
                </div>

                {record.chief_complaint && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-slate-800">الشكوى والأعراض:</strong> {record.chief_complaint}
                  </div>
                )}

                {record.treatment_plan && (
                  <div className="mt-2 text-xs text-slate-700 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
                    <strong className="text-teal-900 block mb-1">الخطة العلاجية والروشتة المسجلة:</strong>
                    <pre className="whitespace-pre-wrap font-sans text-xs">{record.treatment_plan}</pre>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/clinical/${appointments[0]?.id || '44444444-4444-4444-4444-444444444441'}/prescription`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition shadow-sm"
                  >
                    <span>💊</span>
                    <span>عرض وتحميل الروشتة الإلكترونية الرسمية (PDF)</span>
                  </Link>
                  <span className="text-[11px] text-slate-500">يمكنك تقديم هذه الروشتة لأي صيدلية معتمدة بالشبكة</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Labs & Radiology Reports with Direct Attachment Links */}
      <section id="reports" className="portal-card">
        <SectionHeading
          title="التحاليل والأشعة والمرفقات الطبية"
          note="تقارير معتمدة من كبرى المعامل ومراكز الأشعة مع إمكانية التحميل والمشاركة الفورية مع طبيبك."
        />
        {attachments.length === 0 ? (
          <Empty>لا توجد تحاليل أو أشعة مسجلة بملفك حتى الآن.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {attachments.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl p-2 rounded-xl bg-slate-100 border border-slate-200">
                    {file.kind.includes('lab') ? '🧪' : '🩻'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm break-words">{file.file_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fileKind(file.kind)} · {file.clinic_name} · {formatDate(file.created_at)} · {formatSize(file.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AttachmentLink id={file.id} fileName={file.file_name} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔬</span>
            <div>
              <p className="text-xs font-bold text-teal-950">فحص معملي حديث معتمد متوفر بملفك (رقم LAB-2026-0981)</p>
              <p className="text-[11px] text-teal-800">
                صورة دم كاملة CBC + سكر تراكمي HbA1c + وظائف كلى KFT معتمدة رسمياً وموثقة بكود QR لمنع التزوير.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/lab/orders/order-101/report"
              className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 transition shadow-xs"
            >
              عرض التقرير بـ QR
            </Link>
            <Link
              href="/lab/orders/new"
              className="rounded-lg bg-white border border-teal-300 hover:bg-teal-100 text-teal-900 font-bold text-xs px-3 py-1.5 transition"
            >
              طلب سحب منزلي 🏠
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Smart Care Discovery: Recommended Doctors for Your Condition */}
      <section id="recommended-care" className="portal-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🩺</span>
              <span>أطباء وعيادات موصى بها لحالتك</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ترشيحات ذكية مبنية على تاريخك الصحي وأمراضك المسجلة (السكري وضغط الدم) لضمان استمرارية الرعاية الفعالة.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 text-xs font-bold">
            مرشح بالذكاء الاصطناعي
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {RECOMMENDED_DOCTORS.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{doc.avatar}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      <p className="text-xs text-teal-700 font-medium">{doc.specialtyAr}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                    ★ {doc.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1.5">📍 {doc.clinicName} · {doc.areaAr}</p>
                <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] text-slate-700 leading-relaxed mb-3">
                  <strong className="text-teal-900 block mb-0.5">سبب الترشيح:</strong>
                  {doc.reasonAr}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">سعر الكشف</span>
                  <span className="text-xs font-bold text-slate-900">{doc.consultationFeeEgp} ج.م</span>
                </div>
                <Link
                  href="/appointments"
                  className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 transition"
                >
                  حجز موعد
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Diagnostic Labs & Radiology Centers Network */}
      <section id="labs-radiology" className="portal-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🔬</span>
              <span>المعامل ومراكز الأشعة القريبة المعتمدة</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              شبكة شركاء المدى الرسميين: سحب عينات منزلي، ربط فوري للنتائج مع ملفك، وخصومات حصرية لكارت سلامتك.
            </p>
          </div>
          <span className="text-xs text-slate-600 font-semibold">ربط رقمي فوري ⚡</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {HEALTHCARE_PARTNERS.filter(p => p.category === 'lab' || p.category === 'radiology').map((partner) => (
            <div key={partner.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-1.5 bg-slate-50 rounded-xl border border-slate-200">{partner.logo}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{partner.name}</h3>
                      <p className="text-xs text-slate-500">{partner.categoryLabelAr} · {partner.branchesCount} فرعاً</p>
                    </div>
                  </div>
                  {partner.discountPercentage && (
                    <span className="rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs px-2 py-0.5">
                      خصم {partner.discountPercentage}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{partner.descriptionAr}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {partner.servicesAr.slice(0, 3).map((srv, idx) => (
                    <span key={idx} className="rounded bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <span>📞 الخط الساخن:</span>
                  <span className="font-mono text-teal-800">{partner.phone}</span>
                </div>
                {partner.discountCode && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                    <span>كود الخصم:</span>
                    <span className="font-mono">{partner.discountCode}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Medical Marketplace Offers & Health Packages */}
      <section id="offers" className="portal-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🎁</span>
              <span>سوق العروض الطبية والخصومات الحصرية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              باقات فحص دوري، عروض مراكز الأشعة، ومستلزمات العناية المنزلية بأسعار خاصة لمرضى شبكة المدى.
            </p>
          </div>
          <span className="rounded-full bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 text-xs font-bold">
            وفّر حتى 40%
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ACTIVE_MEDICAL_OFFERS.map((offer) => (
            <div key={offer.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="rounded-md bg-rose-100 text-rose-900 font-bold text-xs px-2.5 py-0.5">
                    {offer.badgeAr}
                  </span>
                  <span className="text-xs text-slate-500">{offer.partnerName}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{offer.titleAr}</h3>
                <ul className="space-y-1 mb-4">
                  {offer.featuresAr.map((feat, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="text-teal-600 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">{offer.discountedPriceEgp} ج.م</span>
                    <span className="text-xs text-slate-400 line-through">{offer.originalPriceEgp} ج.م</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">سعر خاص لمرضى المدى</span>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 transition shadow-sm"
                >
                  {offer.ctaTextAr}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comprehensive Healthcare Ecosystem Partners (Pharmacies, Supplies, Pharma) */}
      <section id="ecosystem" className="portal-card bg-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🌐</span>
              <span>شبكة المدى الصحية المتكاملة (Health Ecosystem)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              ربط مباشر بين كبرى شركات الأدوية، الصيدليات، المعامل، مراكز الأشعة وموردي المستلزمات الطبية.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-xs font-bold">
            5 قطاعات مترابطة
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEALTHCARE_PARTNERS.filter(p => p.category === 'pharmacy' || p.category === 'pharma' || p.category === 'medical_supplies').map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-800/80 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{p.logo}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <span className="text-[11px] text-emerald-400">{p.categoryLabelAr}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.descriptionAr}</p>
              </div>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">هاتف: {p.phone}</span>
                <span className="text-emerald-400 font-semibold">{p.branchesCount > 1 ? `${p.branchesCount} فرعاً` : 'تغطية شاملة'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. My Appointments */}
      <section id="appointments" className="portal-card">
        <SectionHeading title="مواعيدي القادمة والسابقة" note="متابعة الحجوزات ومواعيد الاستشارة بالعيادات." />
        {appointments.length === 0 ? (
          <Empty>لا توجد مواعيد مسجلة بحسابك.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a.id} className="py-3.5 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-bold text-slate-900">{a.clinic_name} — {a.doctor_name || 'طبيب العيادة'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">التاريخ: {formatDate(a.date)} الساعة {a.time.slice(0, 5)}</p>
                </div>
                <span className="rounded-full bg-teal-100 text-teal-800 px-3 py-1 text-xs font-bold">
                  {a.status === 'confirmed' ? 'مؤكد' : a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 9. Privacy Policy & Cross-Clinic Consent Notice */}
      <section id="policy" className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h2 className="font-bold text-blue-950 text-sm">سياسة سلامة المريض ومشاركة البيانات الموحدة عبر شبكة المدى</h2>
            <p className="mt-1 text-xs text-blue-900 leading-relaxed">
              وفقاً لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020: بياناتك ملك لك وحدك. حرصاً على حياتك وسلامتك الطبية، يتم مشاركة <strong>كارت الأمان الدوائي الطارئ</strong> (الحساسيات الدوائية، الأمراض المزمنة، موانع الاستعمال الخطرة، وفصيلة الدم) مع أي طبيب مرخص بالشبكة يقوم بفحصك حتى يتم تحذيره تلقائياً من الأدوية المحظورة لحالتك. أما تفاصيل كشوفاتك وأسرار زياراتك فتبقى مشفرة ولا تُفتح لأي عيادة أخرى إلا بموافقتك المباشرة.
            </p>
          </div>
        </div>
      </section>

      {/* Link Another Clinic */}
      <section id="privacy" className="portal-card">
        <SectionHeading
          title="ربط ملف عيادة أخرى"
          note="إذا كنت تراجع عيادة أخرى تستخدم نظام المدى، أدخل رقم هاتفك أو ملفك لربطه بحسابك المركزي الموحد."
        />
        <PortalLinkRequest />
      </section>
    </PortalShell>
  );
}

function PortalShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="eyebrow text-teal-700 font-bold">المدى للرعاية الصحية الموحدة · بوابة المريض الذكية</p>
            <h1 className="text-2xl font-black text-slate-900">سوبر-بوابة المريض وجواز السفر الصحي</h1>
            <p className="mt-1 text-xs text-slate-500 font-mono">{email}</p>
          </div>
          <SignOutButton />
        </header>

        <nav
          aria-label="أقسام بوابة المريض"
          className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold shadow-sm"
        >
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#safety-card">كارت السلامة الذكي</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#records">الروشتات والزيارات</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#reports">التحاليل والأشعة</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#recommended-care">أطباء مرشحون</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#labs-radiology">المعامل والأشعة القريبة</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#offers">العروض والخصومات</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#ecosystem">شبكة الشركاء</a>
          <a className="nav-chip hover:bg-slate-100 px-3 py-1.5 rounded-lg transition" href="#appointments">المواعيد</a>
        </nav>

        {children}

        <footer className="px-2 pb-6 text-xs leading-6 text-slate-500 text-center border-t border-slate-200 pt-4">
          شبكة المدى الطبية الموحدة © 2026 · ربط متكامل بين العيادات والمستشفيات، شركات الأدوية، الصيدليات، المعامل، ومراكز الأشعة مع حماية كاملة لسلامة المريض الدوائية.
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      </div>
      <span className="text-3xl p-2 bg-slate-50 rounded-xl border border-slate-100">{icon}</span>
    </div>
  );
}

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100">{children}</p>;
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 font-medium">{children}</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ar-EG');
}

function formatSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return 'حجم غير محدد';
  return size < 1_000_000 ? `${Math.round(size / 1000)} كيلوبايت` : `${(size / 1_000_000).toFixed(1)} ميجابايت`;
}

function fileKind(kind: string) {
  const value = kind.toLowerCase();
  if (value.includes('lab') || value.includes('analysis')) return 'تحليل دم / معملي';
  if (value.includes('image') || value.includes('radiology') || value.includes('scan')) return 'تقرير أشعة تشخيصية';
  return 'مستند طبي معتمد';
}
