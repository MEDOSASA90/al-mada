'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function reviewPatientLink(requestId: string, approve: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, message: 'الطلب غير متاح.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('review_patient_portal_link_request', {
    p_request_id: requestId,
    p_approve: approve,
  });
  if (error) return { ok: false, message: 'تعذّرت مراجعة الطلب أو لا توجد صلاحية.' };
  revalidatePath('/settings/patient-links');
  revalidatePath('/portal');
  return { ok: true, message: approve ? 'تم ربط الحساب بالملف.' : 'تم رفض الطلب.' };
}
