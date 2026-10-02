import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import {
  PageHeader,
  Button,
  Card,
  Badge,
  FormField,
  Input,
  Select,
  ResponsiveTable
} from '../components/ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AdminPage() {
  const { token } = useAuth();
  const { setDoctors } = useClinic();

  const [staffUsers, setStaffUsers] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'Doctor',
    specialty: 'Cardiology & General Medicine',
    room: 'OPD 104',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 15,
    consultationFee: 600,
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Fetch Staff
  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data.staff);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const toggleDay = (day) => {
    setForm((prev) => {
      const exists = prev.workingDays.includes(day);
      const updated = exists ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day];
      return { ...prev, workingDays: updated };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Staff full name is required';
    if (!form.email.trim()) errs.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');

      toast.success(`${form.role} account for ${form.name} created successfully!`);
      
      // If doctor, also update in local context
      if (data.doctor) {
        setDoctors((prev) => [...prev, data.doctor]);
      }

      setForm(initialForm);
      setErrors({});
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Error creating staff user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const staffColumns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      primaryMobile: true,
      render: (name, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{name}</span>
          <span className="text-xs text-slate-400 font-mono">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Role Assignment',
      accessor: 'role',
      render: (role) => (
        <Badge 
          variant={role === 'Admin' ? 'purple' : role === 'Doctor' ? 'blue' : 'teal'}
        >
          {role}
        </Badge>
      ),
    },
    {
      header: 'Linked Profile',
      accessor: 'doctorId',
      render: (docId, row) => (
        <span className="text-xs text-slate-600">
          {docId ? `Physician ID: ${docId}` : row.patientId ? `Patient ID: ${row.patientId}` : 'Administrative Staff'}
        </span>
      ),
    },
    {
      header: 'Access Scope',
      accessor: 'role',
      render: (role) => (
        <span className="text-xs text-slate-500 font-medium">
          {role === 'Doctor' ? 'Own Queue & Consultations' : role === 'Receptionist' ? 'Full Clinic Operations' : 'Master Administrator'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'id',
      align: 'right',
      render: () => <Badge variant="green">Active</Badge>,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Staff Account Administration"
        subtitle="Create and manage Doctor and Receptionist credentials. Staff accounts are provisioned exclusively by administrators."
        breadcrumbs={['CareQueue', 'System Administration', 'Staff Accounts']}
        badge={<Badge variant="purple">Admin Security Console</Badge>}
      />

      {/* Security Banner */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-soft">
        <div className="p-2 bg-purple-600 text-white rounded-xl shrink-0 mt-0.5 shadow-soft-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-purple-950 space-y-1">
          <p className="font-bold text-purple-900">
            Strict Staff Provisioning Policy
          </p>
          <p className="text-purple-800/90 leading-relaxed">
            Public registration is strictly limited to <strong>Patients</strong>. All Doctors, Receptionists, and Clinic Administrators must be provisioned through this portal. Passwords are encrypted with bcrypt and verified on all protected API routes using JWT bearer tokens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Staff Account Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Create New Staff Account
              </h3>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
              <FormField label="Staff Role" id="staff-role" required>
                <Select
                  id="staff-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="Doctor">Doctor (Clinical OPD Physician)</option>
                  <option value="Receptionist">Receptionist (Front Desk Operations)</option>
                  <option value="Admin">Administrator (Full System Control)</option>
                </Select>
              </FormField>

              <FormField label="Full Name" id="staff-name" required error={errors.name}>
                <Input
                  id="staff-name"
                  placeholder={form.role === 'Doctor' ? 'Dr. Gregory House' : 'Jane Doe'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Email Address" id="staff-email" required error={errors.email}>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@carequeue.org"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Account Password" id="staff-password" required error={errors.password}>
                <Input
                  id="staff-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  disabled={isSubmitting}
                />
              </FormField>

              {/* Extra Doctor Details */}
              {form.role === 'Doctor' && (
                <div className="pt-3 border-t border-slate-100 space-y-4 bg-brand-50/40 p-3.5 rounded-xl border border-brand-100">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                      Physician Practice Details
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Specialty" id="staff-specialty">
                      <Input
                        id="staff-specialty"
                        placeholder="Internal Medicine"
                        value={form.specialty}
                        onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField label="Room" id="staff-room">
                      <Input
                        id="staff-room"
                        placeholder="OPD 104"
                        value={form.room}
                        onChange={(e) => setForm({ ...form, room: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Practicing Days:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                      {WEEKDAYS.map((day) => {
                        const isChecked = form.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`py-1 rounded text-[11px] font-bold border transition-all ${
                              isChecked
                                ? 'bg-brand-600 border-brand-700 text-white'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="Start" id="staff-start">
                      <Input
                        id="staff-start"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </FormField>
                    <FormField label="End" id="staff-end">
                      <Input
                        id="staff-end"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </FormField>
                    <FormField label="Fee (Rs.)" id="staff-fee">
                      <Input
                        id="staff-fee"
                        type="number"
                        value={form.consultationFee}
                        onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-2.5 font-bold shadow-soft"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Staff Account
              </Button>
            </form>
          </Card>
        </div>

        {/* Staff Registry Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="none">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Authorized Staff Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Currently active user accounts registered in CareQueue system.
                </p>
              </div>

              <Badge variant="teal">{staffUsers.length} Registered Staff</Badge>
            </div>

            <ResponsiveTable
              columns={staffColumns}
              data={staffUsers}
              isLoading={isLoadingStaff}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
