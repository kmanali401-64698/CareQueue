import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HeartPulse,
  X,
  ShieldCheck,
  LayoutDashboard,
  MonitorPlay,
  Clock,
  Stethoscope,
  Calendar,
  UserCheck,
  Users,
  FileText,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS_BY_ROLE = {
  Admin: [
    { name: 'Staff Management', path: '/admin', icon: ShieldCheck },
    { name: 'Operations Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Waiting Room TV', path: '/display', icon: MonitorPlay },
    { name: 'Doctor Rosters & Leaves', path: '/doctors', icon: UserCheck },
    { name: 'Appointments & Slots', path: '/appointments', icon: Calendar },
    { name: 'Patient Directory', path: '/patients', icon: Users },
    { name: 'Design System Rules', path: '/design-system', icon: Layers },
  ],
  Receptionist: [
    { name: 'Front Desk Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Waiting Room TV', path: '/display', icon: MonitorPlay },
    { name: 'Live Patient Queue', path: '/queue', icon: Clock },
    { name: 'Doctor Consultation', path: '/consultation', icon: Stethoscope },
    { name: 'Appointments & Slots', path: '/appointments', icon: Calendar },
    { name: 'Doctor Schedules & Leaves', path: '/doctors', icon: UserCheck },
    { name: 'Patient Directory & History', path: '/patients', icon: Users },
    { name: 'Design System Rules', path: '/design-system', icon: Layers },
  ],
  Doctor: [
    { name: 'Consultation Desk', path: '/consultation', icon: Stethoscope },
    { name: 'My Patient Queue', path: '/queue', icon: Clock },
    { name: 'Waiting Room TV', path: '/display', icon: MonitorPlay },
    { name: 'Appointments & Slots', path: '/appointments', icon: Calendar },
    { name: 'My Schedule & Leaves', path: '/doctors', icon: UserCheck },
    { name: 'Patient Medical History', path: '/patients', icon: FileText },
    { name: 'Design System Rules', path: '/design-system', icon: Layers },
  ],
  Patient: [
    { name: 'My Health Portal', path: '/patient-portal', icon: HeartPulse },
    { name: 'Waiting Room TV', path: '/display', icon: MonitorPlay },
  ],
};

export function Sidebar({ isOpen, onClose }) {
  const { user, role } = useAuth();
  const navItems = NAV_ITEMS_BY_ROLE[role] || NAV_ITEMS_BY_ROLE.Receptionist;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Clinic Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-soft">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                CareQueue
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 block -mt-0.5">
                Clinic System
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Authenticated User Banner */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Logged In'}</p>
            <p className="text-[11px] text-brand-700 font-bold tracking-wide">
              {role} {user?.doctorId ? `(${user.doctorId})` : ''}
            </p>
          </div>
        </div>

        {/* Role-Specific Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation ({role})
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExternalDisplay = item.path === '/display';

            return isExternalDisplay ? (
              <a
                key={item.name}
                href="/display"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              >
                <Icon className="w-4 h-4 shrink-0 text-brand-600" />
                <span>{item.name}</span>
                <span className="ml-auto text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  TV
                </span>
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 font-semibold shadow-soft-xs border border-brand-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-brand-600" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-600">CareQueue Auth v2.0</span>
          </div>
          <p className="mt-1 text-[11px]">JWT RBAC Security Active</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
