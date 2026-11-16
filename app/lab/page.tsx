import Link from 'next/link';
import { getCurrentSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { listLabOrders, listLabTests, listAnalyzers } from '@/lib/lab';
import { SignOutButton } from '@/app/sign-out-button';

export const dynamic = 'force-dynamic';

export default async function LabDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership, clinic } = session;
  const isOwner = membership.role === 'clinic_owner' || membership.role === 'clinic_admin';
  const orders = listLabOrders();
  const tests = listLabTests();
  const analyzers = listAnalyzers();

  // Metrics
  const totalOrders = orders.length;
  const pendingCollection = orders.filter((o) => o.status === 'pending_collection').length;
  const inProcessing = orders.filter((o) => o.status === 'in_processing').length;
  const pendingReview = orders.filter((o) => o.status === 'pending_review').length;
  const approved = orders.filter((o) => o.status === 'approved' || o.status === 'delivered').length;
  const criticalOrders = orders.filter((o) => o.criticalAlertCount > 0);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/" className="hover:text-teal-700 transition">لوحة التحكم</Link>
              <span>/</span>
              <span className="text-teal-800 font-bold">معمل التحاليل الطبية والباثولوجيا (LIMS)</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>🔬</span>
              <span>معمل {clinic?.name_ar || 'المدى'} للتحاليل الطبية المتطورة</span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              إدارة دورة حياة العينات، الباركود، الفحص الآلي، الإنذار الحرج، والتقارير المعتمدة بـ QR Code.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/lab/orders/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 transition shadow-sm"
            >
              <span>➕</span>
              <span>تسجيل فحص معملي جديد</span>
            </Link>
            <Link
              href="/lab/catalog"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 transition"
            >
              <span>📋</span>
              <span>دليل الفحوصات والأسعار</span>
            </Link>
            <Link
              href="/lab/home-visits"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs px-3.5 py-2.5 transition"
            >
              <span>🏠</span>
              <span>السحب المنزلي</span>
            </Link>
            <Link
              href="/lab/devices"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 transition"
            >
              <span>⚙️</span>
              <span>أجهزة المعمل والـ QC</span>
            </Link>
          </div>
        </header>

        {/* Critical Panic Values Live Alert Banner */}
        {criticalOrders.length > 0 && (
          <section className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm animate-pulse">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <div>
                  <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                    <span>إنذار معملي حرج (Critical Panic Values Alert)</span>
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {criticalOrders.length} حالات حرجة
                    </span>
                  </h3>
                  <p className="text-xs text-rose-900 mt-0.5">
                    توجد نتائج تحاليل وصلت لمستويات حرجة تهدد حياة المريض وتتطلب إبلاغاً سريرياً فورياً للطبيب المعالج!
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {criticalOrders.map((co) => (
                  <Link
                    key={co.id}
                    href={`/lab/orders/${co.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 transition"
                  >
                    <span>فحص المريض: {co.patientName} ({co.barcode})</span>
                    <span>←</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Operational Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="إجمالي الفحوصات" value={totalOrders} icon="🧪" color="slate" />
          <StatCard label="بانتظار السحب" value={pendingCollection} icon="💉" color="amber" />
          <StatCard label="جاري التحليل بالأجهزة" value={inProcessing} icon="⚙️" color="blue" />
          <StatCard label="بانتظار الاعتماد الطبي" value={pendingReview} icon="⏳" color="purple" />
          <StatCard label="معتمد وجاهز للتسليم" value={approved} icon="✓" color="emerald" />
        </section>

        {/* Live Lab Workbench & Orders Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📑</span>
                <span>طابور العينات والفحوصات المعملية الحية</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع حالة العينات من السحب وحتى التحليل والاعتماد وإصدار التقرير بـ QR Code.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                {orders.length} طلبات مسجلة
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الباركود ورقم الطلب</th>
                  <th className="p-3">المريض</th>
                  <th className="p-3">التحاليل المطلوبة</th>
                  <th className="p-3">الطبيب / العيادة المحولة</th>
                  <th className="p-3">توقيت السحب</th>
                  <th className="p-3">الحالة والإنذارات</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-sm">🏷️</span>
                        <span>{order.barcode}</span>
                      </div>
                      {order.isHomeVisit && (
                        <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                          🏠 سحب منزلي
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{order.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.patientGender === 'male' ? 'ذكر' : 'أنثى'} · {order.patientAge} سنة · {order.patientPhone}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {order.testNamesAr.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800 font-medium">{order.referringDoctorName || 'مريض خارجي مباشر'}</div>
                      {order.referringClinicName && (
                        <div className="text-[10px] text-slate-500">{order.referringClinicName}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-slate-700">{formatTime(order.orderDate)}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <StatusBadge status={order.status} />
                        {order.criticalAlertCount > 0 && (
                          <span className="block text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-center">
                            🚨 نتيجة حرجة
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/lab/orders/${order.id}`}
                          className="rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-2.5 py-1 text-xs font-bold transition"
                        >
                          إدخال / مراجعة
                        </Link>
                        {order.status === 'approved' && (
                          <Link
                            href={`/lab/orders/${order.id}/report`}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-xs"
                          >
                            التقرير والـ QR
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Access Grid: Catalogs, Analyzers & Quality Control */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Diagnostic Catalog Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <h3 className="font-bold text-slate-900 text-base">دليل الفحوصات والأسعار</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                يشمل أكثر من 8 فئات معملية رئيسية (علم الدم، كيمياء الدم، الهرمونات، دلالات الأورام، والبول والبراز) مع شروط الصيام والمعدلات المرجعية.
              </p>
              <div className="text-xs font-bold text-teal-800 bg-teal-50 p-2.5 rounded-lg border border-teal-100 mb-3">
                {tests.length} تحاليل مسجلة بالدليل القياسي
              </div>
            </div>
            <Link
              href="/lab/catalog"
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2 text-center transition"
            >
              استعراض وتعديل الكتالوج
            </Link>
          </div>

          {/* Home Phlebotomy Hub */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏠</span>
                <h3 className="font-bold text-slate-900 text-base">خدمة السحب المنزلي</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                إدارة أخصائيي السحب المتنقلين، تتبع مواعيد الزيارات للمرضى وكبار السن، وضمان وصول العينات للمعمل مبردة وفي الوقت القياسي.
              </p>
              <div className="text-xs font-bold text-indigo-800 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 mb-3">
                متاح 24/7 مع التغطية الجغرافية
              </div>
            </div>
            <Link
              href="/lab/home-visits"
              className="rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold p-2 text-center transition border border-indigo-200"
            >
              إدارة طلبات السحب المنزلي
            </Link>
          </div>

          {/* Machine Interfacing & QC */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚙️</span>
                <h3 className="font-bold text-slate-900 text-base">أجهزة المعمل والـ QC</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                ربط أجهزة Sysmex و Roche Cobas و Mindray مع متابعة عينات الكنترول الدورية (Daily QC) ومعايرة الكواشف.
              </p>
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 mb-3">
                {analyzers.filter((a) => a.status === 'online' || a.status === 'qc_passed').length} / {analyzers.length} أجهزة متصلة ونشطة
              </div>
            </div>
            <Link
              href="/lab/devices"
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2 text-center transition"
            >
              متابعة الأجهزة والجودة
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: 'slate' | 'amber' | 'blue' | 'purple' | 'emerald';
}) {
  const colorMap = {
    slate: 'border-slate-200 bg-white text-slate-900',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-950',
    blue: 'border-blue-200 bg-blue-50/50 text-blue-950',
    purple: 'border-purple-200 bg-purple-50/50 text-purple-950',
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-950',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm flex items-center justify-between ${colorMap[color]}`}>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black">{value}</p>
      </div>
      <span className="text-2xl p-2 bg-white/80 rounded-xl border border-slate-100 shadow-xs">{icon}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending_collection':
      return <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold">بانتظار السحب</span>;
    case 'collected':
      return <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">تم السحب</span>;
    case 'in_processing':
      return <span className="rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[10px] font-bold">قيد التحليل الآلي</span>;
    case 'pending_review':
      return <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[10px] font-bold">بانتظار الاعتماد</span>;
    case 'approved':
      return <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">معتمد رسمياً ✓</span>;
    case 'delivered':
      return <span className="rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 text-[10px] font-bold">تم التسليم للمريض</span>;
    default:
      return <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px]">{status}</span>;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG');
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
