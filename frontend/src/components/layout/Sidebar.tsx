import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Pill,
  CreditCard,
  Settings,
  Activity,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAppSelector } from '../../hooks/store';
import { cn } from '../../utils/helpers';
import { ROUTES, APP_NAME } from '../../config/constants';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);

  const navItems: Array<{ label: string; path: string; icon: any; roles?: UserRole[] }> = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Admin Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: ShieldCheck, roles: ['ADMIN'] },
    { label: 'Patients', path: ROUTES.PATIENTS, icon: Users },
    { label: 'Doctors', path: ROUTES.DOCTORS, icon: UserCheck, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Appointments', path: ROUTES.APPOINTMENTS, icon: Calendar },
    { label: 'Pharmacy', path: ROUTES.PHARMACY, icon: Pill },
    { label: 'Billing', path: ROUTES.BILLING, icon: CreditCard },
    { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings }
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow-md shadow-primary-900/30 flex-shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-slate-100 text-base leading-none">{APP_NAME}</h1>
            <span className="text-[10px] font-medium text-primary-400 tracking-wider uppercase">Management System</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors'
          )}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-rose-500" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
