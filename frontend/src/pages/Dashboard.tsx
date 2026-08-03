import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import axiosInstance from '../config/axios';
import { Users, UserCheck, Calendar, Activity, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

interface HealthData {
  status: string;
  environment: string;
  database: string;
  uptime: number;
}

export const Dashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [errorHealth, setErrorHealth] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    setLoadingHealth(true);
    setErrorHealth(null);
    try {
      const response: any = await axiosInstance.get('/health');
      setHealth(response.data);
    } catch (err: any) {
      setErrorHealth(err?.message || 'Could not connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const stats = [
    { title: 'Total Patients', value: '1,284', change: '+12.5%', icon: Users, color: 'text-sky-600 bg-sky-50' },
    { title: 'Active Doctors', value: '64', change: '+4.2%', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Appointments Today', value: '42', change: '+8.1%', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { title: 'System Operation', value: '99.9%', change: 'Optimal', icon: Activity, color: 'text-purple-600 bg-purple-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome to CarePulse Hospital Management System Administrative Hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchHealthStatus} isLoading={loadingHealth}>
            Refresh Status
          </Button>
          <Button variant="primary" size="sm">
            Quick Action
          </Button>
        </div>
      </div>

      {/* Backend API Connection Status Banner */}
      <Card title="Backend API & Environment Diagnostics" subtitle="Real-time check connecting to Express REST API">
        {loadingHealth ? (
          <div className="animate-pulse flex items-center gap-3 text-slate-500 py-2">
            <div className="w-4 h-4 bg-slate-200 rounded-full animate-bounce"></div>
            <span className="text-sm">Connecting to http://localhost:5000/api/v1/health...</span>
          </div>
        ) : errorHealth ? (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Backend Service Offline or Unreachable</p>
                <p className="text-xs text-rose-600 mt-0.5">{errorHealth}</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={fetchHealthStatus}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
              <p className="text-xs text-slate-500 font-medium">REST API Status</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-sm text-slate-800">{health?.status}</span>
                <Badge variant="success">Online</Badge>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
              <p className="text-xs text-slate-500 font-medium">Environment</p>
              <p className="font-semibold text-sm text-slate-800 mt-1 capitalize">{health?.environment}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
              <p className="text-xs text-slate-500 font-medium">MySQL Connection</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={health?.database.includes('CONNECTED') ? 'success' : 'warning'}>
                  {health?.database}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
              <p className="text-xs text-slate-500 font-medium">Server Uptime</p>
              <p className="font-semibold text-sm text-slate-800 mt-1">
                {health?.uptime ? `${Math.round(health.uptime)} seconds` : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">{stat.value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
                <span className="text-emerald-600 font-medium flex items-center mr-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {stat.change}
                </span>
                vs last month
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
