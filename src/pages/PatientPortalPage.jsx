import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  FileText,
  Receipt,
  Printer,
  XCircle,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { todayISO } from '../utils/date';
import { 
  PageHeader, 
  Button, 
  Card, 
  Badge, 
  TokenBadge, 
  ResponsiveTable, 
  Modal, 
  FormField, 
  Input, 
  Select, 
  EmptyState 
} from '../components/ui';
import { PrintablePrescription } from '../components/clinical/PrintablePrescription';
import { PrintableReceipt } from '../components/clinical/PrintableReceipt';
import { formatRs } from '../utils/currency';

export function PatientPortalPage() {
  const { user } = useAuth();
  const { 
    patients, 
    doctors, 
    appointments, 
    pastVisits, 
    receipts, 
    bookAppointment, 
    cancelAppointment,
    generateDoctorSlots,
    fetchBookedSlots
  } = useClinic();

  // Fallback while the profile loads (or for an Admin previewing the portal) — never show another patient's data
  const currentPatient = patients.find((p) => p.id === user?.patientId) || {
    id: user?.patientId || null,
    name: user?.name || 'Patient',
    bloodGroup: '—',
    allergies: 'Not recorded',
    phone: '—',
    email: user?.email || '—',
    gender: '—',
    age: '—',
  };

  // Scoped Data: Patient only sees their own appointments, past visits, and receipts!
  const myAppointments = appointments.filter((a) => a.patientId === currentPatient.id);
  const myPastVisits = pastVisits.filter((v) => v.patientId === currentPatient.id);
  const myReceipts = receipts.filter((r) => r.patientId === currentPatient.id);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Cancellation modal
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Printable modals
  const [activePrescription, setActivePrescription] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Slots taken by other patients aren't in this patient's data, so ask the server which times are booked
  const [takenTimes, setTakenTimes] = useState([]);
  useEffect(() => {
    if (!isBookModalOpen) return;
    let cancelled = false;
    fetchBookedSlots(selectedDoctorId, selectedDate)
      .then((times) => !cancelled && setTakenTimes(times))
      .catch(() => !cancelled && setTakenTimes([]));
    return () => {
      cancelled = true;
    };
  }, [isBookModalOpen, selectedDoctorId, selectedDate, fetchBookedSlots]);

  const slotData = generateDoctorSlots(selectedDoctorId, selectedDate, takenTimes);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlotTime) {
      toast.error('Please select an available consultation slot');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const newApt = await bookAppointment({
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedSlotTime,
      });

      toast.success(`Appointment confirmed! Token ${newApt.token} assigned.`);
      setIsBookModalOpen(false);
      setSelectedSlotTime('');
    } catch (err) {
      toast.error(err.message || 'Booking failed');
      // Someone may have just taken the slot: refresh availability
      fetchBookedSlots(selectedDoctorId, selectedDate).then(setTakenTimes).catch(() => {});
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      await cancelAppointment(appointmentToCancel.id);
      toast.success(`Appointment ${appointmentToCancel.token} cancelled.`);
      setAppointmentToCancel(null);
    } catch (err) {
      toast.error(err.message || 'Cannot cancel appointment');
    }
  };

  // Columns for My Appointments
  const appointmentColumns = [
    {
      header: 'Queue Ticket',
      accessor: 'token',
      primaryMobile: true,
      render: (t) => <TokenBadge token={t} size="sm" />,
    },
    {
      header: 'Consulting Physician',
      accessor: 'doctorName',
      render: (doc, row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{doc}</span>
          <span className="text-[11px] text-slate-400">{row.room}</span>
        </div>
      ),
    },
    {
      header: 'Scheduled Date & Time',
      accessor: 'time',
      render: (time, row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{time}</span>
          <span className="text-[11px] text-slate-400">{row.date}</span>
        </div>
      ),
    },
    {
      header: 'Visit Status',
      accessor: 'status',
      render: (s) => <Badge status={s} />,
    },
    {
      header: 'Billing',
      accessor: 'billingStatus',
      render: (b) => <Badge status={b} size="sm" withDot={false} />,
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'right',
      render: (id, row) => {
        const canCancel = row.status === 'Booked';

        return canCancel ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            icon={XCircle}
            onClick={() => setAppointmentToCancel(row)}
          >
            Cancel
          </Button>
        ) : row.status === 'Cancelled' ? (
          <span className="text-xs text-slate-400 italic">Cancelled</span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Locked ({row.status})</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Personal Patient Health Portal"
        subtitle="Manage your personal doctor appointments, electronic prescriptions, and official medical receipts."
        breadcrumbs={['CareQueue', 'Patient Portal']}
        badge={<Badge variant="teal">Verified Patient Account</Badge>}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsBookModalOpen(true)}
          >
            Book New Consultation
          </Button>
        }
      />

      {/* Patient Demographic Card */}
      <div className="bg-gradient-to-r from-teal-50/80 via-white to-slate-50 border border-teal-200/90 rounded-2xl p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-teal-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shadow-soft">
              {currentPatient.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentPatient.name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {currentPatient.bloodGroup}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient ID: <code className="font-mono text-slate-700">{currentPatient.id}</code> • {currentPatient.gender}, {currentPatient.age} yrs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Phone: {currentPatient.phone}</span>
          </div>
        </div>

        {/* Allergy Warning */}
        {currentPatient.allergies && currentPatient.allergies !== 'None known' && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Recorded Allergies: {currentPatient.allergies}</span>
          </div>
        )}
      </div>

      {/* Section 1: My Appointments */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              My Scheduled Appointments
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active consultations and dynamic slot bookings. Cancel is permitted before check-in.
            </p>
          </div>

          <Badge variant="teal">{myAppointments.length} Total Bookings</Badge>
        </div>

        <ResponsiveTable
          columns={appointmentColumns}
          data={myAppointments}
          emptyState={
            <div className="p-8">
              <EmptyState
                icon={Calendar}
                title="No Scheduled Appointments"
                description="You currently have no active or booked consultations."
                action={
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsBookModalOpen(true)}>
                    Book Appointment
                  </Button>
                }
              />
            </div>
          }
        />
      </Card>

      {/* Section 2: Medical Visits & Printable Prescriptions */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              My Clinical Consultations & Prescriptions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed consultations with physician diagnoses, vitals, and printable Rx prescriptions.
            </p>
          </div>

          <Badge status="Completed">{myPastVisits.length} Completed</Badge>
        </div>

        {myPastVisits.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title="No Past Medical Records"
              description="Historical clinical records and prescriptions will appear here after consultations."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myPastVisits.map((visit) => (
              <div key={visit.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <TokenBadge token={visit.token} size="sm" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{visit.date}</span>
                      <span className="text-xs text-slate-400 font-mono ml-2">{visit.time}</span>
                    </div>
                    <Badge status="Completed" size="sm" />
                  </div>

                  <p className="text-xs text-slate-700">
                    Attending Physician: <strong>{visit.doctorName}</strong> ({visit.doctorSpecialty}, {visit.room})
                  </p>

                  <div className="text-xs bg-brand-50/70 p-2.5 rounded-lg border border-brand-100 text-brand-950 font-medium">
                    Diagnosis: <strong>{visit.diagnosis}</strong>
                  </div>

                  {visit.medicines && visit.medicines.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Prescribed: {visit.medicines.map(m => m.name).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Printer}
                    onClick={() => setActivePrescription(visit)}
                  >
                    Print Prescription
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section 3: Billing & Printable Receipts */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-600" />
              My Billing Statements & Tax Receipts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official medical receipts with clinic tax invoice header for insurance claims.
            </p>
          </div>

          <Badge variant="teal">{myReceipts.length} Official Invoices</Badge>
        </div>

        {myReceipts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No Billing Statements"
              description="Paid receipts and tax invoices will be archived here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myReceipts.map((rcp) => (
              <div key={rcp.receiptNumber} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-mono font-bold text-brand-800 text-xs block">{rcp.receiptNumber}</span>
                  <span className="text-xs font-semibold text-slate-900">{rcp.date} • {rcp.time}</span>
                  <span className="text-xs text-slate-500 block">Service: {rcp.items?.[0]?.description || 'OPD Consultation'}</span>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-base block">{formatRs(rcp.total, 2)}</span>
                    <Badge status="Paid" size="sm" />
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={Printer}
                    onClick={() => setActiveReceipt(rcp)}
                  >
                    Print Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => !isSubmittingBooking && setIsBookModalOpen(false)}
        title="Schedule Doctor Consultation"
        description="Select doctor and appointment date. Real-time 15-minute consultation slots will be generated."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmittingBooking}
              disabled={isSubmittingBooking || !slotData.isAvailable || !selectedSlotTime}
              onClick={handleConfirmBooking}
            >
              Confirm Appointment
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <FormField label="Consulting Doctor" id="book-doc" required>
            <Select
              id="book-doc"
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setSelectedSlotTime('');
              }}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty} • {formatRs(d.consultationFee)})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Appointment Date" id="book-date" required>
            <Input
              id="book-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlotTime('');
              }}
            />
          </FormField>

          {/* Generated Slots */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Available 15-Min Slots:
            </label>

            {!slotData.isAvailable ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {slotData.message}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                {slotData.slots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={s.isBooked}
                    onClick={() => setSelectedSlotTime(s.time12)}
                    className={`p-2 rounded-lg text-xs font-mono font-medium border text-center transition-all ${
                      s.isBooked
                        ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                        : selectedSlotTime === s.time12
                        ? 'bg-brand-600 border-brand-700 text-white shadow-soft'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-brand-500'
                    }`}
                  >
                    {s.time12}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        title="Cancel Patient Appointment"
        description="Are you sure you want to cancel your scheduled appointment?"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAppointmentToCancel(null)}>
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        {appointmentToCancel && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-bold text-slate-900">{appointmentToCancel.doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Slot:</span>
              <span className="font-mono text-slate-800">{appointmentToCancel.date} at {appointmentToCancel.time}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Prescription Modal */}
      {activePrescription && (
        <PrintablePrescription
          prescription={{
            ...activePrescription,
            patientName: currentPatient.name,
            patientAge: currentPatient.age,
            patientGender: currentPatient.gender,
            patientPhone: currentPatient.phone,
            allergies: currentPatient.allergies,
          }}
          onClose={() => setActivePrescription(null)}
        />
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <PrintableReceipt
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}

export default PatientPortalPage;
