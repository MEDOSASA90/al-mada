'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function advanceTicketAction(ticketId: string, status: string) {
  if (!/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return { ok: false, message: 'معرّف التذكرة غير صالح.' };
  }
  if (!['called', 'in_service', 'done', 'skipped', 'cancelled'].includes(status)) {
    return { ok: false, message: 'الحالة غير صالحة.' };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/queue');
    return { ok: true, message: 'تم تحديث دور المريض في الطابور (وضع المعاينة التجريبي).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };

  const { error } = await supabase.rpc('advance_queue_ticket_status', {
    p_ticket_id: ticketId,
    p_new_status: status,
  });

  if (error) {
    return { ok: false, message: 'تعذّر تحديث حالة التذكرة.' };
  }

  revalidatePath('/queue');
  revalidatePath('/appointments');
  return { ok: true, message: 'تم تحديث دور المريض في الطابور.' };
}
