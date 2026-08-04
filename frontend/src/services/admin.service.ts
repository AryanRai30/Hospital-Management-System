import { api } from './api';
import { ApiResponse } from '../types';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalStaff: number;
  totalDepartments: number;
}

export const AdminService = {
  /**
   * Fetch admin dashboard statistics with Authorization Bearer token from local storage or auth state
   */
  async getDashboardStats(tokenOverride?: string | null): Promise<ApiResponse<DashboardStats>> {
    const token = tokenOverride || localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    return response.data;
  }
};
