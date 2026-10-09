import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  Clock,
  Stethoscope,
  AlertTriangle,
  UserX,
  XCircle,
  Filter
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { todayISO } from '../utils/date';
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

export function AppointmentsPage() {
  const { 
    doctors, 
    patients, 
    appointments, 
    generateDoctorSlots, 
    bookAppointment, 
    updateAppointmentStatus,
    cancelAppointment 
  } = useClinic();

  // Persist a queue status change and report the outcome
  const changeStatus = async (id, status, successMessage) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotError, setSlotError] = useState('');

  // Cancel Confirmation Modal State
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Dynamically generate slots for currently chosen doctor & date
  const slotData = generateDoctorSlots(selectedDoctorId, selectedDate);

  const handleOpenBooking = () => {
    setSelectedPatientId(patients[0]?.id || '');
    setSelectedDoctorId(doctors[0]?.id || '');
    setSelectedDate(todayISO());
    setSelectedSlotTime('');
    setSlotError('');
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!slotData.isAvailable) {
      setSlotError('Cannot book an appointment when doctor is unavailable or on leave');
      toast.error('Doctor is not available on selected date');
      return;
    }

    if (!selectedSlotTime) {
      setSlotError('Please select an available consultation slot');
      toast.error('Please choose a time slot');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) {
      setSlotError('Please select a registered patient');
      return;
    }

    setIsSubmitting(true);
    try {
      const newApt = await bookAppointment({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedSlotTime,
      });

      toast.success(`Slot booked! Token ${newApt.token} assigned to ${patient.name}`);
      setIsModalOpen(false);
      setSelectedSlotTime('');
    } catch (err) {
      toast.error(err.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteCancellation = async () => {
    if (!appointmentToCancel) return;
    try {
      await cancelAppointment(appointmentToCancel.id);
      toast.success(`Appointment ${appointmentToCancel.token} for ${appointmentToCancel.patientName} cancelled.`);
      setAppointmentToCancel(null);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.status === statusFilter;
  });

  const columns = [
    {
      header: 'Queue Token',
      accessor: 'token',
      primaryMobile: true,
      render: (t) => <TokenBadge token={t} size="sm" />,
    },
    {
      header: 'Patient Name',
      accessor: 'patientName',
      render: (name) => <span className="font-semibold text-slate-900">{name}</span>,
    },
    {
      header: 'Assigned Doctor',
      accessor: 'doctorName',
      render: (doc, row) => (
        <div>
          <span className="font-medium text-slate-800">{doc}</span>
          <span className="block text-xs text-slate-400">{row.room}</span>
        </div>
      ),
    },
    {
      header: 'Date & Time Slot',
      accessor: 'time',
      render: (time, row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-800">{time}</span>
          <span className="block text-[11px] text-slate-400">{row.date}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (s) => <Badge status={s} />,
    },
    {
      header: 'Billing',
      accessor: 'billingStatus',
      render: (b) => <Badge status={b} size="sm" withDot={false} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (id, row) => {
        const canCancel = row.status === 'Booked';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {row.status === 'Booked' && row.date === todayISO() && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus(id, 'CheckedIn', `${row.patientName} checked in with Token ${row.token}`)}
              >
                Check In
              </Button>
            )}

            {row.status === 'Booked' && row.date <= todayISO() && (
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => changeStatus(id, 'NoShow', `${row.token} marked as no-show`)}
              >
                No Show
              </Button>
            )}

            {row.status === 'CheckedIn' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => changeStatus(id, 'InConsultation', `Consultation started for ${row.patientName}`)}
              >
                Consult
              </Button>
            )}

            {row.status === 'InConsultation' && (
              <Link to={`/consultation?appointment=${id}`}>
                <Button size="sm" variant="primary">
                  Diagnosis & Prescription
                </Button>
              </Link>
            )}

            {/* Cancel Appointment Button: Only allowed before check-in (Booked status) */}
            {canCancel ? (
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
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Appointments & Dynamic Slot Booking"
        subtitle="Schedule patient visits into dynamically computed 15-minute doctor consultation slots."
        breadcrumbs={['CareQueue', 'Front Desk', 'Appointments']}
        badge={<Badge variant="blue">Dynamic Slots Active</Badge>}
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenBooking}>
            Book New Appointment
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Scheduled Appointments"
          value={appointments.filter((a) => a.status === 'Booked').length.toString()}
          icon={Calendar}
          iconColor="blue"
          badgeText="Active"
        />
        <StatCard
          title="Total Booked Slots"
          value={appointments.length.toString()}
          icon={Clock}
          iconColor="teal"
          trend={{ value: '15 min duration', isPositive: true }}
        />
        <StatCard
          title="Active Doctors"
          value={doctors.length.toString()}
          icon={Stethoscope}
          iconColor="emerald"
          subtitle="Mon–Sat, Mon–Fri, Tue–Sat schedules"
        />
      </div>

      {/* Appointments List Card */}
      <Card padding="none">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold uppercase tracking-wider">Filter by Status:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'Booked', 'CheckedIn', 'InConsultation', 'Completed', 'Cancelled'].map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === key
                    ? 'bg-brand-600 text-white shadow-soft-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {key === 'ALL' ? 'All Bookings' : key}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveTable
          columns={columns}
          data={filteredAppointments}
          emptyState={
            <div className="p-8">
              <EmptyState
                icon={Calendar}
                title="No Appointments Found"
                description={
                  statusFilter === 'ALL'
                    ? "Click 'Book New Appointment' to generate slots and schedule a patient visit."
                    : `No appointments currently in "${statusFilter}" status.`
                }
                action={
                  statusFilter !== 'ALL' ? (
                    <Button variant="outline" size="sm" onClick={() => setStatusFilter('ALL')}>
                      Reset Filter
                    </Button>
                  ) : null
                }
              />
            </div>
          }
        />
      </Card>

      {/* Dynamic Slot Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Book Appointment via Dynamic Slots"
        description="Select doctor and date. Consultation slots are generated on-demand (15 min increments)."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || !slotData.isAvailable || !selectedSlotTime}
              onClick={handleConfirmBooking}
            >
              Confirm Appointment
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Select Patient" id="booking-patient" required>
              <Select
                id="booking-patient"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={isSubmitting}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender}, {p.age}y)
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Consulting Doctor" id="booking-doctor" required>
              <Select
                id="booking-doctor"
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setSelectedSlotTime('');
                  setSlotError('');
                }}
                disabled={isSubmitting}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField
            label="Appointment Date"
            id="booking-date"
            required
            helperText="Slots are generated dynamically for this date"
          >
            <Input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlotTime('');
                setSlotError('');
              }}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Dynamic Slots Generator View */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Available 15-Min Consultation Slots:
            </label>

            {!slotData.isAvailable ? (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                slotData.reason === 'ON_LEAVE'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {slotData.reason === 'ON_LEAVE' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <UserX className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {slotData.reason === 'ON_LEAVE' ? 'Doctor On Scheduled Leave' : 'Doctor Not Available'}
                  </h4>
                  <p className="text-xs mt-0.5">{slotData.message}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Generated from {slotData.workingHours} ({slotData.slotDuration} min duration)
                  </span>
                  {selectedSlotTime && (
                    <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      Selected: {selectedSlotTime}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {slotData.slots.map((slot, idx) => {
                    const isSelected = selectedSlotTime === slot.time12;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={slot.isBooked || isSubmitting}
                        onClick={() => {
                          setSelectedSlotTime(slot.time12);
                          setSlotError('');
                        }}
                        className={`p-2 rounded-lg text-xs font-mono font-medium transition-all text-center border ${
                          slot.isBooked
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-brand-600 border-brand-700 text-white shadow-soft-xs ring-2 ring-brand-500/30'
                            : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-slate-800'
                        }`}
                      >
                        {slot.time12}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {slotError && (
              <p className="text-xs text-rose-600 font-medium mt-2">{slotError}</p>
            )}
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment Confirmation Modal */}
      <Modal
        isOpen={!!appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        title="Cancel Patient Appointment"
        description="Are you sure you want to cancel this scheduled appointment? Cancellation is only permitted before patient check-in."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAppointmentToCancel(null)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              onClick={handleExecuteCancellation}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        {appointmentToCancel && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{appointmentToCancel.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-semibold text-slate-800">{appointmentToCancel.doctorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Scheduled Time:</span>
              <span className="font-mono text-slate-800">{appointmentToCancel.date} at {appointmentToCancel.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Queue Token:</span>
              <TokenBadge token={appointmentToCancel.token} size="sm" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AppointmentsPage;
