import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SettingsHubPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership, clinic } = session;
  const isOwner = ['clinic_owner', 'clinic_admin'].includes(membership.role);
  const isReceptionist = membership.role === 'receptionist';

  const settingsCards = [
    {
      title: 'إطلاق الميزات والتحكم في التوسع (Feature Flags)',
      description: 'إدارة تشغيل وإيقاف الميزات التخصصية وسوق المستلزمات والتحكم في الإطلاق التدريجي.',
      icon: '🎛️',
      href: '/settings/feature-flags',
      badge: 'المرحلة 8',
      ownerOnly: true,
    },
    {
      title: 'الحزم والقوالب التخصصية (Specialty Packs)',
      description: 'حاسبات النساء والتوليد وحساب الحمل EDD، جدول تطعيمات الأطفال المصري، وضوابط جلسات الليزر.',
      icon: '🩺',
      href: '/settings/specialties',
      badge: 'المرحلة 8',
      ownerOnly: false,
    },
    {
      title: 'صحة النظام وجاهزية الإطلاق التشغيلي',
      description: 'فحص تشخيصي فوري لقاعدة البيانات، سياسات عزل المستأجرين، زمن الاستجابة، والامتثال لقانون 151.',
      icon: '🛡️',
      href: '/settings/health',
      badge: 'المرحلة 7',
      ownerOnly: true,
    },
    {
      title: 'منظومة الذكاء الاصطناعي والمساعد التنفيذي',
      description: 'ضبط نماذج الذكاء الاصطناعي، الاستعلام باللغة الطبيعية عن أداء العيادة، ومراقبة استهلاك الرموز.',
      icon: '🤖',
      href: '/settings/ai',
      badge: 'المرحلة 6',
      ownerOnly: true,
    },
    {
      title: 'إدارة الطاقم الطبي والإداري',
      description: 'إضافة وتعديل الأطباء، التمريض، موظفي الاستقبال، نسب أتعاب الأطباء والصلاحيات.',
      icon: '👥',
      href: '/settings/staff',
      badge: 'التحكم الإداري',
      ownerOnly: true,
    },
    {
      title: 'الفروع ومصفوفة الدوام',
      description: 'إدارة الفروع، مواعيد العمل الأسبوعية، ربط خرائط جوجل، وتوزيع نوبات الأطباء.',
      icon: '🏢',
      href: '/settings/branches',
      badge: 'متعدد الفروع',
      ownerOnly: true,
    },
    {
      title: 'التنبيهات وقوالب الواتساب',
      description: 'تخصيص رسائل تذكير المواعيد، تنبيهات استدعاء المرضى في الطابور، ومتابعة الجلسات.',
      icon: '💬',
      href: '/settings/notifications',
      badge: 'واتساب مباشر',
      ownerOnly: true,
    },
    {
      title: 'الاشتراك والباقة السحابية',
      description: 'متابعة خطة العيادة (الأساسية / المتقدمة / الاحترافية)، مدة الصلاحية وتفاصيل الدفع.',
      icon: '💳',
      href: '/settings/subscription',
      badge: 'الخطة النشطة',
      ownerOnly: true,
    },
    {
      title: 'النسخ الاحتياطي وتصدير البيانات',
      description: 'تنزيل نسخة احتياطية فورية وشاملة لكافة سجلات المرضى والمواعيد والفواتير بصيغة JSON.',
      icon: '💾',
      href: '/settings/export',
      badge: 'أمان البيانات',
      ownerOnly: true,
    },
    {
      title: 'سلة المحذوفات والأرشفة',
      description: 'مراجعة واسترجاع السجلات المحذوفة والمؤرشفة وفق معايير الحماية وقانون حماية البيانات.',
      icon: '🗑️',
      href: '/settings/trash',
      badge: 'استرجاع فوري',
      ownerOnly: true,
    },
    {
      title: 'طلبات ربط حسابات المرضى',
      description: 'مراجعة واعتماد طلبات المرضى للدخول على بوابتهم الصحية وسجلاتهم الطبية عن بُعد.',
      icon: '🔗',
      href: '/settings/patient-links',
      badge: 'بوابة المرضى',
      ownerOnly: false,
    },
  ];

  const visibleCards = isOwner
    ? settingsCards
    : isReceptionist
    ? settingsCards.filter((c) => !c.ownerOnly)
    : [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Link href="/" className="text-teal-800 hover:underline">
                  ← لوحة العيادة
                </Link>
                <span>/</span>
                <span>إعدادات النظام</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                مركز إعدادات العيادة والنظام
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                التحكم المركزي في هوية {clinic?.name_ar || clinic?.name || 'العيادة'}، الصلاحيات، الفروع، وقنوات التواصل.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span>حساب موثق: {membership.role === 'clinic_owner' ? 'مالك العيادة' : membership.role === 'doctor' ? 'طبيب' : 'استقبال'}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl border border-teal-100 group-hover:scale-105 transition">
                    {card.icon}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base group-hover:text-teal-800 transition">
                      {card.title}
                    </h2>
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {card.badge}
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700 group-hover:translate-x-[-4px] transition text-lg">
                  ←
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {card.description}
              </p>
            </Link>
          ))}
        </section>

        {/* Quick Clinic Info Footer */}
        <footer className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div>
            المنشأة: <strong className="text-slate-800">{clinic?.name_ar || 'عيادة المدى التخصصية'}</strong> · ترخيص وزارة الصحة المصرية
          </div>
          <div>
            معايير الخصوصية: <span className="font-semibold text-emerald-700">متوافق مع القانون 151 لسنة 2020 لحماية البيانات الشخصية</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
