import { createClient } from '@/lib/supabase/server';
import { DEMO_EXPORTS, DEMO_PATIENTS, DEMO_APPOINTMENTS, DEMO_INVOICES } from './demo-data';

export type ClinicExport = {
  id: string;
  clinic_id: string;
  export_type: string;
  export_format: 'json' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  records_count: number;
  file_size_bytes: number;
  created_at: string;
};

export async function listClinicExports(): Promise<ClinicExport[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_EXPORTS as ClinicExport[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clinic_exports')
    .select('id,clinic_id,export_type,export_format,status,records_count,file_size_bytes,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as ClinicExport[];
}

export async function generateExportPayload(exportType: string = 'full_backup') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      exported_at: new Date().toISOString(),
      clinic: 'عيادة المدى التخصصية',
      type: exportType,
      patients: DEMO_PATIENTS,
      appointments: DEMO_APPOINTMENTS,
      invoices: DEMO_INVOICES,
    };
  }

  const supabase = await createClient();
  const { data: exportId, error } = await supabase.rpc('generate_clinic_export_for_current_user', {
    p_export_type: exportType,
  });

  if (error) throw new Error(error.message);
  return { exportId };
}
