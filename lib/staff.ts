import { createClient } from '@/lib/supabase/server';
import { DEMO_DOCTORS, DEMO_ALL_STAFF, DEMO_BRANCHES } from './demo-data';
import { isDemoSession } from './session';

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
  if (await isDemoSession()) {
    return DEMO_DOCTORS as StaffMember[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id,clinic_id,user_id,full_name,phone,email,role,specialty_id,license_number,is_active,created_at')
      .in('role', ['doctor', 'visiting_doctor'])
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('full_name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_DOCTORS as StaffMember[];
    }
    return data as StaffMember[];
  } catch {
    return DEMO_DOCTORS as StaffMember[];
  }
}

export async function listStaff(): Promise<StaffMember[]> {
  if (await isDemoSession()) {
    return DEMO_ALL_STAFF as StaffMember[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id,clinic_id,user_id,full_name,phone,email,role,specialty_id,license_number,is_active,commission_percentage,consultation_fee,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_ALL_STAFF as StaffMember[];
    }
    return data as StaffMember[];
  } catch {
    return DEMO_ALL_STAFF as StaffMember[];
  }
}

export async function listBranches(): Promise<Array<{ id: string; name: string; name_ar: string; code: string }>> {
  if (await isDemoSession()) {
    return DEMO_BRANCHES;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clinic_branches')
      .select('id,name,name_ar,code')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_BRANCHES;
    }
    return data as Array<{ id: string; name: string; name_ar: string; code: string }>;
  } catch {
    return DEMO_BRANCHES;
  }
}
