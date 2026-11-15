import { DEMO_CLINIC, DEMO_DOCTORS } from './demo-data';

export type DoctorBranchShift = {
  id: string;
  branch_id: string;
  branch_name: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  days_ar: string;
  start_time: string;
  end_time: string;
  consultation_fee: number;
  max_patients_per_shift: number;
  is_active: boolean;
};

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
  maps_url: string;
  is_main: boolean;
  is_active: boolean;
  cash_drawer_balance: number;
  inventory_items_count: number;
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
    maps_url: 'https://maps.google.com/?q=Heliopolis+AlMada+Clinic',
    is_main: true,
    is_active: true,
    cash_drawer_balance: 14200,
    inventory_items_count: 34,
    doctors_count: 2,
  },
  {
    id: 'branch_02',
    clinic_id: DEMO_CLINIC.id,
    name_ar: 'فرع التجمع الخامس (الميديكال سنتر)',
    name_en: 'New Cairo Branch',
    code: 'NC-02',
    governorate: 'القاهرة',
    city: 'التجمع الخامس',
    address: 'مجمع الميديكال سنتر 2، خلف المستشفى الجوي، عيادة 204',
    phone: '0228129940',
    maps_url: 'https://maps.google.com/?q=New+Cairo+Medical+AlMada',
    is_main: false,
    is_active: true,
    cash_drawer_balance: 8900,
    inventory_items_count: 22,
    doctors_count: 1,
  },
];

export const DEMO_DOCTOR_SHIFTS: DoctorBranchShift[] = [
  {
    id: 'shift_01',
    branch_id: 'branch_01',
    branch_name: 'الفرع الرئيسي - مصر الجديدة',
    doctor_id: DEMO_DOCTORS[0].id, // د. سارة عثمان
    doctor_name: DEMO_DOCTORS[0].full_name,
    specialty: 'استشاري أمراض الباطنة والجهاز الهضمي',
    days_ar: 'السبت · الإثنين · الأربعاء',
    start_time: '06:00 م',
    end_time: '10:00 م',
    consultation_fee: 450,
    max_patients_per_shift: 16,
    is_active: true,
  },
  {
    id: 'shift_02',
    branch_id: 'branch_02',
    branch_name: 'فرع التجمع الخامس (الميديكال سنتر)',
    doctor_id: DEMO_DOCTORS[0].id, // د. سارة عثمان
    doctor_name: DEMO_DOCTORS[0].full_name,
    specialty: 'استشاري أمراض الباطنة والجهاز الهضمي',
    days_ar: 'الأحد · الثلاثاء',
    start_time: '01:00 ظ',
    end_time: '05:00 م',
    consultation_fee: 600,
    max_patients_per_shift: 12,
    is_active: true,
  },
  {
    id: 'shift_03',
    branch_id: 'branch_01',
    branch_name: 'الفرع الرئيسي - مصر الجديدة',
    doctor_id: '22222222-2222-2222-2222-222222222222',
    doctor_name: 'د. طارق محمود الشناوي',
    specialty: 'أخصائي طب الأطفال وحديثي الولادة',
    days_ar: 'الأحد · الثلاثاء · الخميس',
    start_time: '05:00 م',
    end_time: '09:00 م',
    consultation_fee: 350,
    max_patients_per_shift: 18,
    is_active: true,
  },
];

export async function listClinicBranches(): Promise<ClinicBranch[]> {
  return DEMO_BRANCHES;
}

export async function listDoctorShifts(branchId?: string): Promise<DoctorBranchShift[]> {
  if (branchId) {
    return DEMO_DOCTOR_SHIFTS.filter((s) => s.branch_id === branchId);
  }
  return DEMO_DOCTOR_SHIFTS;
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
    maps_url: data.maps_url || 'https://maps.google.com',
    is_main: false,
    is_active: true,
    cash_drawer_balance: 0,
    inventory_items_count: 0,
    doctors_count: 0,
  };
  return newBranch;
}
