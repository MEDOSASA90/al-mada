import { createClient } from '@/lib/supabase/server';
import { DEMO_APPOINTMENTS } from './demo-data';

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  branch_id: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  visit_type: string;
  reason: string | null;
  cancel_reason?: string | null;
  created_at?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_file_number?: string;
  doctor_name?: string;
  branch_name?: string;
};

export async function listAppointmentsForDate(date: string): Promise<Appointment[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_APPOINTMENTS as Appointment[];
  }

  const supabase = await createClient();
  const { data: rawAppts, error } = await supabase
    .from('appointments')
    .select('id,patient_id,doctor_id,branch_id,appointment_date,appointment_time,duration_minutes,status,visit_type,reason,cancel_reason,created_at')
    .eq('appointment_date', date)
    .is('deleted_at', null)
    .order('appointment_time', { ascending: true })
    .limit(200);

  if (error) throw new Error(`listAppointmentsForDate failed: ${error.message}`);
  const appts = (rawAppts ?? []) as Appointment[];
  if (appts.length === 0) return [];

  const patientIds = Array.from(new Set(appts.map((a) => a.patient_id).filter(Boolean)));
  const doctorIds = Array.from(new Set(appts.map((a) => a.doctor_id).filter(Boolean)));
  const branchIds = Array.from(new Set(appts.map((a) => a.branch_id).filter((id): id is string => Boolean(id))));

  const [patientsRes, doctorsRes, branchesRes] = await Promise.all([
    patientIds.length > 0
      ? supabase.from('patients').select('id,full_name,file_number,phone').in('id', patientIds)
      : { data: [] },
    doctorIds.length > 0
      ? supabase.from('staff_profiles').select('id,full_name').in('id', doctorIds)
      : { data: [] },
    branchIds.length > 0
      ? supabase.from('clinic_branches').select('id,name,name_ar').in('id', branchIds)
      : { data: [] },
  ]);

  const patientMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
  const doctorMap = new Map((doctorsRes.data ?? []).map((d) => [d.id, d]));
  const branchMap = new Map((branchesRes.data ?? []).map((b) => [b.id, b]));

  return appts.map((a) => {
    const pat = patientMap.get(a.patient_id);
    const doc = doctorMap.get(a.doctor_id);
    const br = a.branch_id ? branchMap.get(a.branch_id) : undefined;
    return {
      ...a,
      patient_name: pat?.full_name ?? 'مريض',
      patient_phone: pat?.phone ?? '',
      patient_file_number: pat?.file_number ?? '',
      doctor_name: doc?.full_name ?? 'طبيب',
      branch_name: br?.name_ar || br?.name || 'الفرع الرئيسي',
    };
  });
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const found = DEMO_APPOINTMENTS.find((a) => a.id === id) || DEMO_APPOINTMENTS[0];
    return (found ?? null) as Appointment | null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id,patient_id,doctor_id,branch_id,appointment_date,appointment_time,duration_minutes,status,visit_type,reason,cancel_reason,created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;

  const appt = data as Appointment;
  const [patientRes, doctorRes] = await Promise.all([
    supabase.from('patients').select('full_name,phone,file_number').eq('id', appt.patient_id).maybeSingle(),
    supabase.from('staff_profiles').select('full_name').eq('id', appt.doctor_id).maybeSingle(),
  ]);

  return {
    ...appt,
    patient_name: patientRes.data?.full_name ?? 'مريض',
    patient_phone: patientRes.data?.phone ?? '',
    patient_file_number: patientRes.data?.file_number ?? '',
    doctor_name: doctorRes.data?.full_name ?? 'طبيب',
  };
}

export async function countAppointmentsForToday(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_APPOINTMENTS.length;
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_date', today)
    .is('deleted_at', null);

  if (error) return 0;
  return count ?? 0;
}
