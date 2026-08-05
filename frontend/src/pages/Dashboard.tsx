import React from 'react';
import { useAppSelector } from '../hooks/store';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import { DoctorDashboardView } from '../components/dashboard/DoctorDashboardView';
import { PatientDashboardView } from '../components/dashboard/PatientDashboardView';
import { ReceptionistDashboardView } from '../components/dashboard/ReceptionistDashboardView';
import { PharmacistDashboardView } from '../components/dashboard/PharmacistDashboardView';
import { LabDashboardView } from '../components/dashboard/LabDashboardView';

export const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role || 'PATIENT';

  switch (role) {
    case 'ADMIN':
      return <AdminDashboardView />;
    case 'DOCTOR':
      return <DoctorDashboardView />;
    case 'PATIENT':
      return <PatientDashboardView />;
    case 'RECEPTIONIST':
      return <ReceptionistDashboardView />;
    case 'PHARMACIST':
      return <PharmacistDashboardView />;
    case 'LAB_TECHNICIAN':
    case 'NURSE':
      return <LabDashboardView />;
    default:
      return <PatientDashboardView />;
  }
};
