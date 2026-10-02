import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartPulse,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  User,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, FormField, Input } from '../components/ui';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    label: 'Clinic Admin',
    email: 'admin@carequeue.org',
    password: 'admin123',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: ShieldCheck,
    desc: 'Staff creation & system oversight',
  },
  {
    role: 'Receptionist',
    label: 'Receptionist',
    email: 'receptionist@carequeue.org',
    password: 'reception123',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: UserCheck,
    desc: 'Front desk, queue, billing & roster',
  },
  {
    role: 'Doctor',
    label: 'Dr. Sarah Chen',
    email: 'doctor.chen@carequeue.org',
    password: 'doctor123',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Stethoscope,
    desc: 'Consultations, prescriptions & OPD',
  },
  {
    role: 'Patient',
    label: 'Emma Watson',
    email: 'emma.watson@carequeue.org',
    password: 'patient123',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: User,
    desc: 'Personal appointments, Rx & bills',
  },
];

export function LoginPage() {
  const { login, getRoleHomeRoute } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      const destination = getRoleHomeRoute(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Login Button
  const handleQuickDemoLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveDemoRole(demo.role);
    setIsLoading(true);

    try {
      const user = await login(demo.email, demo.password);
      toast.success(`Logged in as ${demo.role}: ${user.name}`);
      const destination = getRoleHomeRoute(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
      setActiveDemoRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        {/* Clinic Brand Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-soft-md shadow-brand-500/20 mb-2">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          CareQueue Medical
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Sign in to access your clinic role workspace & clinical records
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Main Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft-md rounded-2xl border border-slate-200/90 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email Address" id="login-email" required>
              <div className="relative">
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@carequeue.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </FormField>

            <FormField label="Password" id="login-password" required>
              <div className="relative">
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-sm font-bold shadow-soft"
              isLoading={isLoading && !activeDemoRole}
              disabled={isLoading}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-600" />
                Quick 1-Click Demo Logins:
              </span>
              <span className="text-[10px] text-slate-400">One per role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => {
                const Icon = demo.icon;
                const isLoggingIn = isLoading && activeDemoRole === demo.role;

                return (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickDemoLogin(demo)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-brand-700 flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5 text-brand-600" />
                        {demo.role}
                      </span>
                      {isLoggingIn && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {demo.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Patient Signup Callout */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New patient?{' '}
              <Link
                to="/signup"
                className="font-bold text-brand-600 hover:text-brand-800 hover:underline"
              >
                Create your patient account
              </Link>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              (Staff accounts are managed by Administrator)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
