'use server';

import { createClient } from '@/lib/supabase/server';

export type PortalFileResult = { url?: string; error?: string };

export async function createPortalAttachmentUrl(attachmentId: string): Promise<PortalFileResult> {
  if (!/^[0-9a-f-]{36}$/i.test(attachmentId)) return { error: 'الملف غير متاح.' };
  const supabase = await createClient();
  const { data: path, error: accessError } = await supabase.rpc('get_my_patient_attachment_path', {
    p_attachment_id: attachmentId,
  });
  if (accessError || typeof path !== 'string') return { error: 'الملف غير متاح لهذا الحساب.' };

  const { data, error } = await supabase.storage
    .from('private-clinical')
    .createSignedUrl(path, 120);
  if (error || !data?.signedUrl) return { error: 'تعذّر إنشاء رابط آمن. حاول مرة أخرى.' };
  return { url: data.signedUrl };
}
