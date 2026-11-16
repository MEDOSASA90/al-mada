import Link from 'next/link';

export default function HomePhlebotomyPage() {
  const demoVisits = [
    {
      id: 'visit-1',
      orderBarcode: 'LAB-2026-0982',
      patientName: 'سارة عبد الله الشربيني',
      phone: '01122334455',
      addressAr: 'عمارة 14 شارع النصر، المعادي الجديدة، القاهرة - الدور الثالث شقة 5',
      scheduledSlot: 'اليوم الساعة 09:30 صباحاً',
      phlebotomistName: 'أ. طارق عبد المجيد (فني سحب متنقل)',
      status: 'sample_collected',
      statusLabelAr: 'تم السحب وبانتظار التوريد',
      testsCount: 2,
      testsSummary: 'TSH + CBC',
      tubes: ['أنبوبة بنفسجية EDTA', 'أنبوبة صفراء جيل'],
      coolerTemp: '4°C (ضمن النطاق المبرد)',
    },
    {
      id: 'visit-2',
      orderBarcode: 'LAB-2026-1045',
      patientName: 'الحاج عبد المنعم حسنين',
      phone: '01001122334',
      addressAr: 'شارع الهرم الرئيسي، بجوار مستشفى الجيزة، عمارة الأطباء شقة 8',
      scheduledSlot: 'اليوم الساعة 11:30 صباحاً',
      phlebotomistName: 'أ. حسام فوزي (فني سحب متنقل)',
      status: 'en_route',
      statusLabelAr: 'الفني في الطريق للعنوان',
      testsCount: 3,
      testsSummary: 'سكر صائم + وظائف كلى + دهون كاملة',
      tubes: ['أنبوبة رمادية Fluoride', 'أنبوبة صفراء جيل'],
      coolerTemp: 'جاهز للانطلاق',
    },
    {
      id: 'visit-3',
      orderBarcode: 'LAB-2026-1049',
      patientName: 'مدام نادية السيد متولي',
      phone: '01223344556',
      addressAr: 'التجمع الخامس، الحي الثاني، فيلا 34 خلف محكمة الأسرة',
      scheduledSlot: 'اليوم الساعة 02:00 ظهراً',
      phlebotomistName: 'أ. طارق عبد المجيد (فني سحب متنقل)',
      status: 'scheduled',
      statusLabelAr: 'مجدولة بانتظار التحرك',
      testsCount: 1,
      testsSummary: 'السكر التراكمي HbA1c',
      tubes: ['أنبوبة بنفسجية EDTA'],
      coolerTemp: 'جاهز',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/lab" className="hover:text-teal-700 transition">معمل التحاليل</Link>
          <span>/</span>
          <span className="text-teal-800 font-bold">إدارة زيارات السحب المنزلي (Home Phlebotomy)</span>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>🏠</span>
              <span>إدارة خدمة السحب المنزلي المتنقل (Home Visits Hub)</span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              جدولة زيارات سحب العينات لكبار السن والمرضى بالمنازل، تتبع خطوط سير الفنيين، وضمان سلامة العينات المبردة.
            </p>
          </div>
          <Link
            href="/lab/orders/new"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 transition shadow-sm"
          >
            ➕ حجز زيارة سحب جديدة
          </Link>
        </header>

        {/* Home Visits List */}
        <div className="space-y-4">
          {demoVisits.map((visit) => (
            <div
              key={visit.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                    {visit.orderBarcode}
                  </span>
                  <span className="font-bold text-slate-900 text-base">{visit.patientName}</span>
                  <span className="rounded-full bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 font-mono">
                    {visit.phone}
                  </span>
                </div>

                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{visit.addressAr}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>⏰ الموعد: <strong className="text-slate-800">{visit.scheduledSlot}</strong></span>
                  <span>👨‍⚕️ الفني المكلف: <strong className="text-indigo-800">{visit.phlebotomistName}</strong></span>
                  <span>🧊 حالة الحافظة المبردة: <strong className="text-teal-800 font-mono">{visit.coolerTemp}</strong></span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {visit.tubes.map((tb, idx) => (
                    <span key={idx} className="rounded bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 font-medium">
                      🧪 {tb}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 md:border-r border-slate-100 pt-3 md:pt-0 md:pr-4">
                <span className={`rounded-xl px-3 py-1 text-xs font-bold text-center ${
                  visit.status === 'sample_collected'
                    ? 'bg-blue-100 text-blue-900'
                    : visit.status === 'en_route'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {visit.statusLabelAr}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${visit.phone}`}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>📞</span>
                    <span>اتصال</span>
                  </a>
                  <Link
                    href={`/lab/orders/order-101`}
                    className="rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-3 py-1.5 text-xs font-bold transition"
                  >
                    تفاصيل العينة
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
