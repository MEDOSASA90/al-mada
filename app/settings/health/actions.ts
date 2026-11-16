'use server';

import { getCurrentSession } from '@/lib/session';
import { checkSystemHealth, type SystemHealthReport } from '@/lib/health';

export async function runDiagnosticsAction(): Promise<{
  success: boolean;
  report?: SystemHealthReport;
  message: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, message: 'انتهت الجلسة، برجاء تسجيل الدخول أولاً.' };
    }

    const { role } = session.membership;
    if (!['clinic_owner', 'clinic_admin'].includes(role)) {
      return { success: false, message: 'غير مصرح لك بإجراء الفحص التشخيصي للنظام.' };
    }

    const report = await checkSystemHealth();

    return {
      success: true,
      report,
      message: 'تم استكمال الفحص التشخيصي الشامل لكافة خدمات النظام والتحقق من الجاهزية بنجاح.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'تعذّر إتمام الفحص التشخيصي.',
    };
  }
}
