'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AppointmentFormState = { message: string; success: boolean };

function validUuid(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

export async function createDoctorAction(_previous: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const full_name = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim() || null;
  const license = String(formData.get('license_number') ?? '').trim() || null;

  if (full_name.length < 2 || full_name.length > 160) {
    return { message: 'اكتب اسم الطبيب من حرفين إلى 160 حرفًا.', success: false };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/appointments');
    return { message: 'تمت إضافة الطبيب بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('create_doctor_for_current_user', {
    p_full_name: full_name,
    p_phone: phone,
    p_email: email,
    p_specialty_id: null,
    p_license_number: license,
  });

  if (error) {
    return { message: 'تعذّرت إضافة الطبيب. تأكد من صلاحيات حسابك كمالك أو مدير للعيادة.', success: false };
  }

  revalidatePath('/appointments');
  revalidatePath('/');
  return { message: 'تمت إضافة الطبيب بنجاح ويمكن الآن حجز مواعيد له.', success: true };
}

export async function createAppointmentAction(_previous: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const patient_id = String(formData.get('patient_id') ?? '');
  const doctor_id = String(formData.get('doctor_id') ?? '');
  const branch_id = String(formData.get('branch_id') ?? '') || null;
  const date = String(formData.get('appointment_date') ?? '');
  const time = String(formData.get('appointment_time') ?? '');
  const duration = Number(formData.get('duration_minutes') ?? 30);
  const visit_type = String(formData.get('visit_type') ?? 'clinic');
  const reason = String(formData.get('reason') ?? '').trim() || null;

  if (!validUuid(patient_id) || !validUuid(doctor_id) || (branch_id && !validUuid(branch_id))) {
    return { message: 'اختر المريض والطبيب والفرع من القوائم.', success: false };
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { message: 'تاريخ الموعد غير صالح.', success: false };
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return { message: 'وقت الموعد غير صالح.', success: false };
  if (!Number.isInteger(duration) || duration < 5 || duration > 240) return { message: 'مدة الموعد يجب أن تكون من 5 إلى 240 دقيقة.', success: false };
  if (!['clinic', 'telemedicine', 'home', 'emergency'].includes(visit_type)) return { message: 'نوع الزيارة غير صالح.', success: false };
  if (reason && reason.length > 500) return { message: 'سبب الزيارة أطول من المسموح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/appointments');
    return { message: 'تم حجز الموعد بنجاح (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };
  const { error } = await supabase.rpc('create_appointment_for_current_user', {
    p_patient_id: patient_id, p_doctor_id: doctor_id, p_appointment_date: date,
    p_appointment_time: time, p_duration_minutes: duration, p_visit_type: visit_type,
    p_reason: reason, p_branch_id: branch_id,
  });
  if (error) {
    const message = error.message.toLowerCase().includes('overlapping')
      ? 'للطبيب موعد آخر يتداخل مع هذا التوقيت.'
      : 'تعذّر حجز الموعد. تأكد من المريض والطبيب والفرع وحاول مرة أخرى.';
    return { message, success: false };
  }
  revalidatePath('/appointments');
  revalidatePath('/');
  return { message: 'تم حجز الموعد وإضافته إلى جدول العيادة.', success: true };
}

export async function changeAppointmentStatusAction(_previous: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!validUuid(id) || !['confirmed', 'canceled', 'no_show'].includes(status)) return { message: 'الطلب غير صالح.', success: false };
  const reason = String(formData.get('reason') ?? '').trim() || null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/appointments');
    return { message: 'تم تحديث حالة الموعد (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };
  const { error } = await supabase.rpc('change_appointment_status_for_current_user', {
    p_appointment_id: id, p_new_status: status, p_cancel_reason: reason,
  });
  if (error) return { message: 'تعذّر تغيير حالة الموعد أو لا تملك الصلاحية.', success: false };
  revalidatePath('/appointments');
  return { message: 'تم تحديث حالة الموعد.', success: true };
}

export async function issueQueueTicketAction(appointmentId: string): Promise<AppointmentFormState> {
  if (!validUuid(appointmentId)) return { message: 'معرّف الموعد غير صالح.', success: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    revalidatePath('/appointments');
    revalidatePath('/queue');
    return { message: 'تم إصدار تذكرة انتظار رقم #4 وإدراج المريض في الطابور (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { data: ticketNum, error } = await supabase.rpc('issue_queue_ticket_for_appointment', {
    p_appointment_id: appointmentId,
  });

  if (error) {
    return { message: 'تعذّر إصدار تذكرة انتظار لهذا الموعد.', success: false };
  }

  revalidatePath('/appointments');
  revalidatePath('/queue');
  return { message: `تم إصدار تذكرة انتظار رقم #${ticketNum} وإدراج المريض في الطابور.`, success: true };
}
