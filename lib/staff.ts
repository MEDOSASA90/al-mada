import { createClient } from '@/lib/supabase/server';
import { DEMO_DOCTORS, DEMO_ALL_STAFF, DEMO_BRANCHES } from './demo-data';

export type StaffMember = {
  id: string;
  clinic_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: string;
  specialty_id: string | null;
  license_number: string | null;
  is_active: boolean;
  commission_percentage?: number;
  consultation_fee?: number;
  created_at: string;
};

export async function listDoctors(): Promise<StaffMember[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_DOCTORS as StaffMember[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id,clinic_id,user_id,full_name,phone,email,role,specialty_id,license_number,is_active,created_at')
    .in('role', ['doctor', 'visiting_doctor'])
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('full_name', { ascending: true });

  if (error) {
    return DEMO_DOCTORS as StaffMember[];
  }
  return (data ?? []) as StaffMember[];
}

export async function listStaff(): Promise<StaffMember[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_ALL_STAFF as StaffMember[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id,clinic_id,user_id,full_name,phone,email,role,specialty_id,license_number,is_active,commission_percentage,consultation_fee,created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return DEMO_ALL_STAFF as StaffMember[];
  }
  return (data ?? []) as StaffMember[];
}

export async function listBranches(): Promise<Array<{ id: string; name: string; name_ar: string; code: string }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_BRANCHES;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clinic_branches')
    .select('id,name,name_ar,code')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return DEMO_BRANCHES;
  }
  return (data ?? []) as Array<{ id: string; name: string; name_ar: string; code: string }>;
}
