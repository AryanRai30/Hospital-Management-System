export interface Doctor {
  id: number;
  user_id: number;
  department_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  date_of_birth?: string | null;
  specialization: string;
  department_name?: string;
  department_code?: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  address?: string | null;
  is_active: boolean | number;
  profile_photo?: string | null;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface CreateDoctorFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  dateOfBirth: string;
  specialization: string;
  departmentId: number | '';
  qualification: string;
  experienceYears: number | '';
  consultationFee: number | '';
  address: string;
  status: boolean;
  profilePhoto: string;
}

export interface UpdateDoctorFormData extends CreateDoctorFormData {
  id: number;
}
