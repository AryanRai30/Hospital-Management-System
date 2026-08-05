import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAppSelector } from '../../hooks/store';
import { ROUTES } from '../../config/constants';
import { getGreetingMessage } from '../../utils/user.helpers';
import {
  Pill,
  Clock,
  AlertTriangle,
  Package,
  Receipt,
  ShieldAlert
} from 'lucide-react';

export const PharmacistDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { greeting, subtitle, badge } = getGreetingMessage(user);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Pending Prescriptions Queue
  const pendingPrescriptions = [
    { rxId: 'RX-904', patient: 'Eleanor Vance', doctor: 'Dr. Sarah Jenkins', meds: 'Amoxicillin 500mg, Paracetamol 650mg', status: 'Ready to Dispense' },
    { rxId: 'RX-908', patient: 'Marcus Brody', doctor: 'Dr. Alex Rivera', meds: 'Atorvastatin 20mg, Aspirin 75mg', status: 'Pending Verification' },
    { rxId: 'RX-912', patient: 'Sophia Martinez', doctor: 'Dr. Emily Chen', meds: 'Cephalexin Syrup 250mg', status: 'Ready to Dispense' }
  ];

  // Low Stock & Expiring Alerts
  const inventoryAlerts = [
    { drug: 'Amoxicillin 500mg Capsules', status: 'Low Stock (14 Units)', level: 'danger' },
    { drug: 'Insulin Glargine 100IU/ml', status: 'Expiring in 12 Days', level: 'warning' },
    { drug: 'Azithromycin 250mg Tablets', status: 'Stock Reordered', level: 'info' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Pharmacy Header Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-emerald-800/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-500/30 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> {badge}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentDateStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              {subtitle} Dispense verified doctor prescriptions, monitor medicine stock levels, check expiry dates, and process daily sales.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.PHARMACY)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Manage Inventory
            </Button>
          </div>
        </div>
      </div>

      {/* Pharmacy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Pending Prescriptions</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">3 Orders</h2>
          <p className="text-xs text-emerald-600 font-medium mt-1">2 Ready to Dispense</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-rose-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">4 Drugs</h2>
          <p className="text-xs text-rose-600 font-medium mt-1">Below minimum threshold</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-amber-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Expiring Medicine</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">2 Batches</h2>
          <p className="text-xs text-amber-600 font-medium mt-1">Expiring within 30 days</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-sky-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Daily Pharmacy Sales</span>
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">₹18,450</h2>
          <p className="text-xs text-sky-600 font-medium mt-1">42 Prescriptions filled today</p>
        </Card>
      </div>

      {/* Main Pharmacy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Prescriptions Queue Table */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Pending Prescriptions to Dispense</h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              Live Pharmacy Counter
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Rx ID & Patient</th>
                  <th className="py-3.5 px-4">Prescribing Doctor</th>
                  <th className="py-3.5 px-4">Medications</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingPrescriptions.map((item) => (
                  <tr key={item.rxId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.patient}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.rxId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{item.doctor}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.meds}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drug Stock & Expiry Alerts */}
        <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Inventory Stock Warnings
            </h4>
          </div>

          <div className="space-y-2.5">
            {inventoryAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  alert.level === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                  alert.level === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                  'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="font-bold">{alert.drug}</div>
                <div className="text-[11px] font-semibold">{alert.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
