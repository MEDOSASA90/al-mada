import { createClient } from '@/lib/supabase/server';
import { DEMO_PACKAGES } from './demo-data';
import { isDemoSession } from './session';

export type PatientPackage = {
  id: string;
  clinic_id: string;
  patient_id: string;
  name: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  price: number;
  currency: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  notes: string | null;
  patient_name?: string;
  patient_phone?: string;
  created_at: string;
};

export async function listPackagesForPatient(patientId: string): Promise<PatientPackage[]> {
  if (await isDemoSession()) {
    const list = DEMO_PACKAGES.filter((p) => p.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_PACKAGES) as PatientPackage[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('patient_packages')
      .select('id,clinic_id,patient_id,name,package_type,total_sessions,used_sessions,price,currency,valid_from,valid_until,is_active,notes,created_at')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data) {
      const list = DEMO_PACKAGES.filter((p) => p.patient_id === patientId);
      return (list.length > 0 ? list : DEMO_PACKAGES) as PatientPackage[];
    }
    return data as PatientPackage[];
  } catch {
    const list = DEMO_PACKAGES.filter((p) => p.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_PACKAGES) as PatientPackage[];
  }
}

export async function listAllClinicPackages(): Promise<PatientPackage[]> {
  if (await isDemoSession()) {
    return DEMO_PACKAGES as PatientPackage[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('patient_packages')
      .select('id,clinic_id,patient_id,name,package_type,total_sessions,used_sessions,price,currency,valid_from,valid_until,is_active,notes,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return DEMO_PACKAGES as PatientPackage[];
    }
    const pkgs = data as PatientPackage[];

    const patientIds = Array.from(new Set(pkgs.map((p) => p.patient_id).filter(Boolean)));
    if (patientIds.length > 0) {
      const { data: patients } = await supabase.from('patients').select('id,full_name,phone').in('id', patientIds);
      const pMap = new Map((patients ?? []).map((p) => [p.id, p]));
      return pkgs.map((p) => {
        const pat = pMap.get(p.patient_id);
        return {
          ...p,
          patient_name: pat?.full_name ?? 'مريض',
          patient_phone: pat?.phone,
        };
      });
    }

    return pkgs;
  } catch {
    return DEMO_PACKAGES as PatientPackage[];
  }
}
