import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { DoctorManagement } from '../pages/DoctorManagement';
import { PatientManagement } from '../pages/PatientManagement';
import { AppointmentManagement } from '../pages/AppointmentManagement';
import { BillingManagement } from '../pages/BillingManagement';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { VerifyEmail } from '../pages/VerifyEmail';
import { Unauthorized } from '../pages/Unauthorized';
import { SessionExpired } from '../pages/SessionExpired';
import { NotFound } from '../pages/NotFound';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { ROUTES } from '../config/constants';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

const ModulePlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title} Module Shell</h1>
        <p className="text-sm text-slate-500 mt-1">
          This interface is structured and ready for future module logic implementation.
        </p>
      </div>
      <Badge variant="info">Boilerplate Ready</Badge>
    </div>
    <Card className="min-h-[300px] flex items-center justify-center text-slate-400 text-sm">
      {title} Management Module Shell Architecture
    </Card>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.SESSION_EXPIRED} element={<SessionExpired />} />

        {/* Protected Application Routes */}
        <Route
          path={ROUTES.HOME}
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Role Protected Routes */}
          <Route
            path={ROUTES.PATIENTS}
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <PatientManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DOCTORS}
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                <DoctorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.APPOINTMENTS}
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST']}>
                <AppointmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PHARMACY}
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR', 'PATIENT']}>
                <ModulePlaceholder title="Pharmacy" />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.BILLING}
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST']}>
                <BillingManagement />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.SETTINGS} element={<ModulePlaceholder title="Settings" />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
