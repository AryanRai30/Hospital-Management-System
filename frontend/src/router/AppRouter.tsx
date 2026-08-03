import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { Login } from '../pages/Login';
import { NotFound } from '../pages/NotFound';
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
        <Route path={ROUTES.LOGIN} element={<Login />} />

        {/* Main Application Layout Routes */}
        <Route path={ROUTES.HOME} element={<MainLayout />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.PATIENTS} element={<ModulePlaceholder title="Patients" />} />
          <Route path={ROUTES.DOCTORS} element={<ModulePlaceholder title="Doctors" />} />
          <Route path={ROUTES.APPOINTMENTS} element={<ModulePlaceholder title="Appointments" />} />
          <Route path={ROUTES.PHARMACY} element={<ModulePlaceholder title="Pharmacy" />} />
          <Route path={ROUTES.BILLING} element={<ModulePlaceholder title="Billing" />} />
          <Route path={ROUTES.SETTINGS} element={<ModulePlaceholder title="Settings" />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
