import { createClient } from '@/lib/supabase/server';
import { DEMO_MEDICAL_RECORDS } from './demo-data';
import { isDemoSession } from './session';

export type PrescriptionItem = {
  id?: string;
  medication_name: string;
  form?: string;
  dose?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  instructions?: string;
};

export type MedicalRecord = {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  record_type: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  prescription_items?: PrescriptionItem[];
  notes: string | null;
  vitals: {
    blood_pressure?: string;
    heart_rate?: string | number;
    temperature?: string | number;
    weight?: string | number;
    height?: string | number;
  };
  status: string;
  is_locked: boolean;
  source: string;
  confirmed_at: string | null;
  created_at: string;
  doctor_name?: string;
};

export async function listMedicalRecordsForPatient(patientId: string): Promise<MedicalRecord[]> {
  if (await isDemoSession()) {
    const list = DEMO_MEDICAL_RECORDS.filter((r) => r.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_MEDICAL_RECORDS) as MedicalRecord[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('medical_records')
      .select('id,patient_id,appointment_id,doctor_id,record_type,chief_complaint,diagnosis,treatment_plan,notes,vitals,status,is_locked,source,confirmed_at,created_at')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data) {
      const list = DEMO_MEDICAL_RECORDS.filter((r) => r.patient_id === patientId);
      return (list.length > 0 ? list : DEMO_MEDICAL_RECORDS) as MedicalRecord[];
    }
    const records = data as MedicalRecord[];

    const doctorIds = Array.from(new Set(records.map((r) => r.doctor_id).filter((id): id is string => Boolean(id))));
    if (doctorIds.length > 0) {
      const { data: doctors } = await supabase
        .from('staff_profiles')
        .select('id,full_name')
        .in('id', doctorIds);
      const docMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name]));
      return records.map((r) => ({
        ...r,
        doctor_name: r.doctor_id ? docMap.get(r.doctor_id) ?? 'طبيب' : undefined,
      }));
    }

    return records;
  } catch {
    const list = DEMO_MEDICAL_RECORDS.filter((r) => r.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_MEDICAL_RECORDS) as MedicalRecord[];
  }
}

export async function getMedicalRecordByAppointment(appointmentId: string): Promise<MedicalRecord | null> {
  if (await isDemoSession()) {
    const rec = DEMO_MEDICAL_RECORDS.find((r) => r.appointment_id === appointmentId) || DEMO_MEDICAL_RECORDS[0];
    return (rec ?? null) as MedicalRecord | null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('medical_records')
      .select('id,patient_id,appointment_id,doctor_id,record_type,chief_complaint,diagnosis,treatment_plan,prescription_items,notes,vitals,status,is_locked,source,confirmed_at,created_at')
      .eq('appointment_id', appointmentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      const rec = DEMO_MEDICAL_RECORDS.find((r) => r.appointment_id === appointmentId) || DEMO_MEDICAL_RECORDS[0];
      return (rec ?? null) as MedicalRecord | null;
    }
    return data as MedicalRecord;
  } catch {
    const rec = DEMO_MEDICAL_RECORDS.find((r) => r.appointment_id === appointmentId) || DEMO_MEDICAL_RECORDS[0];
    return (rec ?? null) as MedicalRecord | null;
  }
}

export async function getMedicalRecordById(id: string): Promise<MedicalRecord | null> {
  if (await isDemoSession()) {
    const rec = DEMO_MEDICAL_RECORDS.find((r) => r.id === id) || DEMO_MEDICAL_RECORDS[0];
    return (rec ?? null) as MedicalRecord | null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('medical_records')
      .select('id,patient_id,appointment_id,doctor_id,record_type,chief_complaint,diagnosis,treatment_plan,prescription_items,notes,vitals,status,is_locked,source,confirmed_at,created_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      const rec = DEMO_MEDICAL_RECORDS.find((r) => r.id === id) || DEMO_MEDICAL_RECORDS[0];
      return (rec ?? null) as MedicalRecord | null;
    }
    return data as MedicalRecord;
  } catch {
    const rec = DEMO_MEDICAL_RECORDS.find((r) => r.id === id) || DEMO_MEDICAL_RECORDS[0];
    return (rec ?? null) as MedicalRecord | null;
  }
}
