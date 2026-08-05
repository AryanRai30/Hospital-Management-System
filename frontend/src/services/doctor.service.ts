import { api } from './api';
import { ApiResponse, Doctor, Department, CreateDoctorFormData } from '../types';

export class DoctorService {
  /**
   * Fetch all doctors with optional search parameter
   */
  static async getDoctors(search?: string): Promise<ApiResponse<Doctor[]>> {
    const response = await api.get<ApiResponse<Doctor[]>>('/doctors', {
      params: search ? { search } : {}
    });
    return response.data;
  }

  /**
   * Fetch single doctor by ID
   */
  static async getDoctorById(id: number): Promise<ApiResponse<Doctor>> {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data;
  }

  /**
   * Fetch active departments list
   */
  static async getDepartments(): Promise<ApiResponse<Department[]>> {
    const response = await api.get<ApiResponse<Department[]>>('/doctors/departments');
    return response.data;
  }

  /**
   * Create a new doctor
   */
  static async createDoctor(data: CreateDoctorFormData): Promise<ApiResponse<Doctor>> {
    const response = await api.post<ApiResponse<Doctor>>('/doctors', data);
    return response.data;
  }

  /**
   * Update doctor details
   */
  static async updateDoctor(id: number, data: Partial<CreateDoctorFormData>): Promise<ApiResponse<Doctor>> {
    const response = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return response.data;
  }

  /**
   * Delete a doctor
   */
  static async deleteDoctor(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/doctors/${id}`);
    return response.data;
  }
}
