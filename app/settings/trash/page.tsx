import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listTrashItems } from '@/lib/trash';
import { RestoreButton } from './restore-button';

export const dynamic = 'force-dynamic';

export default async function TrashPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { membership } = session;
  if (!['clinic_owner', 'clinic_admin'].includes(membership.role)) {
    redirect('/');
  }

  const trashItems = await listTrashItems();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
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
              <span>سلة المحذوفات والأرشفة</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">سلة محذوفات العيادة (Recycle Bin)</h1>
            <p className="mt-1 text-sm text-slate-600">
              الملفات المؤرشفة والمحذوفة مؤقتًا. يتم الاحتفاظ بها لمدة 30 يومًا قبل الحذف النهائي، ويمكن استعادتها بضغطة زر.
            </p>
          </div>
          <Link href="/settings/export" className="secondary-button text-sm">
            مركز التصدير ←
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">العناصر المؤرشفة والمحذوفة ({trashItems.length})</h2>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              سياسة الحفظ: 30 يوماً
            </span>
          </div>

          {trashItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {trashItems.map((item) => (
                <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      تاريخ الأرشفة: {new Date(item.deleted_at).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <RestoreButton itemId={item.id} itemType={item.item_type} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              سلة المحذوفات فارغة حاليًا. جميع ملفات العيادة نشطة.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
