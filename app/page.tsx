import { listPatients } from '@/lib/patients';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let patients: Awaited<ReturnType<typeof listPatients>> = [];
  let error: string | null = null;

  try {
    patients = await listPatients({ limit: 25 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
        <header className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">المدى — Al-Mada</h1>
          <p className="text-slate-600 mt-1">
            منصة إدارة العيادات الطبية · SaaS for medical clinics in Egypt
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="المرضى" value={patients.length} tone="blue" />
          <Stat label="الأطباء" value={0} tone="green" />
          <Stat label="المواعيد اليوم" value={0} tone="amber" />
          <Stat label="الإيرادات" value="0 EGP" tone="slate" />
        </section>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
            <p className="font-semibold">تعذّر تحميل البيانات</p>
            <p className="text-sm mt-1 font-mono">{error}</p>
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            آخر المرضى {patients.length > 0 && `(${patients.length})`}
          </h2>
          {patients.length === 0 ? (
            <p className="text-slate-500">لا يوجد مرضى مسجلون بعد — أو يتم إنشاء الجلسة الآن.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patients.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{p.full_name}</p>
                    <p className="text-sm text-slate-500">
                      {p.file_number} · {p.phone}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(p.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'blue' | 'green' | 'amber' | 'slate';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
    slate: 'bg-slate-100 text-slate-900',
  };
  return (
    <div className={`rounded-xl p-5 ${tones[tone]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
