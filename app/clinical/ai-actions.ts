'use server';

import { getCurrentSession } from '@/lib/session';
import {
  generateClinicalDraft,
  generatePatientHistorySummary,
  askExecutiveAssistant,
  toggleAIStatus,
  getAIStatus,
  type ClinicalAIDraft,
  type ExecutiveQueryResponse,
} from '@/lib/ai';

export async function generateClinicalDraftAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  draft?: ClinicalAIDraft;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, message: 'انتهت الجلسة، برجاء تسجيل الدخول أولاً.' };
    }

    const rawNotes = (formData.get('raw_notes') as string) || '';
    const appointmentId = (formData.get('appointment_id') as string) || '';
    const patientId = (formData.get('patient_id') as string) || '';
    const doctorName = (formData.get('doctor_name') as string) || '';

    if (!rawNotes.trim()) {
      return { success: false, message: 'برجاء كتابة أو إملاء ملاحظات الكشف أولاً.' };
    }

    const draft = await generateClinicalDraft({
      rawNotes,
      appointmentId,
      patientId,
      doctorName,
    });

    return {
      success: true,
      message: 'تم توليد مسودة الكشف الطبي بنجاح بواسطة المساعد الذكي.',
      draft,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'تعذّر توليد مسودة الكشف.',
    };
  }
}

export async function getPatientHistorySummaryAction(patientId: string) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error('انتهت الجلسة.');

    const summary = await generatePatientHistorySummary(patientId);
    return { success: true, summary };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'تعذّر تلخيص التاريخ المرضي.',
    };
  }
}

export async function askExecutiveAssistantAction(question: string): Promise<{
  success: boolean;
  response?: ExecutiveQueryResponse;
  message?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, message: 'انتهت الجلسة.' };
    }

    const role = session.membership.role;
    if (!['clinic_owner', 'clinic_admin'].includes(role)) {
      return { success: false, message: 'عذراً، المساعد التنفيذي متاح فقط لمالك وإدارة العيادة.' };
    }

    const response = await askExecutiveAssistant(question);
    return { success: true, response };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة السؤال.',
    };
  }
}

export async function toggleAIKillSwitchAction(enabled?: boolean) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error('انتهت الجلسة.');

    const role = session.membership.role;
    if (!['clinic_owner', 'clinic_admin'].includes(role)) {
      throw new Error('غير مصرح لك بتغيير حالة منظومة الذكاء الاصطناعي.');
    }

    const newState = toggleAIStatus(enabled);
    const status = getAIStatus();

    return {
      success: true,
      isEnabled: newState,
      status,
      message: newState
        ? 'تم تفعيل منظومة الذكاء الاصطناعي بنجاح لكافة مستخدمي العيادة.'
        : 'تم تعطيل منظومة الذكاء الاصطناعي بنجاح (Kill-Switch Active).',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'فشل تغيير حالة الذكاء الاصطناعي.',
    };
  }
}
