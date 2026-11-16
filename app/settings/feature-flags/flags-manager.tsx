'use client';

import { useState } from 'react';
import { toggleFeatureFlagAction } from './actions';
import type { FeatureFlag, FeatureFlagKey } from '@/lib/feature-flags';

type Props = {
  initialFlags: FeatureFlag[];
};

export function FlagsManager({ initialFlags }: Props) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  async function handleToggle(key: FeatureFlagKey, currentStatus: boolean) {
    setLoadingKey(key);
    setStatusMsg('');

    const newStatus = !currentStatus;
    const res = await toggleFeatureFlagAction(key, newStatus);
    setLoadingKey(null);

    if (res.success) {
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, isEnabled: newStatus } : f))
      );
      setStatusMsg(res.message);
    } else {
      setStatusMsg(res.message);
    }
  }

  const tierBadges: Record<string, string> = {
    basic: 'bg-slate-100 text-slate-800 border-slate-200',
    pro: 'bg-teal-50 text-teal-800 border-teal-200',
    enterprise: 'bg-purple-50 text-purple-900 border-purple-200',
  };

  const categoryNames: Record<string, string> = {
    clinical: 'الميزات السريرية',
    communication: 'قنوات التواصل',
    marketplace: 'سوق التوريدات',
    specialty: 'الحزم التخصصية',
    developer: 'المطورين وAPI',
  };

  return (
    <div className="space-y-6">
      {/* Intro Header Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎛️</span>
          <h2 className="font-bold text-slate-900 text-base">
            إدارة إطلاق الميزات والتحكم التدريجي (Feature Flags)
          </h2>
          <span className="rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold px-2.5 py-0.5 border border-purple-200">
            المرحلة 8
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          تحكم كامل في تفعيل أو إيقاف الميزات الحديثة والتخصصية لكل عيادة على حدة، بما يضمن استقرار المنظومة واختبار الميزات المعقدة (سوق المستلزمات وواجهات الشركاء) تدريجياً خلف مفاتيح تحكم آمنة (Feature Toggles).
        </p>
      </section>

      {statusMsg && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-bold text-teal-950">
          ✓ {statusMsg}
        </div>
      )}

      {/* Flags List */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">مفاتيح الميزات النشطة ({flags.length})</h3>
            <p className="text-xs text-slate-500 mt-0.5">يمكنك تغيير حالة أي ميزة فورياً وتوثيق التغيير بالنظام.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
            مفعلة: {flags.filter((f) => f.isEnabled).length} / {flags.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {flags.map((flag) => {
            const isLoading = loadingKey === flag.key;

            return (
              <div
                key={flag.key}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{flag.labelAr}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {categoryNames[flag.category] || flag.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        tierBadges[flag.requiresTier]
                      }`}
                    >
                      باقة: {flag.requiresTier.toUpperCase()}
                    </span>
                    {flag.isBeta && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        تجريبي Beta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{flag.descriptionAr}</p>
                  <span className="text-[11px] font-mono text-slate-400 block">كود الميزة: {flag.key}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(flag.key, flag.isEnabled)}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      flag.isEnabled ? 'bg-teal-700' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        flag.isEnabled ? '-translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <span
                    className={`text-xs font-bold ${
                      flag.isEnabled ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  >
                    {flag.isEnabled ? 'مفعل' : 'معطل'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
