import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAppSelector } from '../../hooks/store';
import { ROUTES } from '../../config/constants';
import { getGreetingMessage } from '../../utils/user.helpers';
import {
  Stethoscope,
  Calendar,
  Clock,
  UserCheck,
  FlaskConical,
  Scissors,
  Pill,
  CheckCircle2,
  FileText,
  Activity,
  ChevronRight,
  UserPlus
} from 'lucide-react';

export const DoctorDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { greeting, subtitle, badge } = getGreetingMessage(user);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Doctor Patient Queue
  const todayQueue = [
    { id: 1, name: 'Eleanor Vance', code: 'PAT-9021', time: '09:30 AM', type: 'Follow-up', status: 'In-Consultation', variant: 'info' as const },
    { id: 2, name: 'Marcus Brody', code: 'PAT-9022', time: '10:15 AM', type: 'OPD Checkup', status: 'Next in Line', variant: 'warning' as const },
    { id: 3, name: 'Sophia Martinez', code: 'PAT-9023', time: '11:00 AM', type: 'Lab Review', status: 'Waiting in Lobby', variant: 'neutral' as const },
    { id: 4, name: 'David Sterling', code: 'PAT-9024', time: '11:45 AM', type: 'Consultation', status: 'Scheduled', variant: 'neutral' as const }
  ];

  // Upcoming Surgeries & Procedures
  const upcomingSurgeries = [
    { id: 'SURG-882', procedure: 'Coronary Angioplasty', patient: 'Arthur Pendelton', room: 'OT-Room 3', time: '02:30 PM Today' },
    { id: 'SURG-885', procedure: 'Pacemaker Implantation', patient: 'Clara Oswald', room: 'OT-Room 1', time: '10:00 AM Tomorrow' }
  ];

  // Pending Lab Reports to Review
  const pendingLabReports = [
    { id: 'LAB-401', patient: 'Sophia Martinez', test: 'Lipid Profile & ECG', priority: 'High', date: 'Today, 08:30 AM' },
    { id: 'LAB-405', patient: 'Marcus Brody', test: 'Echocardiogram (Echo)', priority: 'Normal', date: 'Today, 09:15 AM' }
  ];

  // Clinical Shortcuts for Doctor
  const doctorActions = [
    { title: "View Today's Schedule", desc: 'Check consultation timeline', icon: Calendar, color: 'from-emerald-500 to-teal-600', path: ROUTES.APPOINTMENTS },
    { title: 'Start OPD Consultation', desc: 'Open current patient queue', icon: UserCheck, color: 'from-blue-500 to-indigo-600', path: ROUTES.APPOINTMENTS },
    { title: 'Create Prescription', desc: 'Issue medication & dosage', icon: Pill, color: 'from-amber-500 to-orange-600', path: ROUTES.PHARMACY },
    { title: 'Review Lab Reports', desc: 'Sign off diagnostic results', icon: FlaskConical, color: 'from-purple-500 to-indigo-600', path: ROUTES.APPOINTMENTS },
    { title: 'Schedule Follow-up', desc: 'Set follow-up visit date', icon: Clock, color: 'from-sky-500 to-blue-600', path: ROUTES.APPOINTMENTS },
    { title: 'Manage Availability', desc: 'Update duty hours & shift', icon: Stethoscope, color: 'from-rose-500 to-red-600', path: ROUTES.SETTINGS }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Doctor Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-emerald-900/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-500/30 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> {badge}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentDateStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              {subtitle} You have <strong>4 consultations scheduled today</strong> and <strong>1 surgery in OT-3</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Start Consultation
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
              className="text-white border-white/20 hover:bg-white/10 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Today's Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Doctor Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Today's Appointments</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">4 Patients</h2>
          <p className="text-xs text-emerald-600 font-medium mt-1">1 In-Consultation • 3 Waiting</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-purple-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Scheduled Surgeries</span>
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">2 Operations</h2>
          <p className="text-xs text-purple-600 font-medium mt-1">OT-3 at 02:30 PM Today</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-sky-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Pending Lab Reviews</span>
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">2 Reports</h2>
          <p className="text-xs text-sky-600 font-medium mt-1">Requires doctor sign-off</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-amber-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active Prescriptions</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">18 Issued</h2>
          <p className="text-xs text-amber-600 font-medium mt-1">This week's consultations</p>
        </Card>
      </div>

      {/* Doctor Clinical Quick Action Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-emerald-600" />
          Clinical Actions & Consultation Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {doctorActions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(act.path)}
                className="group relative overflow-hidden bg-white p-5 rounded-[18px] border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${act.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{act.desc}</p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 gap-1 group-hover:translate-x-1 transition-transform">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Doctor Grid: Patient Queue & Lab/Surgery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Live Patient Queue */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Today's OPD Consultation Queue</h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Live OPD Desk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Patient Code & Name</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Consultation Type</th>
                  <th className="py-3.5 px-4 text-right">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {todayQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.time}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{item.type}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={item.variant}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to view full medical history for a patient?</span>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PATIENTS)}>
              Search Medical Records
            </Button>
          </div>
        </div>

        {/* Side Panel: Surgeries & Lab Reports */}
        <div className="space-y-6">
          {/* Upcoming Surgeries */}
          <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600" />
                Upcoming Surgeries
              </h4>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                OT Schedule
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingSurgeries.map((surg) => (
                <div key={surg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{surg.procedure}</span>
                    <span className="text-purple-600 font-mono text-[10px]">{surg.room}</span>
                  </div>
                  <p className="text-slate-600">Patient: <strong>{surg.patient}</strong></p>
                  <p className="text-[11px] text-slate-400 font-medium">{surg.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Lab Reports */}
          <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-600" />
                Pending Lab Reports
              </h4>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                Review Needed
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingLabReports.map((lab) => (
                <div key={lab.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{lab.patient}</span>
                    <span className="text-rose-600 font-bold text-[10px]">{lab.priority} Priority</span>
                  </div>
                  <p className="text-slate-600">{lab.test}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{lab.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
