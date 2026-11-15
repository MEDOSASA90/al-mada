'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function restoreTrashItemAction(itemId: string, itemType: string) {
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) {
    return { ok: false, message: 'معرّف السجل غير صالح.' };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/settings/trash');
    revalidatePath('/patients');
    return { ok: true, message: 'تمت استعادة السجل وإعادته إلى قائمة السجلات النشطة (وضع المعاينة التجريبي).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };

  const { error } = await supabase.rpc('restore_trash_item_for_current_user', {
    p_item_id: itemId,
    p_item_type: itemType,
  });

  if (error) {
    return { ok: false, message: `تعذّرت استعادة السجل: ${error.message}` };
  }

  revalidatePath('/settings/trash');
  revalidatePath('/patients');
  return { ok: true, message: 'تمت استعادة السجل بنجاح وإعادته إلى العمل.' };
}
