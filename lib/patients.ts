/**
 * RLS-aware patient queries with synthetic fallback for demo mode.
 */
import { createClient } from '@/lib/supabase/server';
import type { Patient } from '@/lib/supabase/types';
import { DEMO_PATIENTS } from './demo-data';

export type PatientInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
};

const SELECT_COLUMNS =
  'id,clinic_id,file_number,full_name,phone,email,gender,birth_date,is_active,created_at,deleted_at';

export async function listPatients(opts?: { limit?: number; search?: string }): Promise<Patient[]> {
  const limit = opts?.limit ?? 50;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    let list = [...DEMO_PATIENTS];
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      list = list.filter((p) => p.full_name.includes(q) || p.phone.includes(q) || p.file_number.includes(q));
    }
    return list.slice(0, limit) as Patient[];
  }

  const supabase = await createClient();

  let query = supabase
    .from('patients')
    .select(SELECT_COLUMNS)
    .is('deleted_at', null);

  if (opts?.search) {
    const safe = opts.search.replace(/[^\p{L}\p{N}\s+.-]/gu, ' ').trim().slice(0, 80);
    if (safe) query = query.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,file_number.ilike.%${safe}%`);
  }

  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`listPatients failed: ${error.message}`);
  return (data ?? []) as Patient[];
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const p = DEMO_PATIENTS.find((x) => x.id === id) || DEMO_PATIENTS[0];
    return (p ?? null) as Patient | null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getPatient failed: ${error.message}`);
  return (data ?? null) as Patient | null;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc('create_patient_for_current_user', {
    p_full_name: input.full_name, p_phone: input.phone, p_email: input.email ?? null,
    p_gender: input.gender ?? null, p_birth_date: input.birth_date ?? null,
  });
  if (error) throw new Error(`createPatient failed: ${error.message}`);
  const patient = await getPatient(id);
  if (!patient) throw new Error('createPatient failed: created record could not be read');
  return patient;
}

export async function updatePatient(id: string, patch: Partial<PatientInput>): Promise<Patient> {
  const supabase = await createClient();
  const current = await getPatient(id);
  if (!current) throw new Error('updatePatient failed: patient not found');
  const { error } = await supabase.rpc('update_patient_for_current_user', {
    p_id: id,
    p_full_name: patch.full_name ?? current.full_name,
    p_phone: patch.phone ?? current.phone,
    p_email: patch.email === undefined ? current.email : patch.email,
    p_gender: patch.gender === undefined ? current.gender : patch.gender,
    p_birth_date: patch.birth_date === undefined ? current.birth_date : patch.birth_date,
  });
  if (error) throw new Error(`updatePatient failed: ${error.message}`);
  const patient = await getPatient(id);
  if (!patient) throw new Error('updatePatient failed: updated record could not be read');
  return patient;
}

export async function softDeletePatient(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('archive_patient_for_current_user', { p_id: id });
  if (error) throw new Error(`softDeletePatient failed: ${error.message}`);
}
