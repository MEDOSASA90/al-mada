'use client';

import { useState } from 'react';
import {
  calculatePregnancyDates,
  EGYPTIAN_MOH_VACCINATIONS,
  getRecommendedLaserPreset,
  type PregnancyDetails,
} from '@/lib/specialty-packs';

export function SpecialtyHub() {
  const [activeTab, setActiveTab] = useState<'obgyn' | 'pediatrics' | 'derma'>('obgyn');

  // OB/GYN Calculator State
  const [lmpDate, setLmpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 70); // Default to ~10 weeks ago
    return d.toISOString().slice(0, 10);
  });
  const [calcResult, setCalcResult] = useState<PregnancyDetails | null>(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() - 70);
      return calculatePregnancyDates(d.toISOString().slice(0, 10));
    } catch {
      return null;
    }
  });

  function handleCalculatePregnancy(dateStr: string) {
    setLmpDate(dateStr);
    try {
      const res = calculatePregnancyDates(dateStr);
      setCalcResult(res);
    } catch {
      setCalcResult(null);
    }
  }

  // Laser State
  const [skinType, setSkinType] = useState<1 | 2 | 3 | 4 | 5 | 6>(4);
  const laserPreset = getRecommendedLaserPreset(skinType);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('obgyn')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'obgyn'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🤰 النساء والتوليد وحساب الحمل
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pediatrics')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'pediatrics'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          👶 طب الأطفال والتطعيمات الإلزامية
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('derma')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'derma'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ✨ الجلدية وباقات أجهزة الليزر
        </button>
      </nav>

      {/* 1. OB/GYN Calculator Tab */}
      {activeTab === 'obgyn' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🤰</span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                حاسبة عمر الحمل وموعد الولادة المتوقع (EDD Calculator)
              </h3>
              <p className="text-xs text-slate-500">
                حساب دقيق بقاعدة Naegele المعتمدة دولياً وتحديد الثلث الحالي ومواعيد السونار المقررة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700" htmlFor="lmp_input">
                تاريخ أول يوم في آخر دورة شهرية (LMP):
              </label>
              <input
                id="lmp_input"
                type="date"
                value={lmpDate}
                onChange={(e) => handleCalculatePregnancy(e.target.value)}
                className="field w-full text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">
                اختر التاريخ لحساب أسابيع الحمل وموعد الولادة تلقائياً.
              </p>
            </div>

            {calcResult && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-1">
                  <span className="text-rose-900 text-[11px] font-bold block">موعد الولادة المتوقع (EDD)</span>
                  <strong className="text-rose-950 text-xl font-bold font-mono block">
                    {calcResult.eddDate}
                  </strong>
                  <span className="text-[10px] text-rose-700">بناءً على 280 يوماً مكتملة</span>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 space-y-1">
                  <span className="text-teal-900 text-[11px] font-bold block">عمر الحمل الحالي (GA)</span>
                  <strong className="text-teal-950 text-xl font-bold font-mono block">
                    {calcResult.gestationalWeeks} أسبوع + {calcResult.gestationalDays} أيام
                  </strong>
                  <span className="text-[10px] text-teal-700">{calcResult.trimesterLabel}</span>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 space-y-1">
                  <span className="text-purple-900 text-[11px] font-bold block">المرحلة الحالية</span>
                  <strong className="text-purple-950 text-base font-bold block">
                    الثلث رقم {calcResult.trimester}
                  </strong>
                  <span className="text-[10px] text-purple-700">تغذية ومتابعة دورية</span>
                </div>
              </div>
            )}
          </div>

          {calcResult && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                🔬 بروتوكول فحوصات السونار الموصى بها خلال فترة الحمل:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {calcResult.recommendedUltrasounds.map((us, i) => (
                  <li key={i} className="flex items-center gap-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-teal-700">✓</span>
                    <span>{us}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 2. Pediatrics Tab */}
      {activeTab === 'pediatrics' && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👶</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  جدول التطعيمات الإلزامية بوزارة الصحة والسكان المصرية
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الجرعات الإلزامية المقررة لمكاتب الصحة والوحدات الصحية من الولادة حتى عمر 18 شهراً.
                </p>
              </div>
            </div>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full font-bold">
              معتمد بوزارة الصحة المصرية
            </span>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-xs text-right divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">الفئة العمرية (السن)</th>
                  <th className="p-3">التطعيمات المقررة</th>
                  <th className="p-3">طريقة الإعطاء وموضع الحقن</th>
                  <th className="p-3">ملاحظات هامة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EGYPTIAN_MOH_VACCINATIONS.map((vac, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      {vac.ageMilestone}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {vac.vaccines.map((v, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-teal-50 text-teal-900 border border-teal-100 px-2 py-0.5 text-[11px] font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{vac.route}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{vac.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Dermatology & Laser Tab */}
      {activeTab === 'derma' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                معايير وبروتوكولات أجهزة الليزر (Fitzpatrick Skin Tuning)
              </h3>
              <p className="text-xs text-slate-500">
                ضبط آمن لطاقة أجهزة الليزر وحجم النبضة والتبريد بما يناسب طبيعة البشرة المصرية والشرق أوسطية.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700" htmlFor="skin_type_select">
                نوع البشرة بمقياس فيتزباتريك (Skin Type):
              </label>
              <select
                id="skin_type_select"
                value={skinType}
                onChange={(e) => setSkinType(Number(e.target.value) as any)}
                className="field w-full text-xs font-bold"
              >
                <option value={1}>Type I: بشرة بيضاء شديدة الحساسية</option>
                <option value={2}>Type II: بشرة فاتحة</option>
                <option value={3}>Type III: بشرة قمحية فاتحة</option>
                <option value={4}>Type IV: بشرة قمحية مصرية متوسطة (الشائعة)</option>
                <option value={5}>Type V: بشرة سمراء داكنة</option>
                <option value={6}>Type VI: بشرة شديدة السمرة</option>
              </select>
              <p className="text-[11px] text-slate-400">
                بشرة النوع الرابع والخامس تتطلب جهاز Nd:YAG بطول موجي 1064nm لتفادي التصبغات.
              </p>
            </div>

            <div className="md:col-span-2 rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-sm">
                  المعايير المقترحة لجهاز {laserPreset.deviceType}
                </span>
                <span className="text-xs bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-md">
                  معايير استرشادية
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-400 text-[10px] block">حجم البقعة (Spot Size)</span>
                  <strong className="text-slate-900 font-mono text-sm">{laserPreset.spotSizeMm} mm</strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-400 text-[10px] block">الطاقة (Fluence)</span>
                  <strong className="text-slate-900 font-mono text-sm">{laserPreset.fluenceJoules} J/cm²</strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-400 text-[10px] block">عرض النبضة (Pulse)</span>
                  <strong className="text-slate-900 font-mono text-sm">{laserPreset.pulseDurationMs} ms</strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-400 text-[10px] block">عدد التمريرات (Passes)</span>
                  <strong className="text-slate-900 font-mono text-sm">{laserPreset.passCount} تمريرة</strong>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-purple-100 text-xs">
                <strong className="text-purple-950">نظام التبريد الموصى به:</strong>{' '}
                <span className="text-slate-700">{laserPreset.coolingSetting}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
