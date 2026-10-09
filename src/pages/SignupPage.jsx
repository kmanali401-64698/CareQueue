import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, FormField, Input, Select } from '../components/ui';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: 'Unknown',
    allergies: '',
    emergencyContact: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email address is required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.age || isNaN(form.age) || Number(form.age) <= 0 || Number(form.age) > 125) errs.age = 'Valid age is required';
    if (!form.gender) errs.gender = 'Please select a gender';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        age: Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.trim() || 'None known',
        emergencyContact: form.emergencyContact.trim() || 'Not specified',
      });

      toast.success('Patient account created successfully!');
      navigate('/patient-portal', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create patient account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-soft-md shadow-brand-500/20 mb-2">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Register Patient Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Create your patient profile to book appointments, view prescriptions, and access medical receipts
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft-md rounded-2xl border border-slate-200/90 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" id="reg-name" required error={errors.name}>
              <Input
                id="reg-name"
                placeholder="Emma Watson"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                disabled={isLoading}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email Address" id="reg-email" required error={errors.email}>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="patient@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Password" id="reg-password" required error={errors.password}>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="At least 6 chars"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Phone" id="reg-phone" required error={errors.phone}>
                <Input
                  id="reg-phone"
                  placeholder="+1 555-0100"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={errors.phone}
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Age" id="reg-age" required error={errors.age}>
                <Input
                  id="reg-age"
                  type="number"
                  min="1"
                  max="125"
                  placeholder="29"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  error={errors.age}
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Gender" id="reg-gender" required error={errors.gender}>
                <Select
                  id="reg-gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Blood Group" id="reg-blood">
                <Select
                  id="reg-blood"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="Unknown">Unknown / Not tested</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Select>
              </FormField>

              <FormField label="Known Allergies" id="reg-allergies">
                <Input
                  id="reg-allergies"
                  placeholder="e.g. Penicillin, Sulfa"
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <FormField label="Emergency Contact Info" id="reg-emergency">
              <Input
                id="reg-emergency"
                placeholder="e.g. Spouse Name & Phone"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                disabled={isLoading}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-sm font-bold shadow-soft"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Complete Registration & Access Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
