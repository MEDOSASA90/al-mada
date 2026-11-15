import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { listInventoryItems } from '@/lib/inventory';
import { InventoryItemForm } from './item-form';
import { MovementDialog } from './movement-dialog';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const items = await listInventoryItems();

  const lowStockItems = items.filter((it) => it.quantity_on_hand <= it.reorder_level);
  const totalStockValue = items.reduce((sum, it) => sum + (it.quantity_on_hand * it.cost_price), 0);

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
              متابعة أرصدة الأدوية، السرنجات، المستلزمات الطبية، وتنبيهات النواقص.
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs text-slate-500">إجمالي الأصناف المسجلة</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{items.length}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
            <p className="text-xs text-amber-900 font-medium">أصناف قاربت على النفاد (نواقص)</p>
            <p className="mt-1 text-3xl font-extrabold text-amber-950">{lowStockItems.length}</p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-5 shadow-xs">
            <p className="text-xs text-teal-800">إجمالي القيمة التقديرية للمخزون</p>
            <p className="mt-1 text-3xl font-extrabold text-teal-950 font-mono">
              {totalStockValue.toLocaleString('ar-EG')} <span className="text-sm font-sans">ج.م</span>
            </p>
          </div>
        </section>

        {/* Create Form */}
        <InventoryItemForm />

        {/* Items Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">قائمة الأصناف والمستلزمات</h2>
            <span className="text-xs text-slate-500">{items.length} صنف</span>
          </div>

          {items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              لا توجد أصناف في المخزن بعد. استخدم النموذج أعلاه لتعريف أول صنف.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((it) => {
                const isLow = it.quantity_on_hand <= it.reorder_level;

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
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            منخفض (حد الطلب: {it.reorder_level})
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        <span>
                          الرصيد الحالي:{' '}
                          <strong className={`font-mono text-sm ${isLow ? 'text-rose-700' : 'text-slate-800'}`}>
                            {it.quantity_on_hand} {it.unit}
                          </strong>
                        </span>
                        {it.cost_price > 0 && <span>سعر التكلفة: {it.cost_price} ج.م</span>}
                        {it.sku && <span>كود: {it.sku}</span>}
                      </div>
                    </div>

                    <div>
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
