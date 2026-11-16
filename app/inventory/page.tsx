import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listInventoryItems } from '@/lib/inventory';
import { InventoryItemForm } from './item-form';
import { MovementDialog } from './movement-dialog';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { filter } = await searchParams;
  const allItems = await listInventoryItems();

  const lowStockItems = allItems.filter((it) => it.quantity_on_hand <= it.reorder_level);
  const totalStockValue = allItems.reduce((sum, it) => sum + it.quantity_on_hand * it.cost_price, 0);

  const items =
    filter === 'low'
      ? lowStockItems
      : filter === 'medication'
      ? allItems.filter((it) => it.category === 'medication')
      : filter === 'supplies'
      ? allItems.filter((it) => it.category === 'supplies' || it.category === 'consumables')
      : allItems;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="text-teal-800 hover:underline">
                ← لوحة العيادة
              </Link>
              <span>/</span>
              <span>المخزون والمستلزمات</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              إدارة المخزون والمستلزمات الطبية
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              متابعة أرصدة الأدوية، السرنجات، المستلزمات الطبية، وتنبيهات النواقص وإعادة الطلب.
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/inventory"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition"
          >
            <p className="text-xs text-slate-500">إجمالي الأصناف المسجلة</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{allItems.length}</p>
          </Link>
          <Link
            href="/inventory?filter=low"
            className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs hover:border-amber-300 transition"
          >
            <p className="text-xs text-amber-900 font-medium">أصناف قاربت على النفاد (نواقص عاجلة)</p>
            <p className="mt-1 text-3xl font-extrabold text-amber-950">{lowStockItems.length}</p>
          </Link>
          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-5 shadow-xs">
            <p className="text-xs text-teal-800">إجمالي القيمة التقديرية للمخزون</p>
            <p className="mt-1 text-3xl font-extrabold text-teal-950 font-mono">
              {totalStockValue.toLocaleString('ar-EG')} <span className="text-sm font-sans">ج.م</span>
            </p>
          </div>
        </section>

        {/* Create Form */}
        <InventoryItemForm />

        {/* Filter Navigation & Items Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="font-semibold text-slate-900">
                قائمة الأصناف والمستلزمات ({items.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إمكانية تسجيل حركات الصرف والإضافة وتوريد النواقص فوراً.
              </p>
            </div>

            {/* Filter Pills */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs">
              <Link
                href="/inventory"
                className={`rounded-lg px-3 py-1 font-semibold border transition ${
                  !filter ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                الكل ({allItems.length})
              </Link>
              <Link
                href="/inventory?filter=low"
                className={`rounded-lg px-3 py-1 font-semibold border transition ${
                  filter === 'low' ? 'bg-amber-800 text-white border-amber-800' : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                ⚠️ نواقص عاجلة ({lowStockItems.length})
              </Link>
              <Link
                href="/inventory?filter=medication"
                className={`rounded-lg px-3 py-1 font-semibold border transition ${
                  filter === 'medication' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                💊 أدوية
              </Link>
              <Link
                href="/inventory?filter=supplies"
                className={`rounded-lg px-3 py-1 font-semibold border transition ${
                  filter === 'supplies' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🩹 مستلزمات
              </Link>
            </nav>
          </div>

          {items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              لا توجد أصناف مطابقة لهذا التصنيف.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((it) => {
                const isLow = it.quantity_on_hand <= it.reorder_level;

                const reorderMsg = encodeURIComponent(
                  `مساء الخير، نود طلب توريد عاجل لصنف: ${it.name} لعيادة المدى. الكمية المقترحة: ${Math.max(50, it.reorder_level * 5)} ${it.unit}. برجاء تأكيد التوافر وسعر التوريد وموعد التسليم.`
                );

                return (
                  <div
                    key={it.id}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{it.name}</h3>
                        <CategoryBadge category={it.category} />
                        {isLow && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            ⚠️ منخفض (حد الطلب: {it.reorder_level})
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        <span>
                          الرصيد الحالي:{' '}
                          <strong className={`font-mono text-sm ${isLow ? 'text-rose-700 font-bold' : 'text-slate-800'}`}>
                            {it.quantity_on_hand} {it.unit}
                          </strong>
                        </span>
                        {it.cost_price > 0 && <span>سعر التكلفة: {it.cost_price} ج.م</span>}
                        {it.sku && <span>كود: {it.sku}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isLow && (
                        <a
                          href={`https://wa.me/?text=${reorderMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                          title="إرسال طلب توريد سريع لمورد المستلزمات الطبية عبر واتساب"
                        >
                          <span>📦</span>
                          <span>طلب توريد (واتساب)</span>
                        </a>
                      )}
                      <MovementDialog
                        itemId={it.id}
                        itemName={it.name}
                        currentQty={it.quantity_on_hand}
                        unit={it.unit}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    supplies: 'مستلزمات',
    medication: 'أدوية',
    consumables: 'مستهلكات',
    equipment: 'أدوات',
  };
  return (
    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
      {labels[category] ?? category}
    </span>
  );
}
