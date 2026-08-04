export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CarePulse Hospital';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  UNAUTHORIZED: '/unauthorized',
  SESSION_EXPIRED: '/session-expired',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  DOCTORS: '/doctors',
  APPOINTMENTS: '/appointments',
  PHARMACY: '/pharmacy',
  BILLING: '/billing',
  SETTINGS: '/settings',
  NOT_FOUND: '*'
};
