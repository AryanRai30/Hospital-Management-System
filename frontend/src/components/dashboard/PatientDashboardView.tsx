import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAppSelector } from '../../hooks/store';
import { ROUTES } from '../../config/constants';
import { getGreetingMessage } from '../../utils/user.helpers';
import {
  Calendar,
  Clock,
  Pill,
  FileText,
  CreditCard,
  Download,
  Plus,
  HeartPulse,
  Bell,
  ChevronRight,
  Activity,
  ShieldAlert,
  PhoneCall,
  User
} from 'lucide-react';

export const PatientDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { greeting, subtitle, badge } = getGreetingMessage(user);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate Age from Date of Birth
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'Not Available';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'Not Available';
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    const ageYears = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${ageYears} Yrs`;
  };

  // Calculate BMI
  const calculateBMI = (heightCm?: number | string, weightKg?: number | string) => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return 'Not Available';
    const heightM = h / 100;
    const bmiVal = (w / (heightM * heightM)).toFixed(1);
    const num = Number(bmiVal);
    let category = 'Normal';
    if (num < 18.5) category = 'Underweight';
    else if (num >= 25 && num < 30) category = 'Overweight';
    else if (num >= 30) category = 'Obese';

    return `${bmiVal} (${category})`;
  };

  // Extract Patient Specific Health Fields
  const patientBloodGroup = (user as any)?.bloodGroup || (user as any)?.blood_group || 'Not Available';
  const patientAge = calculateAge((user as any)?.dateOfBirth || (user as any)?.date_of_birth);
  const rawHeight = (user as any)?.heightCm || (user as any)?.height_cm;
  const rawWeight = (user as any)?.weightKg || (user as any)?.weight_kg;
  const patientHeight = rawHeight ? `${rawHeight} cm` : 'Not Available';
  const patientWeight = rawWeight ? `${rawWeight} kg` : 'Not Available';
  const patientBMI = calculateBMI(rawHeight, rawWeight);
  const patientAllergies = (user as any)?.allergies || 'None Reported';

  const emgName = (user as any)?.emergencyContactName || (user as any)?.emergency_contact_name || '';
  const emgPhone = (user as any)?.emergencyContactPhone || (user as any)?.emergency_contact_phone || '';
  const patientEmergencyContact = emgName || emgPhone ? `${emgName} ${emgPhone ? `(${emgPhone})` : ''}`.trim() : 'Not Available';

  // Patient Prescriptions
  const activePrescriptions = [
    { id: 1, name: 'Amoxicillin 500mg', dosage: '1 Tablet twice daily (After meals)', duration: '5 Days remaining' },
    { id: 2, name: 'Paracetamol 650mg', dosage: '1 Tablet as needed for fever/pain', duration: 'As needed' }
  ];

  // Patient Lab Reports
  const labReports = [
    { id: 'LAB-9042', testName: 'Complete Blood Count (CBC)', date: 'Aug 04, 2026', status: 'Ready to Download' },
    { id: 'LAB-9038', testName: 'Lipid Profile & Cholesterol', date: 'Jul 22, 2026', status: 'Completed' }
  ];

  // Health Reminders
  const healthReminders = [
    { id: 1, title: 'Evening Medication', detail: 'Take Amoxicillin 500mg at 08:00 PM', time: 'Today 08:00 PM' },
    { id: 2, title: 'Follow-Up Consultation', detail: 'OPD Visit with Clinical Specialist', time: 'Tomorrow 10:30 AM' },
    { id: 3, title: 'Fasting Lab Test Notice', detail: 'Avoid food/drinks 8 hours before blood test', time: 'Aug 10, 2026' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Patient Header Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-blue-800/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-500/30 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" /> {badge}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentDateStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-sm text-blue-100/80 max-w-2xl leading-relaxed">
              {subtitle} Track your upcoming doctor consultations, download diagnostic lab reports, review active prescriptions, and view billing statements online.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Book New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Main Patient Grid: Next Appointment & Personal Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Appointment Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[20px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Your Next Scheduled Appointment</h3>
            </div>
            <Badge variant="success">Confirmed</Badge>
          </div>

          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Tomorrow at 10:30 AM (OPD Consultation)</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">Dr. Sarah Jenkins</h4>
              <p className="text-xs text-slate-600">Senior Specialist • Department of Cardiology</p>
              <p className="text-xs text-slate-500 font-mono">Location: CarePulse OPD Suite 402</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.APPOINTMENTS)}
              >
                View Details
              </Button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Need to schedule another consultation?</span>
            <button
              onClick={() => navigate(ROUTES.APPOINTMENTS)}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Browse Available Doctors <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Personal Health Summary Card */}
        <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Personal Health Summary
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              Patient Vitals
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
              <strong className="text-slate-900 text-sm font-extrabold text-rose-600 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                {patientBloodGroup}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Age</span>
              <strong className="text-slate-900 text-sm font-extrabold">{patientAge}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Height</span>
              <strong className="text-slate-900 text-sm font-extrabold">{patientHeight}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
              <strong className="text-slate-900 text-sm font-extrabold">{patientWeight}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculated BMI</span>
              <strong className="text-slate-900 text-sm font-extrabold text-blue-700">{patientBMI}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Known Allergies</span>
              <span className="text-slate-800 font-medium">{patientAllergies}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
              <span className="text-slate-800 font-medium">{patientEmergencyContact}</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-100">
            Health metrics are updated from your clinical medical chart.
          </div>
        </div>
      </div>

      {/* Second Row: Prescriptions & Lab Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Your Active Prescriptions</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Active Medication
            </span>
          </div>

          <div className="space-y-3">
            {activePrescriptions.map((rx) => (
              <div key={rx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>{rx.name}</span>
                  <span className="text-emerald-600 font-semibold text-xs">{rx.duration}</span>
                </div>
                <p className="text-slate-600 font-medium">{rx.dosage}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-right">
            <button
              onClick={() => navigate(ROUTES.PHARMACY)}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto"
            >
              Order Refills at Pharmacy <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Lab Reports */}
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base text-slate-900">Diagnostic & Lab Reports</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Pathology
            </span>
          </div>

          <div className="space-y-3">
            {labReports.map((report) => (
              <div key={report.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{report.testName}</div>
                  <div className="text-slate-500">Date: {report.date}</div>
                  <div className="text-emerald-700 font-semibold">{report.status}</div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Downloading Lab Report PDF (${report.id})...`)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Lab reports are published directly after pathologist verification.</span>
          </div>
        </div>
      </div>

      {/* Third Row: Health Reminders & Patient Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Reminders Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[20px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">Personal Health Reminders</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Schedule Alerts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {healthReminders.map((rem) => (
              <div key={rem.id} className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/40 text-xs space-y-1">
                <div className="font-bold text-slate-900">{rem.title}</div>
                <p className="text-slate-600 leading-snug">{rem.detail}</p>
                <div className="text-[11px] text-amber-700 font-bold pt-1">{rem.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Billing Quick Link */}
        <div className="bg-white p-6 rounded-[20px] border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Hospital Billing & Invoices
            </h3>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <p className="text-slate-700">View statement breakdowns, pay medical invoices online via Razorpay, or download receipt PDFs.</p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(ROUTES.BILLING)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Go to Billing & Payments
          </Button>
        </div>
      </div>
    </div>
  );
};
