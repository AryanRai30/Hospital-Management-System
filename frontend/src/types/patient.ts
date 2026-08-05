export interface Patient {
  id: number;
  user_id?: number;
  patient_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  blood_group?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  current_medications?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePatientFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  heightCm: number | '';
  weightKg: number | '';
  allergies: string;
  medicalConditions: string;
  currentMedications: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  status: boolean;
}

export interface UpdatePatientFormData extends CreatePatientFormData {
  id: number;
}
