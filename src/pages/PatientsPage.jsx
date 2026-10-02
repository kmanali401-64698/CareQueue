import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  Phone,
  FileText,
  Mail,
  AlertCircle,
  Stethoscope,
  Pill,
  Activity,
  CheckCircle2,
  Clock,
  User
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { 
  PageHeader, 
  Button, 
  Card, 
  Badge, 
  TokenBadge, 
  ResponsiveTable, 
  StatCard, 
  EmptyState, 
  Modal,
  FormField,
  Input,
  Select 
} from '../components/ui';

export function PatientsPage() {
  const { patients, pastVisits, getPatientHistory, addPatient } = useClinic();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState(null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Patient Form State
  const initialFormState = {
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    email: '',
    bloodGroup: 'O+',
    allergies: '',
    emergencyContact: '',
  };
  const [patientForm, setPatientForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Filter patients by name, phone, email, or blood group
  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.bloodGroup || '').toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const validateForm = () => {
    const errors = {};
    if (!patientForm.name.trim()) errors.name = 'Patient full name is required';
    if (!patientForm.age || isNaN(patientForm.age) || Number(patientForm.age) <= 0 || Number(patientForm.age) > 125) {
      errors.age = 'Please enter a valid age (1–125)';
    }
    if (!patientForm.phone.trim()) errors.phone = 'Contact phone number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const created = await addPatient({
        name: patientForm.name.trim(),
        age: Number(patientForm.age),
        gender: patientForm.gender,
        phone: patientForm.phone.trim(),
        email: patientForm.email.trim() || undefined,
        bloodGroup: patientForm.bloodGroup,
        allergies: patientForm.allergies.trim() || 'None known',
        emergencyContact: patientForm.emergencyContact.trim() || 'Not specified',
      });

      toast.success(`Patient "${created.name}" registered successfully!`);
      setIsAddPatientModalOpen(false);
      setPatientForm(initialFormState);
      setFormErrors({});
      // Automatically open the new patient's profile
      setSelectedPatientForProfile(created);
    } catch (err) {
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Patient Directory Columns
  const patientColumns = [
    {
      header: 'Patient Identity',
      accessor: 'name',
      primaryMobile: true,
      render: (name, row) => (
        <div 
          className="cursor-pointer group py-1"
          onClick={() => setSelectedPatientForProfile(row)}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              {name}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {row.bloodGroup}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {row.age} yrs • {row.gender} • ID: <code className="font-mono text-[11px]">{row.id}</code>
          </span>
        </div>
      ),
    },
    {
      header: 'Contact Details',
      accessor: 'phone',
      render: (phone, row) => (
        <div>
          <div className="font-mono text-xs text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            {phone}
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Known Allergies',
      accessor: 'allergies',
      render: (allergies) => (
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${
            allergies === 'None known'
              ? 'bg-slate-100 text-slate-600'
              : 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
          }`}
        >
          {allergies !== 'None known' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
          {allergies}
        </span>
      ),
    },
    {
      header: 'Visit History',
      accessor: 'id',
      render: (id) => {
        const historyCount = getPatientHistory(id).length;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            {historyCount} {historyCount === 1 ? 'Past Visit' : 'Past Visits'}
          </span>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'right',
      render: (id, row) => (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            icon={User}
            onClick={() => setSelectedPatientForProfile(row)}
          >
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  const profileVisits = selectedPatientForProfile
    ? getPatientHistory(selectedPatientForProfile.id)
    : [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Patients Directory & Medical Profiles"
        subtitle="Manage patient registrations, demographic profiles, and inspect comprehensive clinical visit timelines."
        breadcrumbs={['CareQueue', 'Front Desk', 'Patients']}
        badge={<Badge variant="teal">{patients.length} Registered Patients</Badge>}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setPatientForm(initialFormState);
              setFormErrors({});
              setIsAddPatientModalOpen(true);
            }}
          >
            Add New Patient
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Registered Patients"
          value={patients.length.toString()}
          icon={Users}
          iconColor="teal"
          badgeText="Active Directory"
        />
        <StatCard
          title="Total Completed Visits"
          value={pastVisits.length.toString()}
          icon={CheckCircle2}
          iconColor="emerald"
          subtitle="Full timeline & diagnoses logged"
        />
        <StatCard
          title="Avg Visits Per Patient"
          value={(pastVisits.length / Math.max(patients.length, 1)).toFixed(1)}
          icon={Activity}
          iconColor="blue"
          trend={{ value: '100% electronic records', isPositive: true }}
        />
      </div>

      {/* Patient Directory Table */}
      <Card padding="none">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, phone, email, blood group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder-slate-400 text-slate-800"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Showing <strong>{filteredPatients.length}</strong> of {patients.length} patients</span>
            <span className="text-slate-300">•</span>
            <span className="text-brand-700 font-medium">Click any patient to open profile</span>
          </div>
        </div>

        <ResponsiveTable
          columns={patientColumns}
          data={filteredPatients}
          emptyState={
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No patients found"
                description={searchTerm ? `No patient profiles match "${searchTerm}".` : "No patients currently registered."}
                action={
                  searchTerm ? (
                    <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddPatientModalOpen(true)}>
                      Add First Patient
                    </Button>
                  )
                }
              />
            </div>
          }
        />
      </Card>

      {/* Patient Profile & Visit History Timeline Modal */}
      <Modal
        isOpen={!!selectedPatientForProfile}
        onClose={() => setSelectedPatientForProfile(null)}
        title={`Patient Profile: ${selectedPatientForProfile?.name}`}
        description={`Record ID: ${selectedPatientForProfile?.id} • Registered Profile & Historical Consultations`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              {profileVisits.length} consultation {profileVisits.length === 1 ? 'record' : 'records'} on file
            </div>
            <Button variant="outline" onClick={() => setSelectedPatientForProfile(null)}>
              Close Profile
            </Button>
          </div>
        }
      >
        {selectedPatientForProfile && (
          <div className="space-y-6 max-h-[72vh] overflow-y-auto pr-1">
            {/* Patient Demographic Summary Card */}
            <div className="bg-gradient-to-br from-slate-50 to-brand-50/30 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-soft">
                    {selectedPatientForProfile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedPatientForProfile.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedPatientForProfile.gender} • {selectedPatientForProfile.age} Years Old
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                    Blood: {selectedPatientForProfile.bloodGroup}
                  </span>
                  <Badge variant="teal">Registered</Badge>
                </div>
              </div>

              {/* Grid of Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Contact Phone</span>
                  <div className="font-mono text-slate-800 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    {selectedPatientForProfile.phone}
                  </div>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Email Address</span>
                  <div className="text-slate-800 font-medium flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">{selectedPatientForProfile.email}</span>
                  </div>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Known Allergies</span>
                  <div className="font-semibold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {selectedPatientForProfile.allergies}
                  </div>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Emergency Contact</span>
                  <div className="text-slate-700 font-medium truncate">
                    {selectedPatientForProfile.emergencyContact}
                  </div>
                </div>
              </div>
            </div>

            {/* Visit History Timeline Section */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Visit History Timeline
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  Chronological record of completed OPD consultations
                </span>
              </div>

              {profileVisits.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Past Completed Visits"
                  description="This patient does not have completed clinical consultations on record yet."
                />
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-200">
                  {profileVisits.map((visit) => (
                    <div key={visit.id} className="relative group">
                      {/* Timeline Node Bullet */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-brand-600 text-brand-600 flex items-center justify-center font-bold text-xs shadow-soft">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>

                      {/* Timeline Item Card */}
                      <div className="bg-white border border-slate-200/90 hover:border-brand-300 rounded-xl p-4 sm:p-5 shadow-soft transition-all space-y-3">
                        {/* Visit Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <TokenBadge token={visit.token} size="sm" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{visit.date}</span>
                                <span className="text-slate-400 font-mono text-xs">{visit.time}</span>
                              </div>
                              <span className="text-xs text-slate-500">OPD Consultation</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge status="Completed" />
                            <Badge status={visit.billingStatus || 'Paid'} size="sm" withDot={false} />
                          </div>
                        </div>

                        {/* Consulting Doctor */}
                        <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          <Stethoscope className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>
                            Attending Physician: <strong>{visit.doctorName}</strong> ({visit.doctorSpecialty}, {visit.room})
                          </span>
                        </div>

                        {/* Chief Complaint */}
                        {visit.chiefComplaint && (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-500 uppercase text-[10px] block">
                              Chief Complaint
                            </span>
                            <p className="text-slate-800 mt-0.5 font-medium">{visit.chiefComplaint}</p>
                          </div>
                        )}

                        {/* Clinical Diagnosis */}
                        <div className="text-xs bg-brand-50/50 p-3 rounded-lg border border-brand-200/70 space-y-1">
                          <span className="font-bold text-brand-900 uppercase text-[10px] block">
                            Clinical Diagnosis & ICD
                          </span>
                          <p className="font-semibold text-brand-950 text-xs sm:text-sm">
                            {visit.diagnosis}
                          </p>
                        </div>

                        {/* Vitals */}
                        {visit.vitals && (
                          <div className="text-xs flex items-center gap-2 text-slate-700">
                            <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-500 uppercase text-[10px]">Vitals:</span>
                            <span className="font-mono text-slate-800">{visit.vitals}</span>
                          </div>
                        )}

                        {/* Prescriptions */}
                        {visit.prescription && (
                          <div className="text-xs flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/50">
                            <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-emerald-900 block text-[11px] uppercase">
                                Prescribed Medications (Rx)
                              </span>
                              <p className="text-emerald-800 mt-0.5 leading-relaxed">{visit.prescription}</p>
                            </div>
                          </div>
                        )}

                        {/* Clinical Notes */}
                        {visit.clinicalNotes && (
                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 italic">
                            <strong>Physician Notes:</strong> {visit.clinicalNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* "Add Patient" Modal */}
      <Modal
        isOpen={isAddPatientModalOpen}
        onClose={() => !isSubmitting && setIsAddPatientModalOpen(false)}
        title="Register New Patient Profile"
        description="Enter patient demographic details, emergency contact, and known allergies."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsAddPatientModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleCreatePatient}
            >
              Save Patient Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <FormField
            label="Full Name"
            id="patient-name"
            required
            error={formErrors.name}
            helperText="e.g. Clara Oswald"
          >
            <Input
              id="patient-name"
              placeholder="Full Name"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              error={formErrors.name}
              disabled={isSubmitting}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Age (Years)"
              id="patient-age"
              required
              error={formErrors.age}
            >
              <Input
                id="patient-age"
                type="number"
                min="1"
                max="125"
                placeholder="Age"
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                error={formErrors.age}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Gender" id="patient-gender" required>
              <Select
                id="patient-gender"
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              id="patient-phone"
              required
              error={formErrors.phone}
            >
              <Input
                id="patient-phone"
                placeholder="+1 555-0100"
                value={patientForm.phone}
                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                error={formErrors.phone}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Blood Group" id="patient-blood">
              <Select
                id="patient-blood"
                value={patientForm.bloodGroup}
                onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
                disabled={isSubmitting}
              >
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
          </div>

          <FormField
            label="Email Address"
            id="patient-email"
            helperText="Optional; used for appointment reminders"
          >
            <Input
              id="patient-email"
              type="email"
              placeholder="patient@example.com"
              value={patientForm.email}
              onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Known Allergies"
            id="patient-allergies"
            helperText="Specify food, drug, or contact allergies (or leave empty for 'None known')"
          >
            <Input
              id="patient-allergies"
              placeholder="e.g. Penicillin, Sulfa, Shellfish"
              value={patientForm.allergies}
              onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Emergency Contact"
            id="patient-emergency"
            helperText="Name, Relationship & Phone Number"
          >
            <Input
              id="patient-emergency"
              placeholder="e.g. Danny Pink (Spouse) - +1 555-0101"
              value={patientForm.emergencyContact}
              onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
              disabled={isSubmitting}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default PatientsPage;
