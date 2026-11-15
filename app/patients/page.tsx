import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listPatients } from '@/lib/patients';
import { PatientForm } from './patient-form';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { q = '' } = await searchParams;
  const search = q.trim().slice(0, 80);
  let patients: Awaited<ReturnType<typeof listPatients>> = [];
  let error = '';
  try { patients = await listPatients({ limit: 100, search }); }
  catch { error = 'تعذّر تحميل قائمة المرضى. حاول مرة أخرى.'; }

  return <main className="min-h-screen p-4 sm:p-8" dir="rtl"><div className="mx-auto max-w-5xl space-y-6">
    <header className="flex items-center justify-between gap-4"><div><Link href="/" className="text-sm text-teal-800">← لوحة العيادة</Link><h1 className="mt-2 text-2xl font-bold">سجل المرضى</h1><p className="mt-1 text-sm text-slate-600">ابحث بالاسم أو رقم الهاتف أو رقم الملف.</p></div><Link href="/" className="secondary-button inline-flex items-center">الرئيسية</Link></header>
    <PatientForm />
    <form className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" action="/patients" role="search"><label className="sr-only" htmlFor="patient-search">بحث المرضى</label><input id="patient-search" name="q" defaultValue={search} maxLength={80} className="field flex-1" placeholder="اسم المريض أو الهاتف أو رقم الملف"/><button className="primary-button">بحث</button>{search && <Link href="/patients" className="secondary-button inline-flex items-center">مسح</Link>}</form>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">{search ? `نتائج البحث (${patients.length})` : `المرضى النشطون (${patients.length})`}</h2></div>
      {patients.length ? <ul className="divide-y divide-slate-100">{patients.map((patient) => <li key={patient.id}><Link href={`/patients/${patient.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"><span className="min-w-0"><span className="block truncate font-semibold">{patient.full_name}</span><span className="mt-1 block text-sm text-slate-500">ملف {patient.file_number} · {patient.phone}</span></span><span className="shrink-0 text-sm text-teal-800">التفاصيل ←</span></Link></li>)}</ul> : <p className="p-6 text-sm text-slate-500">{search ? 'لا توجد نتائج مطابقة.' : 'لا توجد سجلات مرضى حتى الآن.'}</p>}
      {patients.length === 100 && <p className="border-t border-slate-100 p-4 text-xs text-slate-500">تُعرض أول 100 نتيجة؛ استخدم البحث للوصول إلى سجل محدد.</p>}
    </section>
  </div></main>;
}
