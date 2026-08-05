import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAppSelector } from '../../hooks/store';
import { ROUTES } from '../../config/constants';
import { getGreetingMessage } from '../../utils/user.helpers';
import {
  FlaskConical,
  Clock,
  Upload,
  CheckCircle2,
  TestTube
} from 'lucide-react';

export const LabDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const { greeting, subtitle, badge } = getGreetingMessage(user);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Pending Tests List
  const pendingTests = [
    { sampleId: 'SMP-801', patient: 'Marcus Brody', test: 'Complete Blood Count (CBC)', priority: 'STAT Emergency', status: 'In-Analysis' },
    { sampleId: 'SMP-804', patient: 'Sophia Martinez', test: 'Lipid Profile & Glucose', priority: 'High', status: 'Sample Collected' },
    { sampleId: 'SMP-809', patient: 'David Sterling', test: 'Liver Function Test (LFT)', priority: 'Normal', status: 'Pending Collection' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Lab Header Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-purple-800/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-md border border-purple-500/30 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> {badge}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentDateStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              {subtitle} Collect blood & pathology samples, analyze lab specimens, and upload verified PDF test results to patient charts.
            </p>
          </div>
        </div>
      </div>

      {/* Lab Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-purple-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Pending Diagnostics</span>
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">3 Samples</h2>
          <p className="text-xs text-purple-600 font-medium mt-1">1 STAT Emergency Case</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-sky-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Samples Collected</span>
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <TestTube className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">18 Specimens</h2>
          <p className="text-xs text-sky-600 font-medium mt-1">Ready for centrifuge & assay</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-amber-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Reports to Upload</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Upload className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">4 Verified</h2>
          <p className="text-xs text-amber-600 font-medium mt-1">Awaiting digital sign-off</p>
        </Card>

        <Card className="p-5 border-slate-200/80 bg-gradient-to-br from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed Today</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-2">48 Tests</h2>
          <p className="text-xs text-emerald-600 font-medium mt-1">Published to patient medical charts</p>
        </Card>
      </div>

      {/* Pending Tests Queue */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-base text-slate-900">Diagnostic Tests Queue</h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
            Pathology Laboratory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-3.5 px-4">Sample ID & Patient</th>
                <th className="py-3.5 px-4">Test Name</th>
                <th className="py-3.5 px-4">Priority Level</th>
                <th className="py-3.5 px-4 text-right">Analysis Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pendingTests.map((item) => (
                <tr key={item.sampleId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{item.patient}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.sampleId}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{item.test}</td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold ${item.priority.includes('STAT') ? 'text-rose-600' : 'text-slate-600'}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
