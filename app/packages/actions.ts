'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type PackageFormState = { message: string; success: boolean };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function createPackageAction(
  _previous: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
  const patientId = String(formData.get('patient_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const totalSessions = Number(formData.get('total_sessions') ?? 1);
  const price = Number(formData.get('price') ?? 0);
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const validUntil = String(formData.get('valid_until') ?? '') || null;

  if (!validUuid(patientId) || name.length < 2 || totalSessions <= 0) {
    return { message: 'راجع بيانات الباقة المدخلة (الاسم وعدد الجلسات مطلوبان).', success: false };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/packages');
    return { message: 'تم اشتراك المريض في باقة الجلسات بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('create_patient_package_for_current_user', {
    p_patient_id: patientId,
    p_name: name,
    p_total_sessions: totalSessions,
    p_price: price,
    p_notes: notes,
    p_valid_until: validUntil,
  });

  if (error) {
    return { message: `تعذّر إنشاء الباقة: ${error.message}`, success: false };
  }

  revalidatePath('/packages');
  revalidatePath(`/patients/${patientId}`);
  return { message: 'تم اشتراك المريض في باقة الجلسات بنجاح.', success: true };
}

export async function consumeSessionAction(packageId: string): Promise<PackageFormState> {
  if (!validUuid(packageId)) {
    return { message: 'معرّف الباقة غير صالح.', success: false };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/packages');
    return { message: 'تم تسجيل استخدام الجلسة بنجاح (المتبقي: 3 جلسات) (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { data: remaining, error } = await supabase.rpc('consume_package_session_for_current_user', {
    p_package_id: packageId,
  });

  if (error) {
    return { message: `تعذّر خصم الجلسة: ${error.message}`, success: false };
  }

  revalidatePath('/packages');
  return { message: `تم تسجيل استخدام الجلسة بنجاح (المتبقي: ${remaining} جلسة).`, success: true };
}
