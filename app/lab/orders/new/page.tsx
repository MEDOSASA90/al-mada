'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LAB_TEST_DIRECTORY, LabTest } from '@/lib/lab';

export default function NewLabOrderPage() {
  const router = useRouter();

  const [patientName, setPatientName] = useState('أحمد محمود شريف');
  const [patientPhone, setPatientPhone] = useState('01099887766');
  const [patientAge, setPatientAge] = useState('42');
  const [patientGender, setPatientGender] = useState<'male' | 'female'>('male');
  const [referringDoctor, setReferringDoctor] = useState('د. أحمد مصطفى شريف (عيادة الباطنة بالمدى)');
  
  const [isHomeVisit, setIsHomeVisit] = useState(false);
  const [homeAddress, setHomeAddress] = useState('');
  const [homeVisitTime, setHomeVisitTime] = useState('');

  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['test-cbc', 'test-hba1c']);
  const [submitting, setSubmitting] = useState(false);

  function toggleTest(testId: string) {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  }

  const selectedTests = LAB_TEST_DIRECTORY.filter((t) => selectedTestIds.includes(t.id));
  const totalPrice = selectedTests.reduce((sum, t) => sum + t.priceEgp, 0) + (isHomeVisit ? 80 : 0);

  // Derive required sample tubes
  const requiredTubes = Array.from(new Set(selectedTests.map((t) => t.tubeLabelAr)));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate order registration and redirect to order details
    setTimeout(() => {
      router.push('/lab/orders/order-101');
    }, 600);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <span className="text-teal-800 font-bold">تسجيل فحص معملي جديد وسحب عينة</span>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>➕</span>
                <span>تسجيل طلب تحاليل معملية جديد</span>
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                تسجيل بيانات المريض، اختيار الفحوصات المطلوبة، تحديد الأنابيب وتوليد الباركود الرقمي.
              </p>
            </div>
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-center">
              <span className="text-[10px] text-teal-800 block uppercase font-mono font-bold">رقم الباركود المقترح</span>
              <span className="text-sm font-mono font-black text-teal-950">LAB-2026-1044</span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Patient Demographics */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span>👤</span>
              <span>بيانات المريض الأساسية</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المريض ثلاثي *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  placeholder="محمد أحمد إبراهيم"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف (لإرسال النتيجة واتساب) *</label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 text-left font-mono focus:border-teal-600 focus:outline-none"
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">العمر (سنة)</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none font-mono"
                    placeholder="35"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">النوع</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as 'male' | 'female')}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الطبيب المحول / العيادة</label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  placeholder="د. أحمد مصطفى شريف (عيادة الباطنة بالمدى)"
                />
              </div>
            </div>
          </section>

          {/* 2. Sample Collection Mode (Lab or Home Visit) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>💉</span>
                <span>مكان وطريقة سحب العينة</span>
              </h2>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={isHomeVisit}
                  onChange={(e) => setIsHomeVisit(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">طلب خدمة السحب المنزلي (Home Phlebotomy)</span>
              </label>
            </div>

            {isHomeVisit ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <p className="text-xs text-indigo-900 font-semibold">
                  🏠 سيتم إدراج الطلب في جدول أخصائيي السحب المتنقلين، مع إضافة رسوم انتقال قدرها 80 ج.م.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">العنوان التفصيلي للمريض *</label>
                    <input
                      type="text"
                      required={isHomeVisit}
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
                      placeholder="شارع 9، المعادي، عمارة 12، شقة 4"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">الموعد المفضل للزيارة *</label>
                    <input
                      type="text"
                      required={isHomeVisit}
                      value={homeVisitTime}
                      onChange={(e) => setHomeVisitTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
                      placeholder="اليوم الساعة 09:30 صباحاً"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                ✓ سيتم سحب العينات مباشرة في غرفة سحب العينات بالمعمل وتوجيهها للأجهزة فوراً.
              </p>
            )}
          </section>

          {/* 3. Test Selection Catalog */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🧪</span>
                <span>اختيار التحاليل والفحوصات المطلوبة</span>
              </h2>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                تم اختيار {selectedTestIds.length} فحص
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LAB_TEST_DIRECTORY.map((test) => {
                const isSelected = selectedTestIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-slate-900 text-xs">{test.nameAr}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-teal-700 h-4 w-4 mt-0.5"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block mb-1">{test.nameEn}</span>
                      <div className="flex flex-wrap gap-1 text-[10px] mb-2">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {test.tubeLabelAr}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {test.fastingRequirementsAr}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">النتيجة خلال {test.turnaroundTimeHours} ساعة</span>
                      <span className="text-xs font-bold text-teal-900">{test.priceEgp} ج.م</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Pre-analytical Summary & Required Tubes */}
          <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-slate-50 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-teal-950 flex items-center gap-2">
              <span>🏷️</span>
              <span>ملخص السحب والتجهيز المعملي المسبق (Pre-Analytical)</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">الأنابيب والمستلزمات المطلوبة للسحب:</p>
                <div className="flex flex-wrap gap-2">
                  {requiredTubes.length === 0 ? (
                    <span className="text-xs text-slate-400">اختر تحاليل لعرض الأنابيب المطلوبة</span>
                  ) : (
                    requiredTubes.map((tube, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-teal-100/80 border border-teal-300 text-teal-950 px-3 py-1 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>🧪</span>
                        <span>{tube}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>إجمالي أسعار التحاليل:</span>
                    <span className="font-bold text-slate-900">{selectedTests.reduce((sum, t) => sum + t.priceEgp, 0)} ج.م</span>
                  </div>
                  {isHomeVisit && (
                    <div className="flex justify-between text-xs text-indigo-700">
                      <span>رسوم خدمة السحب المنزلي:</span>
                      <span className="font-bold">80 ج.م</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mt-2">
                  <span className="text-xs font-bold text-slate-900">المجموع الكلي المطلوب:</span>
                  <span className="text-xl font-black text-teal-800 font-mono">{totalPrice} ج.م</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-teal-100">
              <Link
                href="/lab"
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={submitting || selectedTestIds.length === 0}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 transition shadow-sm flex items-center gap-2"
              >
                <span>{submitting ? 'جارٍ تسجيل الطلب وطباعة الباركود…' : 'حفظ الطلب وتوليد الباركود الرقمي'}</span>
                <span>🏷️</span>
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
