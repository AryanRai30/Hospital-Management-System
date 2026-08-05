import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAppSelector } from '../../hooks/store';
import { ROUTES } from '../../config/constants';
import { getGreetingMessage } from '../../utils/user.helpers';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Building2
} from 'lucide-react';

export const ReceptionistDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { greeting, subtitle, badge } = getGreetingMessage(user);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Doctor Availability Live Grid
  const doctorAvailability = [
    { id: 1, name: 'Dr. Sarah Jenkins', dept: 'Cardiology', room: 'OPD-402', status: 'In-Consultation', variant: 'warning' as const },
    { id: 2, name: 'Dr. Alex Rivera', dept: 'Neurology', room: 'OPD-108', status: 'Available', variant: 'success' as const },
    { id: 3, name: 'Dr. Emily Chen', dept: 'Pediatrics', room: 'OPD-105', status: 'Available', variant: 'success' as const },
    { id: 4, name: 'Dr. Michael Chang', dept: 'Orthopedics', room: 'OPD-301', status: 'In-Surgery', variant: 'danger' as const }
  ];

  // Lobby Waiting Queue
  const waitingLobby = [
    { token: '#T-101', patient: 'Marcus Brody', doctor: 'Dr. Alex Rivera', arrival: '09:40 AM', status: 'Waiting' },
    { token: '#T-102', patient: 'Sophia Martinez', doctor: 'Dr. Emily Chen', arrival: '10:05 AM', status: 'Checked In' },
    { token: '#T-103', patient: 'David Sterling', doctor: 'Dr. Michael Chang', arrival: '10:15 AM', status: 'Checked In' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Reception Header Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-sky-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-sky-800/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold backdrop-blur-md border border-sky-500/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {badge}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentDateStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-sm text-sky-100/80 max-w-2xl leading-relaxed">
              {subtitle} Register walk-in patients, manage appointment check-ins, verify doctor availability, and process counter billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.PATIENTS)}
              className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register Walk-in Patient
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
              className="text-white border-white/20 hover:bg-white/10 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Reception Action Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-sky-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Lobby Waiting Queue</span>
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">3 Checked In</h2>
          <p className="text-xs text-sky-600 font-medium mt-1">Average wait time: 12 mins</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Doctors On Duty</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">4 Doctors</h2>
          <p className="text-xs text-emerald-600 font-medium mt-1">2 Available • 1 In-Consultation</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-amber-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Today's Check-Ins</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">28 Completed</h2>
          <p className="text-xs text-amber-600 font-medium mt-1">Outpatient consultations today</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-purple-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Counter Settlements</span>
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">12 Bills Settled</h2>
          <p className="text-xs text-purple-600 font-medium mt-1">Offline cash/UPI receipts</p>
        </Card>
      </div>

      {/* Main Receptionist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Lobby Queue */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-base text-slate-900">Main Lobby Waiting Queue</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.APPOINTMENTS)}>
              Manage Check-Ins
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Token #</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4">Arrival Time</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {waitingLobby.map((item) => (
                  <tr key={item.token} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{item.token}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.patient}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{item.doctor}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.arrival}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[11px]">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Availability Live Grid */}
        <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Doctor Duty & Room Allocation
            </h4>
          </div>

          <div className="space-y-2.5">
            {doctorAvailability.map((doc) => (
              <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">{doc.name}</h5>
                  <p className="text-slate-500 text-[11px]">{doc.dept} • {doc.room}</p>
                </div>
                <Badge variant={doc.variant}>{doc.status}</Badge>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.DOCTORS)}
            className="w-full text-xs"
          >
            View All Clinical Doctors
          </Button>
        </div>
      </div>
    </div>
  );
};
