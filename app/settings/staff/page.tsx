import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listStaff } from '@/lib/staff';
import { StaffEditDialog } from './staff-edit-dialog';
import { AddStaffDialog } from './add-staff-dialog';

export const dynamic = 'force-dynamic';

export default async function StaffSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  if (!['clinic_owner', 'clinic_admin'].includes(membership.role)) {
    redirect('/');
  }

  const staff = await listStaff();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="text-teal-800 hover:underline">
                لوحة العيادة
              </Link>
              <span>/</span>
              <Link href="/settings" className="text-teal-800 hover:underline">
                مركز الإعدادات
              </Link>
              <span>/</span>
              <span>إدارة الطاقم الطبي والإداري</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              إدارة الطاقم الطبي والإداري
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              إدارة الأطباء، موظفي الاستقبال، التمريض، نسب أتعاب الأطباء والصلاحيات.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AddStaffDialog />
          </div>
        </header>

        {/* Staff Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">أعضاء الفريق المسجلون ({staff.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">يمكنك مراجعة الصلاحيات والنسب لكل موظف وطبيب بالعيادة.</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
              نشط: {staff.filter((s) => s.is_active).length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">الاسم الكامل</th>
                  <th className="p-3.5">الوظيفة / الدور</th>
                  <th className="p-3.5">بيانات الاتصال</th>
                  <th className="p-3.5">ترخيص النقابة</th>
                  <th className="p-3.5 text-center">نسبة الطبيب</th>
                  <th className="p-3.5 text-center">سعر الكشف</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">تواصل سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((m) => {
                  const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
                  const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        {m.full_name}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge(m.role)}`}>
                          {roleLabel(m.role)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <p className="font-mono">{m.phone || '—'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{m.email || '—'}</p>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {m.license_number || '—'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-teal-800">
                        {m.role === 'doctor' || m.role === 'visiting_doctor' ? `%${m.commission_percentage ?? 70}` : '—'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                        {m.consultation_fee ? `${m.consultation_fee} ج.م` : '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          m.is_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {m.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <StaffEditDialog member={m} />
                          {waPhone && (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً زميلنا العزيز ${m.full_name}، نتواصل معك من إدارة عيادة المدى.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                              title="مراسلة سريعة عبر واتساب"
                            >
                              <span>💬</span>
                              <span>واتساب</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    clinic_owner: 'مالك العيادة',
    clinic_admin: 'مدير العيادة',
    doctor: 'طبيب معالج',
    visiting_doctor: 'طبيب زائر / استشاري',
    receptionist: 'موظف استقبال وكاشير',
    nurse: 'تمريض ومساعد',
    accountant: 'محاسب مالي',
    inventory_manager: 'أمين مخزن ومستلزمات',
  };
  return map[role] ?? role;
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    clinic_owner: 'bg-purple-100 text-purple-900 border border-purple-200',
    clinic_admin: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
    doctor: 'bg-teal-100 text-teal-900 border border-teal-200',
    visiting_doctor: 'bg-cyan-100 text-cyan-900 border border-cyan-200',
    receptionist: 'bg-amber-100 text-amber-900 border border-amber-200',
    nurse: 'bg-rose-100 text-rose-900 border border-rose-200',
    accountant: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  };
  return map[role] ?? 'bg-slate-100 text-slate-800';
}
