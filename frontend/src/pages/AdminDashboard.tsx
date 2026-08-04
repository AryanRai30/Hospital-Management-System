import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AdminService, DashboardStats } from '../services/admin.service';
import { useAppSelector } from '../hooks/store';
import {
  Users,
  UserCheck,
  Calendar,
  Briefcase,
  Building2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token: authStateToken } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await AdminService.getDashboardStats(authStateToken);
      const data = response?.data || response;
      setStats({
        totalPatients: Number(data.totalPatients) || 0,
        totalDoctors: Number(data.totalDoctors) || 0,
        totalAppointments: Number(data.totalAppointments) || 0,
        totalStaff: Number(data.totalStaff) || 0,
        totalDepartments: Number(data.totalDepartments) || 0
      });
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Failed to load dashboard metrics from backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [authStateToken]);

  const cardConfigs = [
    {
      key: 'totalPatients',
      title: 'Total Patients',
      value: stats ? stats.totalPatients.toLocaleString() : '0',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      badge: 'Live MySQL'
    },
    {
      key: 'totalDoctors',
      title: 'Total Doctors',
      value: stats ? stats.totalDoctors.toLocaleString() : '0',
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badge: 'Active Staff'
    },
    {
      key: 'totalAppointments',
      title: 'Total Appointments',
      value: stats ? stats.totalAppointments.toLocaleString() : '0',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      badge: 'Scheduled'
    },
    {
      key: 'totalStaff',
      title: 'Total Staff',
      value: stats ? stats.totalStaff.toLocaleString() : '0',
      icon: Briefcase,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      badge: 'Personnel'
    },
    {
      key: 'totalDepartments',
      title: 'Total Departments',
      value: stats ? stats.totalDepartments.toLocaleString() : '0',
      icon: Building2,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      badge: 'Hospital Units'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregate hospital metrics and operational summary.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardStats}
            isLoading={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-800 gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-base">Dashboard Data Error</h3>
              <p className="text-sm text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={fetchDashboardStats} className="self-end sm:self-center">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Spinner / Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs min-h-[250px]">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-600">Loading dashboard metrics from database...</p>
            </div>
          </div>
        </div>
      ) : (
        /* Summary Metric Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {cardConfigs.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                className="hover:-translate-y-1 transition-all duration-200 border-slate-200/80 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2.5 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-3">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h2>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center text-emerald-600 font-medium gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Direct DB Count
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-medium text-slate-600">
                    {card.badge}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
