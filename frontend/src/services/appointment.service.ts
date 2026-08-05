import { api } from './api';
import { ApiResponse, Appointment, CreateAppointmentFormData, UpdateAppointmentFormData } from '../types';

export interface AppointmentQueryParams {
  search?: string;
  status?: string;
  doctorId?: number | string;
  patientId?: number | string;
  date?: string;
}

export class AppointmentService {
  /**
   * Fetch appointments with search & filter options
   */
  static async getAppointments(params?: AppointmentQueryParams): Promise<ApiResponse<Appointment[]>> {
    const response = await api.get<ApiResponse<Appointment[]>>('/appointments', {
      params: params || {}
    });
    return response.data;
  }

  /**
   * Fetch single appointment by ID
   */
  static async getAppointmentById(id: number): Promise<ApiResponse<Appointment>> {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data;
  }

  /**
   * Book a new appointment
   */
  static async createAppointment(data: CreateAppointmentFormData): Promise<ApiResponse<Appointment>> {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data;
  }

  /**
   * Update appointment details, status, or consultation notes
   */
  static async updateAppointment(
    id: number,
    data: Partial<UpdateAppointmentFormData>
  ): Promise<ApiResponse<Appointment>> {
    const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}`, data);
    return response.data;
  }

  /**
   * Delete an appointment record
   */
  static async deleteAppointment(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/appointments/${id}`);
    return response.data;
  }
}
