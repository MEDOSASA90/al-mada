'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/session';

export type ExportFormState = { message: string; success: boolean; downloadJson?: string };

export async function requestExportAction(
  _previous: ExportFormState,
  formData: FormData
): Promise<ExportFormState> {
  const exportType = String(formData.get('export_type') ?? 'full_backup');

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/settings/export');
    return {
      message: 'تم تجهيز حزمة التصدير بنجاح وجاهزة للتحميل الفوري (وضع المعاينة).',
      success: true,
      downloadJson: JSON.stringify({
        exported_at: new Date().toISOString(),
        note: 'Al-Mada Synthetic Egyptian Clinic Export',
        export_type: exportType,
        total_records: 12,
      }, null, 2),
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('generate_clinic_export_for_current_user', {
    p_export_type: exportType,
  });

  if (error) {
    return { message: `تعذّر إنشاء ملف التصدير: ${error.message}`, success: false };
  }

  revalidatePath('/settings/export');
  return { message: 'تم إنشاء حزمة التصدير بنجاح وأرشفتها في سجل النسخ.', success: true };
}
