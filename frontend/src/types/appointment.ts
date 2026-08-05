export type AppointmentStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentMode = 'ONLINE' | 'OFFLINE';

export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  department_id: number;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  type?: string;
  appointment_mode: AppointmentMode;
  reason?: string | null;
  symptoms?: string | null;
  consultation_notes?: string | null;
  cancellation_reason?: string | null;
  patient_name?: string;
  patient_code?: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_email?: string;
  doctor_specialization?: string;
  doctor_fee?: number;
  department_name?: string;
  department_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppointmentFormData {
  patientId: number | '';
  doctorId: number | '';
  departmentId?: number | '';
  appointmentDate: string;
  appointmentTime: string;
  appointmentMode: AppointmentMode;
  type?: string;
  symptoms: string;
  reason?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentFormData extends Partial<CreateAppointmentFormData> {
  id: number;
  consultationNotes?: string;
  cancellationReason?: string;
}
