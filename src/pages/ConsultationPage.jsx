import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Stethoscope,
  Users,
  History,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  FileText,
  Pill,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { todayISO } from '../utils/date';
import {
  PageHeader,
  Button,
  Card,
  Badge,
  TokenBadge,
  FormField,
  Input,
  EmptyState
} from '../components/ui';
import { PrintablePrescription } from '../components/clinical/PrintablePrescription';
import { useAuth } from '../context/AuthContext';

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export function ConsultationPage() {
  const { user } = useAuth();
  const { 
    doctors, 
    patients, 
    appointments, 
    getPatientHistory, 
    completeVisit
  } = useClinic();

  // Active Doctor Selection (Doctor is bound to their own doctorId; Receptionist/Admin can switch)
  const initialDoctorId = (user?.role === 'Doctor' && user?.doctorId) ? user.doctorId : (doctors[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Doctor role is pinned to their own roster
  const canSwitchDoctor = user?.role !== 'Doctor';


  // Eligible appointments for this doctor (InConsultation, CheckedIn, or Booked)
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === activeDoctor?.id && a.date === todayISO() && !['Cancelled', 'NoShow'].includes(a.status)
  );

  // Default active appointment: first InConsultation or CheckedIn
  const activeAptDefault = doctorAppointments.find((a) => a.status === 'InConsultation') ||
    doctorAppointments.find((a) => a.status === 'CheckedIn') ||
    doctorAppointments[0];

  const [activeAppointmentId, setActiveAppointmentId] = useState(activeAptDefault?.id || '');
  const activeAppointment = appointments.find((a) => a.id === activeAppointmentId) || activeAptDefault;
  const activePatient = patients.find((p) => p.id === activeAppointment?.patientId);

  // Past visits for side panel
  const patientHistory = activePatient ? getPatientHistory(activePatient.id) : [];
  const [expandedVisitId, setExpandedVisitId] = useState(patientHistory[0]?.id || null);

  // Consultation Form State (always starts blank for each patient)
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [vitals, setVitals] = useState('');
  const [advice, setAdvice] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Prescription Medicines Builder
  const [medicines, setMedicines] = useState([EMPTY_MEDICINE]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Switch to another patient in the queue and clear the form so notes never carry over
  const selectAppointment = (appointmentId) => {
    setActiveAppointmentId(appointmentId);
    setChiefComplaint('');
    setDiagnosis('');
    setVitals('');
    setAdvice('');
    setClinicalNotes('');
    setMedicines([EMPTY_MEDICINE]);
    const nextApt = appointments.find((a) => a.id === appointmentId);
    setExpandedVisitId(nextApt ? getPatientHistory(nextApt.patientId)[0]?.id || null : null);
  };

  const canComplete = !!activeAppointment && ['CheckedIn', 'InConsultation'].includes(activeAppointment.status);

  // Printable Prescription Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [currentPrescriptionData, setCurrentPrescriptionData] = useState(null);

  // Add Medication Row
  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { ...EMPTY_MEDICINE },
    ]);
  };

  // Remove Medication Row
  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Medication Field
  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Copy past prescription into current form
  const handleCopyPastPrescription = (pastVisit) => {
    if (pastVisit.medicines && pastVisit.medicines.length > 0) {
      setMedicines([...pastVisit.medicines]);
      if (pastVisit.diagnosis) setDiagnosis(pastVisit.diagnosis);
      if (pastVisit.advice) setAdvice(pastVisit.advice);
      toast.success(`Copied previous prescription from ${pastVisit.date} into current Rx!`);
    } else {
      toast.error('No structured medicines found in that record');
    }
  };

  // Prepare Printable Prescription
  const handleOpenPrintPreview = () => {
    if (!activeAppointment || !activePatient) {
      toast.error('No active patient selected');
      return;
    }

    const prescriptionPayload = {
      doctorName: activeDoctor.name,
      doctorSpecialty: activeDoctor.specialty,
      room: activeDoctor.room,
      doctorRegNo: activeDoctor.registrationNo || '',
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientPhone: activePatient.phone,
      date: todayISO(),
      token: activeAppointment.token,
      vitals,
      allergies: activePatient.allergies,
      diagnosis,
      medicines,
      advice,
    };

    setCurrentPrescriptionData(prescriptionPayload);
    setIsPrintModalOpen(true);
  };

  // Complete Visit Action
  const handleCompleteConsultation = async () => {
    if (!canComplete) {
      toast.error('Only checked-in patients can be discharged');
      return;
    }
    if (!diagnosis.trim()) {
      toast.error('Please enter a diagnosis before completing the visit');
      return;
    }

    setIsCompleting(true);
    try {
      await completeVisit(activeAppointment.id, {
        chiefComplaint,
        diagnosis,
        vitals,
        medicines: medicines.filter((m) => m.name.trim()),
        advice,
        clinicalNotes,
      });
      toast.success(`Consultation completed for ${activeAppointment.patientName}! Added to patient medical history.`);
      // Automatically open the prescription for printing
      handleOpenPrintPreview();
    } catch (err) {
      toast.error(err.message || 'Failed to complete consultation');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!activeDoctor) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No doctors configured"
        description="Ask an administrator to create a doctor account first."
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Doctor Consultation & Clinical EMR"
        subtitle="Active consultation room, real-time prescription builder, and patient historical visits panel."
        breadcrumbs={['CareQueue', 'Clinical OPD', 'Consultation']}
        badge={
          <Badge variant="teal">
            {activeDoctor.name} ({activeDoctor.room})
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Printer}
              onClick={handleOpenPrintPreview}
              disabled={!activeAppointment}
            >
              Print Prescription
            </Button>
            <Button
              variant="primary"
              icon={CheckCircle2}
              onClick={handleCompleteConsultation}
              disabled={!canComplete || isCompleting}
              isLoading={isCompleting}
            >
              Complete Visit & Discharge
            </Button>
          </div>
        }
      />

      {/* Doctor & Patient Queue Selector Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft flex flex-wrap items-center justify-between gap-4">
        {/* Doctor Switcher */}
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Physician:</span>
          {!canSwitchDoctor ? (
            <span className="text-xs sm:text-sm font-bold text-slate-900 bg-brand-50 border border-brand-200 rounded-xl px-3 py-1.5">
              {activeDoctor.name} ({activeDoctor.specialty} • {activeDoctor.room})
            </span>
          ) : (
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                const apt = appointments.find(
                  (a) => a.doctorId === e.target.value && a.date === todayISO() && !['Cancelled', 'NoShow'].includes(a.status)
                );
                selectAppointment(apt ? apt.id : '');
              }}
              className="text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • {d.room})
                </option>
              ))}
            </select>
          )}
        </div>


        {/* Queue Tokens for this Doctor */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Queue:</span>
          {doctorAppointments.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No patients in queue</span>
          ) : (
            doctorAppointments.map((apt) => {
              const isSelected = apt.id === activeAppointment?.id;
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => selectAppointment(apt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-brand-600 border-brand-700 text-white shadow-soft-xs ring-2 ring-brand-500/30'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono font-bold">{apt.token}</span>
                  <span className="truncate max-w-[100px]">{apt.patientName}</span>
                  <Badge status={apt.status} size="sm" withDot={false} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Consultation Desk + Side Panel (Previous Visits & Rx) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Active Consultation Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeAppointment && activePatient ? (
            <>
              {/* Patient Banner */}
              <div className="bg-gradient-to-r from-brand-50/70 via-white to-slate-50 border border-brand-200/80 rounded-2xl p-4 sm:p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-100">
                  <div className="flex items-center gap-3">
                    <TokenBadge token={activeAppointment.token} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {activePatient.name}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                          {activePatient.bloodGroup}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {activePatient.gender} • {activePatient.age} yrs • ID: {activePatient.id} • Tel: {activePatient.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge status={activeAppointment.status} />
                    <Badge status={activeAppointment.billingStatus || 'Unpaid'} size="sm" withDot={false} />
                  </div>
                </div>

                {/* Allergies Highlight */}
                {activePatient.allergies && activePatient.allergies !== 'None known' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>CRITICAL ALLERGY ALERT: {activePatient.allergies}</span>
                  </div>
                )}
              </div>

              {/* Consultation Card */}
              <Card>
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-brand-600" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Clinical Examination & Diagnosis
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Date: {todayISO()}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Chief Complaint" id="consult-complaint" required>
                      <Input
                        id="consult-complaint"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="e.g. Severe headache, persistent cough"
                      />
                    </FormField>

                    <FormField label="Provisional / Clinical Diagnosis (ICD-10)" id="consult-diagnosis" required>
                      <Input
                        id="consult-diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Essential Hypertension (I10)"
                      />
                    </FormField>
                  </div>

                  <FormField label="Recorded Patient Vitals" id="consult-vitals">
                    <Input
                      id="consult-vitals"
                      value={vitals}
                      onChange={(e) => setVitals(e.target.value)}
                      placeholder="BP: 120/80 mmHg | Pulse: 72 bpm | Temp: 98.6°F | SpO2: 99%"
                    />
                  </FormField>

                  {/* Prescription Builder */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-serif font-black text-brand-700 leading-none">℞</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Medication Prescriptions (Rx)
                        </h4>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={Plus}
                        onClick={handleAddMedicine}
                      >
                        Add Medicine
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {medicines.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                        >
                          <div className="sm:col-span-4">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden">Medicine</label>
                            <input
                              type="text"
                              placeholder="Medicine Name & Strength"
                              value={med.name}
                              onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden">Dosage</label>
                            <input
                              type="text"
                              placeholder="Dosage (50mg)"
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                              className="w-full text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden">Frequency</label>
                            <select
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                              <option value="1-0-1">1-0-1 (BID)</option>
                              <option value="1-0-0">1-0-0 (Morning)</option>
                              <option value="0-0-1">0-0-1 (Night)</option>
                              <option value="1-1-1">1-1-1 (TID)</option>
                              <option value="PRN (At onset)">PRN (At onset)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden">Instructions</label>
                            <input
                              type="text"
                              placeholder="Instructions (e.g. After food)"
                              value={med.instructions}
                              onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete medicine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor's Advice */}
                  <FormField label="Doctor's Advice & Patient Instructions" id="consult-advice">
                    <textarea
                      id="consult-advice"
                      rows={2}
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Special dietary instructions, warnings, or review timeline"
                    />
                  </FormField>

                  {/* Clinical Confidential Notes */}
                  <FormField label="Physician Clinical Notes (Internal Records)" id="consult-notes">
                    <textarea
                      id="consult-notes"
                      rows={2}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Examination observations, investigation orders, or follow-up plans"
                    />
                  </FormField>
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={Users}
              title="No Patient Selected"
              description="Select a patient from the queue bar above to begin consultation."
            />
          )}
        </div>

        {/* Right Side: MANDATORY SIDE PANEL (Patient's Previous Visits & Prescriptions) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft space-y-4">
            {/* Side Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Previous Visits & Prescriptions
                </h3>
              </div>
              <Badge variant="teal">{patientHistory.length} Past Visits</Badge>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Review clinical history and previously prescribed medicines for <strong>{activePatient?.name || 'this patient'}</strong>.
            </p>

            {/* List of Previous Visits */}
            {patientHistory.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">No Past Consultations</p>
                <p className="text-slate-400">This is the patient's first recorded OPD visit.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                {patientHistory.map((visit) => {
                  const isExpanded = expandedVisitId === visit.id;

                  return (
                    <div
                      key={visit.id}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition-all"
                    >
                      {/* Visit Summary Header Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                        className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <TokenBadge token={visit.token} size="sm" />
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{visit.date}</span>
                            <span className="text-[11px] text-slate-500">{visit.doctorName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge status="Completed" size="sm" />
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {/* Expandable Visit Details & Medicines */}
                      {isExpanded && (
                        <div className="p-3.5 bg-white border-t border-slate-200 space-y-3 text-xs">
                          {/* Diagnosis */}
                          <div className="bg-brand-50/60 p-2.5 rounded-lg border border-brand-100">
                            <span className="text-[10px] uppercase font-bold text-brand-800 block">Diagnosis</span>
                            <p className="font-bold text-brand-950 mt-0.5">{visit.diagnosis}</p>
                          </div>

                          {/* Chief Complaint */}
                          {visit.chiefComplaint && (
                            <div>
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Complaint</span>
                              <p className="text-slate-700">{visit.chiefComplaint}</p>
                            </div>
                          )}

                          {/* Vitals */}
                          {visit.vitals && (
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                              <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{visit.vitals}</span>
                            </div>
                          )}

                          {/* Prescribed Medicines in that visit */}
                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                <Pill className="w-3 h-3 text-emerald-600" /> Prescribed Rx:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPastPrescription(visit)}
                                className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline"
                                title="Copy all medications into current prescription"
                              >
                                <Copy className="w-3 h-3" /> Re-prescribe
                              </button>
                            </div>

                            {visit.medicines && visit.medicines.length > 0 ? (
                              <div className="space-y-1">
                                {visit.medicines.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between font-bold text-emerald-950">
                                      <span>{m.name}</span>
                                      <span className="font-mono text-[10px] bg-emerald-100/70 px-1.5 rounded">{m.dosage}</span>
                                    </div>
                                    <div className="text-emerald-800 text-[10px] mt-0.5 flex items-center justify-between">
                                      <span>{m.frequency} • {m.duration}</span>
                                      <span className="italic">{m.instructions}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-600 text-[11px] bg-slate-50 p-2 rounded italic">
                                {visit.prescriptionText || 'No structured medicines'}
                              </p>
                            )}
                          </div>

                          {/* Advice */}
                          {visit.advice && (
                            <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                              <strong>Advice:</strong> {visit.advice}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Printable Prescription Modal */}
      {isPrintModalOpen && currentPrescriptionData && (
        <PrintablePrescription
          prescription={currentPrescriptionData}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ConsultationPage;
