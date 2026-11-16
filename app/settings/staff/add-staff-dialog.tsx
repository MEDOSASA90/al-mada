'use client';

import { useState } from 'react';
import type { StaffMember } from '@/lib/staff';

export function AddStaffDialog({ onAdd }: { onAdd?: (member: StaffMember) => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('doctor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [commission, setCommission] = useState(70);
  const [fee, setFee] = useState(350);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDoctor = role === 'doctor' || role === 'visiting_doctor';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName) return;
    setSaving(true);

    const newMember: StaffMember = {
      id: `staff_${Date.now()}`,
      clinic_id: '00000000-0000-0000-0000-000000000001',
      user_id: null,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      role,
      specialty_id: null,
      license_number: licenseNumber || null,
      is_active: true,
      commission_percentage: isDoctor ? commission : 0,
      consultation_fee: isDoctor ? fee : 0,
      created_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      if (onAdd) onAdd(newMember);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        setFullName('');
        setPhone('');
        setEmail('');
        setLicenseNumber('');
      }, 1000);
    }, 600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="primary-button text-xs py-2 px-3 inline-flex items-center gap-1.5 shadow-xs"
        type="button"
      >
        <span>+</span>
        <span>إضافة طبيب أو موظف جديد</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-right">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">إضافة فرد جديد لطاقم العيادة</h3>
            <p className="text-xs text-slate-500">تسجيل طبيب معالج، استشاري زائر، تمريض، أو موظف استقبال.</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                placeholder="د. أحمد فؤاد أو أ. منى سعيد"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">المسمى الوظيفي والدور *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium"
              >
                <option value="doctor">طبيب معالج أساسي</option>
                <option value="visiting_doctor">طبيب زائر / استشاري</option>
                <option value="receptionist">موظف استقبال وكاشير</option>
                <option value="nurse">تمريض ومساعد سريري</option>
                <option value="accountant">محاسب مالي</option>
                <option value="inventory_manager">أمين مخزن ومستلزمات</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف (واتساب) *</label>
              <input
                type="tel"
                required
                placeholder="+2010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="doctor@almada.eg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>

          {isDoctor && (
            <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-3 space-y-3">
              <p className="font-bold text-teal-950 text-xs">🩺 البيانات الطبية والمالية للطبيب</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم ترخيص النقابة</label>
                  <input
                    type="text"
                    placeholder="مثال: 54120/2020"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">نسبة الطبيب (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-teal-800 bg-white"
                    />
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">سعر الكشف (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-800 font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {saved && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-800">
              ✓ تم تسجيل وإضافة {fullName} بنجاح إلى طاقم العيادة!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-button text-xs py-2 px-4"
            >
              {saving ? 'جارٍ الإضافة…' : 'إضافة إلى طاقم العيادة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
