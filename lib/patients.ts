/**
 * RLS-aware patient queries.
 * The Supabase client is subject to Row Level Security, so these helpers can
 * only ever return rows the signed-in user is allowed to see.
 */
import { getBrowserClient, type Patient } from '@/lib/supabase';

export type PatientInput = {
  clinic_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
};

const SELECT_COLUMNS =
  'id,clinic_id,file_number,full_name,phone,email,gender,birth_date,is_active,created_at';

export async function listPatients(opts?: { limit?: number; search?: string }): Promise<Patient[]> {
  const limit = opts?.limit ?? 50;
  const supabase = getBrowserClient();

  let query = supabase
    .from('patients')
    .select(SELECT_COLUMNS)
    .is('deleted_at', null);

  if (opts?.search) {
    const safe = opts.search.replace(/[%,()]/g, ' ').trim();
    if (safe) query = query.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`listPatients failed: ${error.message}`);
  return (data ?? []) as Patient[];
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('patients')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getPatient failed: ${error.message}`);
  return (data ?? null) as Patient | null;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      clinic_id: input.clinic_id,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email ?? null,
      gender: input.gender ?? null,
      birth_date: input.birth_date ?? null,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw new Error(`createPatient failed: ${error.message}`);
  return data as Patient;
}

export async function updatePatient(id: string, patch: Partial<PatientInput>): Promise<Patient> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('patients')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw new Error(`updatePatient failed: ${error.message}`);
  return data as Patient;
}

export async function softDeletePatient(id: string): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`softDeletePatient failed: ${error.message}`);
}
