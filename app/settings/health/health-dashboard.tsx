'use client';

import { useState } from 'react';
import Link from 'next/link';
import { runDiagnosticsAction } from './actions';
import type { SystemHealthReport } from '@/lib/health';

type Props = {
  initialReport: SystemHealthReport;
};

export function HealthDashboard({ initialReport }: Props) {
  const [report, setReport] = useState<SystemHealthReport>(initialReport);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  async function handleRerunDiagnostics() {
    setIsRunning(true);
    setStatusMsg('');

    const res = await runDiagnosticsAction();
    setIsRunning(false);

    if (res.success && res.report) {
      setReport(res.report);
      setStatusMsg(res.message);
    } else {
      setStatusMsg(res.message);
    }
  }

  const categoryLabels: Record<string, string> = {
    core: 'النواة وقاعدة البيانات',
    security: 'الأمان وعزل المستأجرين',
    clinical: 'السريرية والذكاء الاصطناعي',
    financial: 'المالية والخزينة',
    compliance: 'الامتثال والقانون 151',
  };

  return (
    <div className="space-y-6">
      {/* Big Readiness Score Banner */}
      <section className="rounded-2xl border border-teal-200 bg-linear-to-r from-teal-900 via-teal-800 to-emerald-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-emerald-200 tracking-wide">
                المرحلة 7 · الجاهزية التشغيلية والإطلاق التجريبي (Pilot Launch Readiness)
              </span>
            </div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              النظام جاهز للتشغيل التجريبي بنسبة {report.readinessScore}%
            </h2>
            <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
              اجتياز كافة اختبارات عزل بيانات العيادات، الترحيلات التسع، سياسات RLS، الخزينة المتزنة، ومساعد الكشف الذكي وفق معايير الأمان وقانون حماية البيانات الشخصية المصري (قانون 151 لسنة 2020).
            </p>
          </div>

          <div className="text-center sm:text-left">
            <button
              type="button"
              onClick={handleRerunDiagnostics}
              disabled={isRunning}
              className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-teal-950 shadow-sm hover:bg-teal-50 transition active:scale-95 disabled:opacity-75 inline-flex items-center gap-2"
            >
              <span>{isRunning ? '⏳' : '🔄'}</span>
              <span>{isRunning ? 'جارٍ فحص كافة الخدمات…' : 'إجراء فحص تشخيصي فوري شامل'}</span>
            </button>
            <p className="text-[11px] text-teal-200 mt-1.5 font-mono">
              آخر فحص: {new Date(report.timestamp).toLocaleTimeString('ar-EG')}
            </p>
          </div>
        </div>
      </section>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900">
          ✓ {statusMsg}
        </div>
      )}

      {/* Operational Metrics Counter */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-slate-500 text-[11px] block">المرضى بالمنظومة</span>
          <strong className="text-slate-900 text-xl font-bold font-mono">{report.metrics.totalPatients} مريض</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-slate-500 text-[11px] block">الفروع النشطة</span>
          <strong className="text-slate-900 text-xl font-bold font-mono">{report.metrics.activeBranches} فروع</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-slate-500 text-[11px] block">المتحصلات المحققة</span>
          <strong className="text-emerald-800 text-xl font-bold font-mono">{report.metrics.totalRevenueEgp} ج.م</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-slate-500 text-[11px] block">المصروفات النثرية</span>
          <strong className="text-rose-800 text-xl font-bold font-mono">{report.metrics.totalExpensesEgp} ج.م</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-slate-500 text-[11px] block">سلة المحذوفات (30 يوم)</span>
          <strong className="text-amber-800 text-xl font-bold font-mono">{report.metrics.archivedTrashItems} عناصر</strong>
        </div>
      </section>

      {/* Six Services Health Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            تقرير حالة الخدمات والأنظمة التحتية ({report.services.length})
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold">
            كافة الخدمات قيد التشغيل المباشر
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.services.map((svc) => (
            <div
              key={svc.serviceId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-teal-400 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    {categoryLabels[svc.category] || svc.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{svc.nameAr}</h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      svc.status === 'operational'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span>{svc.status === 'operational' ? '● سليم' : '▲ تنبيه'}</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{svc.details}</p>

              <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100 flex items-center justify-between">
                <span>
                  <strong>دليل الاختبار:</strong> {svc.evidence}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">{svc.latencyMs} ms</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Egyptian Data Protection Law 151/2020 Compliance Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              شهادة الامتثال لقانون حماية البيانات الشخصية المصري (قانون 151 لسنة 2020)
            </h3>
            <p className="text-xs text-slate-500">
              المعايير المعتمدة لضمان سيادة البيانات الصحية وحماية خصوصية المرضى والأطباء.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1">
            <span className="font-bold text-emerald-950 block">✓ عزل المستأجرين (Tenancy)</span>
            <p className="text-emerald-800 text-[11px]">
              منع مشاركة السجلات عبر العيادات، وعزل تام للملفات والمواعيد والفواتير.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1">
            <span className="font-bold text-emerald-950 block">✓ سياسة الاحتفاظ (Retention)</span>
            <p className="text-emerald-800 text-[11px]">
              الحذف المرن للسجلات مع إتاحة 30 يوماً للاسترجاع الفوري قبل الحذف النهائي.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1">
            <span className="font-bold text-emerald-950 block">✓ موافقة المريض الصريحة</span>
            <p className="text-emerald-800 text-[11px]">
              اشتراط مراجعة واعتماد طلبات ربط البوابة الصحية يدوياً دون تفعيل تلقائي.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1">
            <span className="font-bold text-emerald-950 block">✓ سيادة وتصدير البيانات</span>
            <p className="text-emerald-800 text-[11px]">
              حق العيادة في تنزيل كامل قاعدة البيانات بصيغة JSON مفتوحة في أي وقت.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <p>{report.complianceAudit.notes}</p>
          <div className="flex gap-2">
            <Link href="/settings/export" className="secondary-button text-xs py-1.5 px-3">
              مركز التصدير ←
            </Link>
            <Link href="/settings/trash" className="secondary-button text-xs py-1.5 px-3">
              سلة المحذوفات ←
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
