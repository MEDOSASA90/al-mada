import { DEMO_CLINIC } from './demo-data';

export type ClinicBranch = {
  id: string;
  clinic_id: string;
  name_ar: string;
  name_en: string;
  code: string;
  governorate: string;
  city: string;
  address: string;
  phone: string;
  is_main: boolean;
  is_active: boolean;
  doctors_count: number;
};

export const DEMO_BRANCHES: ClinicBranch[] = [
  {
    id: 'branch_01',
    clinic_id: DEMO_CLINIC.id,
    name_ar: 'الفرع الرئيسي - مصر الجديدة',
    name_en: 'Main Branch - Heliopolis',
    code: 'HEL-01',
    governorate: 'القاهرة',
    city: 'مصر الجديدة',
    address: '14 شارع الميرغني، ميدان السبع عمارات، الدور الثاني',
    phone: '0224158890',
    is_main: true,
    is_active: true,
    doctors_count: 2,
  },
  {
    id: 'branch_02',
    clinic_id: DEMO_CLINIC.id,
    name_ar: 'فرع التجمع الخامس',
    name_en: 'New Cairo Branch',
    code: 'NC-02',
    governorate: 'القاهرة',
    city: 'التجمع الخامس',
    address: 'مجمع الميديكال سنتر 2، خلف المستشفى الجوي، عيادة 204',
    phone: '0228129940',
    is_main: false,
    is_active: true,
    doctors_count: 1,
  },
];

export async function listClinicBranches(): Promise<ClinicBranch[]> {
  return DEMO_BRANCHES;
}

export async function createClinicBranch(data: Partial<ClinicBranch>): Promise<ClinicBranch> {
  const newBranch: ClinicBranch = {
    id: `branch_${Date.now()}`,
    clinic_id: DEMO_CLINIC.id,
    name_ar: data.name_ar || 'فرع جديد',
    name_en: data.name_en || 'New Branch',
    code: data.code || `BR-${Math.floor(10 + Math.random() * 90)}`,
    governorate: data.governorate || 'القاهرة',
    city: data.city || 'مدينة نصر',
    address: data.address || '',
    phone: data.phone || '',
    is_main: false,
    is_active: true,
    doctors_count: 0,
  };
  return newBranch;
}
