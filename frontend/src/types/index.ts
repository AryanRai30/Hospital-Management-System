export type UserRole = 
  | 'ADMIN' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'PATIENT' 
  | 'RECEPTIONIST' 
  | 'PHARMACIST' 
  | 'LAB_TECHNICIAN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export interface LoginResponseData {
  user: User;
  accessToken: string;
}

export interface NavItem {
  title: string;
  path: string;
  icon: string;
  roles?: UserRole[];
  badge?: string;
}

export * from './doctor';
export * from './patient';
