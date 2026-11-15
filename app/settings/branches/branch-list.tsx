'use client';

import { useState, useTransition } from 'react';
import { type ClinicBranch } from '@/lib/branches';

export function BranchList({ initialBranches }: { initialBranches: ClinicBranch[] }) {
  const [branches, setBranches] = useState<ClinicBranch[]>(initialBranches);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [nameAr, setNameAr] = useState('');
  const [city, setCity] = useState('التجمع الخامس');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

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
        is_main: false,
        is_active: true,
        doctors_count: 0,
      };

      setBranches([...branches, created]);
      setNameAr('');
      setAddress('');
      setPhone('');
      setIsAdding(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">فروع العيادة المسجلة ({branches.length})</h2>
          <p className="text-xs text-slate-500">ربط الكشوفات، الأطباء، ومخازن المستهلكات بكل فرع</p>
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

            <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <p>📍 <strong>العنوان:</strong> {b.address || 'لم يحدد عنوان مفصل'}</p>
              {b.phone && <p>📞 <strong>الهاتف:</strong> <span className="font-mono" dir="ltr">{b.phone}</span></p>}
              <p>🩺 <strong>الأطباء العاملون بالفرع:</strong> {b.doctors_count} طبيب</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
