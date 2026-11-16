'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/session';

export type InventoryFormState = { message: string; success: boolean };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function createInventoryItemAction(
  _previous: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  const name = String(formData.get('name') ?? '').trim();
  const category = String(formData.get('category') ?? 'supplies');
  const unit = String(formData.get('unit') ?? 'piece').trim();
  const quantity = Number(formData.get('quantity_on_hand') ?? 0);
  const reorderLevel = Number(formData.get('reorder_level') ?? 5);
  const costPrice = Number(formData.get('cost_price') ?? 0);
  const sellingPrice = Number(formData.get('selling_price') ?? 0);
  const sku = String(formData.get('sku') ?? '').trim() || null;

  if (name.length < 2) {
    return { message: 'اسم الصنف أو المستلزم الطبي مطلوب.', success: false };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/inventory');
    return { message: 'تمت إضافة الصنف إلى المخزون بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { data: membership } = await supabase
    .from('user_clinic_memberships')
    .select('clinic_id, role')
    .limit(1)
    .maybeSingle();

  if (!membership || !['clinic_owner', 'clinic_admin', 'inventory_manager', 'receptionist', 'nurse', 'doctor'].includes(membership.role)) {
    return { message: 'لا تملك صلاحية إدارة المخزون.', success: false };
  }

  const { error } = await supabase.from('inventory_items').insert({
    clinic_id: membership.clinic_id,
    name,
    category,
    unit,
    quantity_on_hand: Math.max(0, quantity),
    reorder_level: Math.max(0, reorderLevel),
    cost_price: Math.max(0, costPrice),
    selling_price: Math.max(0, sellingPrice),
    sku,
    is_active: true,
  });

  if (error) {
    return { message: `تعذّرت إضافة الصنف: ${error.message}`, success: false };
  }

  revalidatePath('/inventory');
  return { message: 'تمت إضافة الصنف إلى المخزون بنجاح.', success: true };
}

export async function recordMovementAction(
  itemId: string,
  type: string,
  quantity: number,
  unitCost: number,
  notes?: string
): Promise<{ ok: boolean; message: string }> {
  if (!validUuid(itemId) || quantity <= 0) {
    return { ok: false, message: 'بيانات الحركة غير صالحة.' };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/inventory');
    return { ok: true, message: 'تم تحديث الرصيد بنجاح (وضع المعاينة التجريبي).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };

  const { data: newQty, error } = await supabase.rpc('record_inventory_movement_for_current_user', {
    p_item_id: itemId,
    p_movement_type: type,
    p_quantity: quantity,
    p_unit_cost: unitCost,
    p_notes: notes ?? null,
  });

  if (error) {
    return { ok: false, message: `تعذّر تسجيل حركة المخزون: ${error.message}` };
  }

  revalidatePath('/inventory');
  return { ok: true, message: `تم تسجيل حركة المخزون بنجاح (الرصيد الجديد: ${newQty}).` };
}
