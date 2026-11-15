'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ClinicalFormState = { message: string; success: boolean };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function saveConsultationAction(
  _previous: ClinicalFormState,
  formData: FormData
): Promise<ClinicalFormState> {
  const patientId = String(formData.get('patient_id') ?? '');
  const doctorId = String(formData.get('doctor_id') ?? '');
  const appointmentId = String(formData.get('appointment_id') ?? '') || null;
  const recordId = String(formData.get('record_id') ?? '') || null;

  const chiefComplaint = String(formData.get('chief_complaint') ?? '').trim() || null;
  const diagnosis = String(formData.get('diagnosis') ?? '').trim() || null;
  const treatmentPlan = String(formData.get('treatment_plan') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  // Vitals
  const bp = String(formData.get('vitals_bp') ?? '').trim();
  const hr = String(formData.get('vitals_hr') ?? '').trim();
  const temp = String(formData.get('vitals_temp') ?? '').trim();
  const weight = String(formData.get('vitals_weight') ?? '').trim();
  const height = String(formData.get('vitals_height') ?? '').trim();

  const vitals: Record<string, string> = {};
  if (bp) vitals.blood_pressure = bp;
  if (hr) vitals.heart_rate = hr;
  if (temp) vitals.temperature = temp;
  if (weight) vitals.weight = weight;
  if (height) vitals.height = height;

  if (!validUuid(patientId) || !validUuid(doctorId)) {
    return { message: 'بيانات المريض أو الطبيب غير صالحة.', success: false };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (appointmentId) revalidatePath(`/clinical/${appointmentId}`);
    return { message: 'تم حفظ الكشف الطبي بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('save_medical_record_for_current_user', {
    p_patient_id: patientId,
    p_doctor_id: doctorId,
    p_appointment_id: appointmentId,
    p_chief_complaint: chiefComplaint,
    p_diagnosis: diagnosis,
    p_treatment_plan: treatmentPlan,
    p_notes: notes,
    p_vitals: vitals,
    p_record_id: recordId,
  });

  if (error) {
    return { message: `تعذّر حفظ السجل الطبي: ${error.message}`, success: false };
  }

  if (appointmentId) revalidatePath(`/clinical/${appointmentId}`);
  revalidatePath(`/patients/${patientId}`);
  revalidatePath('/appointments');
  return { message: 'تم حفظ بيانات الكشف الطبي ومسودة التقرير بنجاح.', success: true };
}

export async function lockConsultationAction(recordId: string, appointmentId?: string): Promise<ClinicalFormState> {
  if (!validUuid(recordId)) return { message: 'معرّف السجل غير صالح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (appointmentId) revalidatePath(`/clinical/${appointmentId}`);
    return { message: 'تم اعتماد وقفل السجل الطبي كنسخة نهائية (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('lock_medical_record_for_current_user', {
    p_record_id: recordId,
  });

  if (error) {
    return { message: 'تعذّر اعتماد وقفل السجل الطبي.', success: false };
  }

  if (appointmentId) revalidatePath(`/clinical/${appointmentId}`);
  revalidatePath('/appointments');
  return { message: 'تم اعتماد وقفل السجل الطبي كنسخة نهائية غير قابلة للتعديل.', success: true };
}
