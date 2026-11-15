'use client';

import { useState, useTransition } from 'react';
import { type ClinicBranch, type DoctorBranchShift } from '@/lib/branches';

export function BranchList({
  initialBranches,
  initialShifts,
}: {
  initialBranches: ClinicBranch[];
  initialShifts: DoctorBranchShift[];
}) {
  const [activeTab, setActiveTab] = useState<'branches' | 'shifts'>('branches');
  const [branches, setBranches] = useState<ClinicBranch[]>(initialBranches);
  const [shifts] = useState<DoctorBranchShift[]>(initialShifts);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [nameAr, setNameAr] = useState('');
  const [city, setCity] = useState('مدينة نصر');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr) return;

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 500));
      const created: ClinicBranch = {
        id: `branch_${Date.now()}`,
        clinic_id: '11111111-1111-1111-1111-111111111111',
        name_ar: nameAr,
        name_en: 'New Clinic Branch',
        code: `BR-${Math.floor(10 + Math.random() * 90)}`,
        governorate: 'القاهرة',
        city,
        address,
        phone,
        maps_url: mapsUrl || 'https://maps.google.com',
        is_main: false,
        is_active: true,
        cash_drawer_balance: 0,
        inventory_items_count: 0,
        doctors_count: 0,
      };

      setBranches([...branches, created]);
      setNameAr('');
      setAddress('');
      setPhone('');
      setMapsUrl('');
      setIsAdding(false);
    });
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'branches'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          الفروع والخزائن والمخازن ({branches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'shifts'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          مصفوفة مواعيد وشفتات الأطباء لكل فرع ({shifts.length})
        </button>
      </div>

      {activeTab === 'branches' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">فروع العيادة المسجلة ({branches.length})</h2>
              <p className="text-xs text-slate-500">
                خزينة مستقلة لكل فرع · مخزن مستهلكات مستقل · رابط الموقع على خرائط جوجل
              </p>
            </div>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 shadow-2xs transition"
              >
                + إضافة فرع جديد
              </button>
            )}
          </div>

          {isAdding && (
            <form onSubmit={handleCreateBranch} className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4">
              <h3 className="text-sm font-bold text-teal-950">بيانات الفرع الجديد</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الفرع (بالعربية):</label>
                  <input
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: فرع مدينة نصر / فرع المعادي"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المنطقة / الحي:</label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: مدينة نصر"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">العنوان التفصيلي:</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الشارع، رقم العقار، الدور"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">هاتف الفرع:</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="02XXXXXXXX أو 010XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 text-left font-mono focus:border-teal-700 focus:outline-hidden"
                    dir="ltr"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رابط خرائط جوجل (Google Maps Pin):</label>
                  <input
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 text-left font-mono focus:border-teal-700 focus:outline-hidden"
                    dir="ltr"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">يُرسل هذا الرابط تلقائياً للمريض في رسالة تأكيد الحجز عبر الواتساب.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending || !nameAr}
                  className="rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 shadow-2xs transition"
                >
                  {isPending ? 'جارٍ الحفظ…' : 'حفظ الفرع وتفعيله'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Branches Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{b.name_ar}</h3>
                      {b.is_main && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                          الفرع الرئيسي ⭐
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 block">{b.code}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    مفعّل نشط
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <p>📍 <strong>العنوان:</strong> {b.address || 'لم يحدد عنوان مفصل'}</p>
                  {b.phone && <p>📞 <strong>الهاتف:</strong> <span className="font-mono" dir="ltr">{b.phone}</span></p>}
                  <p>
                    🗺️ <strong>خرائط جوجل:</strong>{' '}
                    <a
                      href={b.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-bold hover:underline"
                    >
                      فتح الموقع على Google Maps ↗
                    </a>
                  </p>
                </div>

                {/* Operations summary per branch */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="block text-[10px] text-slate-500 font-medium">خزينة الفرع</span>
                    <span className="font-black text-slate-900 text-xs">{b.cash_drawer_balance.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="block text-[10px] text-slate-500 font-medium">أصناف المخزن</span>
                    <span className="font-black text-slate-900 text-xs">{b.inventory_items_count} صنف</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="block text-[10px] text-slate-500 font-medium">طاقم الأطباء</span>
                    <span className="font-black text-slate-900 text-xs">{b.doctors_count} أطباء</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Doctor Shifts Matrix Tab */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">مصفوفة جدول مواعيد وشفتات الأطباء بالفروع</h3>
              <p className="text-xs text-slate-500">
                توزيع مواعيد الأطباء وأسعار الكشف وسعة الطابور حسب كل فرع
              </p>
            </div>
            <span className="text-xs rounded-full bg-teal-50 px-2.5 py-1 text-teal-800 font-bold border border-teal-200">
              تحديث تلقائي لجدول الحجز
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3">الطبيب المعالج</th>
                  <th className="p-3">التخصص</th>
                  <th className="p-3">الفرع المخصص</th>
                  <th className="p-3">أيام العمل</th>
                  <th className="p-3">أوقات الشفت</th>
                  <th className="p-3">سعر الكشف بالفرع</th>
                  <th className="p-3">السعة القصوى</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{s.doctor_name}</td>
                    <td className="p-3 text-slate-600">{s.specialty}</td>
                    <td className="p-3 font-medium text-teal-900">{s.branch_name}</td>
                    <td className="p-3 font-semibold text-slate-800">{s.days_ar}</td>
                    <td className="p-3 font-mono text-slate-600">{s.start_time} - {s.end_time}</td>
                    <td className="p-3 font-bold text-slate-900">{s.consultation_fee} ج.م</td>
                    <td className="p-3 text-slate-500">{s.max_patients_per_shift} مريض / شفت</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        متاح للحجز ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
