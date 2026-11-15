'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type PatientFormState = { message: string; success: boolean };

export async function addPatient(_previous: PatientFormState, formData: FormData): Promise<PatientFormState> {
  const full_name = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim() || null;
  const gender = String(formData.get('gender') ?? '') || null;
  const birth_date = String(formData.get('birth_date') ?? '') || null;
  if (full_name.length < 2 || full_name.length > 160) return { message: 'اكتب اسمًا من حرفين إلى 160 حرفًا.', success: false };
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) return { message: 'رقم الهاتف غير صالح.', success: false };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: 'البريد الإلكتروني غير صالح.', success: false };
  if (gender && !['male', 'female', 'other'].includes(gender)) return { message: 'اختيار النوع غير صالح.', success: false };
  if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) return { message: 'تاريخ الميلاد غير صالح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/patients');
    revalidatePath('/');
    return { message: 'تم تسجيل المريض بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };
  const { error } = await supabase.rpc('create_patient_for_current_user', {
    p_full_name: full_name,
    p_phone: phone,
    p_email: email,
    p_gender: gender,
    p_birth_date: birth_date,
  });
  if (error) return { message: error.code === '23505' ? 'يوجد سجل مطابق بالفعل.' : 'تعذّرت إضافة المريض. راجع البيانات وحاول مرة أخرى.', success: false };
  revalidatePath('/');
  return { message: 'تم تسجيل المريض بنجاح.', success: true };
}

export async function updatePatientAction(_previous: PatientFormState, formData: FormData): Promise<PatientFormState> {
  const id = String(formData.get('id') ?? '');
  const full_name = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim() || null;
  const gender = String(formData.get('gender') ?? '') || null;
  const birth_date = String(formData.get('birth_date') ?? '') || null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { message: 'ملف المريض غير متاح.', success: false };
  if (full_name.length < 2 || full_name.length > 160) return { message: 'اكتب اسمًا من حرفين إلى 160 حرفًا.', success: false };
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) return { message: 'رقم الهاتف غير صالح.', success: false };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: 'البريد الإلكتروني غير صالح.', success: false };
  if (gender && !['male', 'female', 'other'].includes(gender)) return { message: 'اختيار النوع غير صالح.', success: false };
  if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) return { message: 'تاريخ الميلاد غير صالح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/patients');
    revalidatePath('/');
    return { message: 'تم تسجيل المريض بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };
  const { error } = await supabase.rpc('update_patient_for_current_user', {
    p_id: id, p_full_name: full_name, p_phone: phone, p_email: email,
    p_gender: gender, p_birth_date: birth_date,
  });
  if (error) return { message: 'تعذّر حفظ التعديلات. راجع البيانات والصلاحيات.', success: false };
  revalidatePath('/');
  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  return { message: 'تم تحديث بيانات المريض.', success: true };
}

export async function archivePatientAction(_previous: PatientFormState, formData: FormData): Promise<PatientFormState> {
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { message: 'ملف المريض غير متاح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/');
    revalidatePath('/patients');
    return { message: 'تمت أرشفة ملف المريض بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };
  const { error } = await supabase.rpc('archive_patient_for_current_user', { p_id: id });
  if (error) return { message: 'تعذّرت أرشفة الملف أو لا تملك الصلاحية.', success: false };
  revalidatePath('/');
  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  return { message: 'تمت أرشفة ملف المريض وإخفاؤه من القائمة النشطة.', success: true };
}
