'use server';

import { getCurrentSession } from '@/lib/session';
import { setFeatureFlag, listFeatureFlags, type FeatureFlagKey } from '@/lib/feature-flags';

export async function toggleFeatureFlagAction(
  flagKey: FeatureFlagKey,
  enabled: boolean
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, message: 'انتهت الجلسة، برجاء تسجيل الدخول أولاً.' };
    }

    const { role } = session.membership;
    if (!['clinic_owner', 'clinic_admin'].includes(role)) {
      return { success: false, message: 'غير مصرح لك بتغيير ميزات العيادة.' };
    }

    const updated = setFeatureFlag(flagKey, enabled);
    if (!updated) {
      return { success: false, message: 'الميزة غير موجودة بالنظام.' };
    }

    return {
      success: true,
      message: enabled
        ? 'تم تفعيل الميزة بنجاح على مستوى العيادة.'
        : 'تم تعطيل الميزة بنجاح من لوحة الإطلاق التدريجي.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'فشل تغيير حالة الميزة.',
    };
  }
}
