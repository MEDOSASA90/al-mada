import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listPatients } from '@/lib/patients';
import { listDoctors, listBranches } from '@/lib/staff';
import { PatientForm } from './patient-form';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { q = '' } = await searchParams;
  const search = q.trim().slice(0, 80);
  let patients: Awaited<ReturnType<typeof listPatients>> = [];
  let doctors: Awaited<ReturnType<typeof listDoctors>> = [];
  let branches: Awaited<ReturnType<typeof listBranches>> = [];
  let error = '';
  try {
    const [pts, docs, brs] = await Promise.all([
      listPatients({ limit: 100, search }),
      listDoctors(),
      listBranches(),
    ]);
    patients = pts;
    doctors = docs;
    branches = brs;
  } catch {
    error = 'تعذّر تحميل قائمة المرضى. حاول مرة أخرى.';
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm text-teal-800 hover:underline">
                ← لوحة العيادة
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">سجل المرضى</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">سجل المرضى والملفات الطبية</h1>
            <p className="mt-1 text-sm text-slate-600">ابحث بالاسم أو رقم الهاتف أو رقم الملف، أو سجّل مريضاً جديداً فورياً.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/appointments" className="secondary-button inline-flex items-center text-sm">
              المواعيد
            </Link>
            <Link href="/queue" className="secondary-button inline-flex items-center text-sm">
              طابور الانتظار
            </Link>
          </div>
        </header>

        <PatientForm doctors={doctors} branches={branches} />

        <form className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" action="/patients" role="search">
          <label className="sr-only" htmlFor="patient-search">
            بحث المرضى
          </label>
          <input
            id="patient-search"
            name="q"
            defaultValue={search}
            maxLength={80}
            className="field flex-1"
            placeholder="ابحث بالاسم الكامل أو رقم الهاتف أو رقم الملف الطبي…"
          />
          <button className="primary-button">بحث</button>
          {search && (
            <Link href="/patients" className="secondary-button inline-flex items-center">
              مسح
            </Link>
          )}
        </form>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {search ? `نتائج البحث (${patients.length})` : `المرضى النشطون (${patients.length})`}
            </h2>
            <span className="text-xs text-slate-500">محدّث تلقائياً</span>
          </div>
          {patients.length ? (
            <ul className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-teal-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-sm">
                        {patient.full_name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-slate-900 hover:text-teal-800">{patient.full_name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          ملف: <strong className="text-slate-700">{patient.file_number}</strong> · هاتف: {patient.phone}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-teal-800 flex items-center gap-1">
                      <span>فتح الملف</span>
                      <span>←</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-slate-500">
              <span className="text-3xl block mb-2">📂</span>
              <p className="font-medium text-sm">{search ? 'لا توجد نتائج مطابقة لبحثك.' : 'لا توجد سجلات مرضى مسجلة حتى الآن.'}</p>
            </div>
          )}
          {patients.length === 100 && (
            <p className="border-t border-slate-100 p-4 text-xs text-slate-500 text-center">
              تُعرض أول 100 نتيجة؛ استخدم خانة البحث أعلاه للوصول السريع إلى أي ملف محدد.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
