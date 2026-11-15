'use server';

import { createClient } from '@/lib/supabase/server';

export type PortalLinkRequestState = { message: string; submitted: boolean };

export async function requestPortalLink(_previous: PortalLinkRequestState, formData: FormData): Promise<PortalLinkRequestState> {
  const clinicSlug = String(formData.get('clinic_slug') ?? '').trim().toLowerCase();
  const fileNumber = String(formData.get('file_number') ?? '').trim();
  const birthDate = String(formData.get('birth_date') ?? '');
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(clinicSlug) || fileNumber.length < 1 || fileNumber.length > 50 || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { message: 'راجع البيانات المدخلة وحاول مرة أخرى.', submitted: false };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'سجّل الدخول بحساب موثق بالبريد أولًا.', submitted: false };
  const { error } = await supabase.rpc('request_patient_portal_link', {
    p_clinic_slug: clinicSlug,
    p_file_number: fileNumber,
    p_birth_date: birthDate,
  });
  if (error) return { message: 'تعذّر إرسال الطلب الآن. حاول مرة أخرى لاحقًا.', submitted: false };
  return { message: 'لو البيانات تطابق ملفًا مسجلًا وبريدًا موثقًا، سيصل الطلب للعيادة لمراجعته. لن نكشف نتيجة المطابقة هنا.', submitted: true };
}
