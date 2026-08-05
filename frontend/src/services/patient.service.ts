import { api } from './api';
import { ApiResponse, Patient, CreatePatientFormData } from '../types';

export interface PatientQueryParams {
  search?: string;
  gender?: string;
  bloodGroup?: string;
}

export class PatientService {
  /**
   * Fetch all patients with optional search and filter parameters
   */
  static async getPatients(params?: PatientQueryParams): Promise<ApiResponse<Patient[]>> {
    const response = await api.get<ApiResponse<Patient[]>>('/patients', {
      params: params || {}
    });
    return response.data;
  }

  /**
   * Fetch single patient by ID
   */
  static async getPatientById(id: number): Promise<ApiResponse<Patient>> {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data;
  }

  /**
   * Create a new patient record
   */
  static async createPatient(data: CreatePatientFormData): Promise<ApiResponse<Patient>> {
    const response = await api.post<ApiResponse<Patient>>('/patients', data);
    return response.data;
  }

  /**
   * Update existing patient details
   */
  static async updatePatient(id: number, data: Partial<CreatePatientFormData>): Promise<ApiResponse<Patient>> {
    const response = await api.put<ApiResponse<Patient>>(`/patients/${id}`, data);
    return response.data;
  }

  /**
   * Delete a patient record
   */
  static async deletePatient(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/patients/${id}`);
    return response.data;
  }
}
