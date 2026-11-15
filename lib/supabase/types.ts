export type Patient = {
  id: string;
  clinic_id: string;
  file_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: 'male' | 'female' | 'other' | null;
  birth_date: string | null;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
};
