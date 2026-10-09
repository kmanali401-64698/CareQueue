import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit3
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { formatRs } from '../utils/currency';
import { todayISO } from '../utils/date';
import { 
  PageHeader, 
  Button, 
  Card, 
  CardHeader, 
  Badge, 
  TokenBadge,
  Modal, 
  FormField, 
  Input, 
  Select, 
  EmptyState 
} from '../components/ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Past leave dates are history; only show today and later
const upcomingLeaves = (doctor) => (doctor.leaves || []).filter((d) => d >= todayISO());

export function DoctorsPage() {
  const { 
    doctors, 
    generateDoctorSlots, 
    addDoctorLeave, 
    removeDoctorLeave,
    updateDoctorSchedule,
    updateDoctorFee,
    getDoctorBookingsOnDate 
  } = useClinic();
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const ownDoctorId = user?.role === 'Doctor' ? user.doctorId : null;
  // Doctors can only manage their own roster; Admin & Receptionist manage everyone
  const canManage = (doctorId) => !ownDoctorId || ownDoctorId === doctorId;
  const manageableDoctors = ownDoctorId ? doctors.filter((d) => d.id === ownDoctorId) : doctors;

  // Selected Doctor for slot simulator
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [testDate, setTestDate] = useState(todayISO()); // Today's date

  // Edit Schedule Modal State
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editForm, setEditForm] = useState({
    workingDays: [],
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 15,
    consultationFee: '',
  });

  // Mark Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveDoctorId, setLeaveDoctorId] = useState(doctors[0]?.id || '');
  const [newLeaveDate, setNewLeaveDate] = useState(todayISO());
  const [leaveError, setLeaveError] = useState('');

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const slotInspection = generateDoctorSlots(selectedDoctorId, testDate);

  // Affected patients for currently chosen doctor & date in Mark Leave modal
  const affectedBookings = leaveDoctorId && newLeaveDate 
    ? getDoctorBookingsOnDate(leaveDoctorId, newLeaveDate)
    : [];

  // Open Edit Schedule Modal
  const handleOpenEditSchedule = (doc) => {
    setEditingDoctor(doc);
    setEditForm({
      workingDays: [...doc.workingDays],
      startTime: doc.startTime,
      endTime: doc.endTime,
      slotDuration: doc.slotDuration || 15,
      consultationFee: doc.consultationFee ?? '',
    });
    setIsEditScheduleModalOpen(true);
  };

  // Toggle Day in Edit Schedule
  const handleToggleDay = (day) => {
    setEditForm((prev) => {
      const exists = prev.workingDays.includes(day);
      const updated = exists 
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updated };
    });
  };

  // Save Schedule Edits
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (editForm.workingDays.length === 0) {
      toast.error('Doctor must have at least one working day');
      return;
    }
    if (editForm.startTime >= editForm.endTime) {
      toast.error('Start time must be earlier than end time');
      return;
    }

    if (isAdmin && !(Number(editForm.consultationFee) > 0)) {
      toast.error('Consultation fee must be a positive amount');
      return;
    }

    try {
      await updateDoctorSchedule(editingDoctor.id, {
        workingDays: editForm.workingDays,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        slotDuration: Number(editForm.slotDuration),
      });
      if (isAdmin && Number(editForm.consultationFee) !== editingDoctor.consultationFee) {
        await updateDoctorFee(editingDoctor.id, Number(editForm.consultationFee));
      }
      toast.success(`Schedule updated for ${editingDoctor.name}`);
      setIsEditScheduleModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update schedule');
    }
  };

  // Open Mark Leave Modal
  const handleOpenMarkLeave = (docId) => {
    setLeaveDoctorId(docId || selectedDoctorId);
    setNewLeaveDate(todayISO());
    setLeaveError('');
    setIsLeaveModalOpen(true);
  };

  // Add Leave Handler
  const handleConfirmMarkLeave = async (e) => {
    e.preventDefault();
    if (!newLeaveDate) {
      setLeaveError('Please select a valid date for leave');
      return;
    }
    const targetDoc = doctors.find((d) => d.id === leaveDoctorId);
    if (targetDoc && targetDoc.leaves.includes(newLeaveDate)) {
      setLeaveError('Doctor is already marked on leave on this date');
      return;
    }

    let affectedCount;
    try {
      affectedCount = await addDoctorLeave(leaveDoctorId, newLeaveDate);
    } catch (err) {
      setLeaveError(err.message || 'Failed to mark leave');
      return;
    }

    if (affectedCount > 0) {
      toast.success(
        `Leave marked for ${targetDoc?.name} on ${newLeaveDate}. Note: ${affectedCount} patient booking(s) affected!`,
        { duration: 5000, icon: '⚠️' }
      );
    } else {
      toast.success(`Leave scheduled for ${targetDoc?.name} on ${newLeaveDate}`);
    }

    setLeaveError('');
    setIsLeaveModalOpen(false);
  };

  const handleRemoveLeave = async (docId, date) => {
    try {
      await removeDoctorLeave(docId, date);
      toast.success(`Leave removed for ${date}`);
    } catch (err) {
      toast.error(err.message || 'Failed to remove leave');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <PageHeader
        title="Doctor Schedules & Roster Management"
        subtitle="Manage working days, daily consultation hours, 15-minute slot generator rules, and scheduled leaves with conflict warnings."
        breadcrumbs={['CareQueue', 'Medical Staff', 'Doctor Schedules']}
        badge={<Badge variant="teal">{doctors.length} Active Doctor Rosters</Badge>}
        actions={
          <Button
            variant="primary"
            icon={UserX}
            onClick={() => handleOpenMarkLeave(ownDoctorId || selectedDoctorId)}
          >
            Mark Doctor Leave
          </Button>
        }
      />

      {/* Information Banner on Dynamic Slot Rule */}
      <div className="bg-brand-50/70 border border-brand-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-soft">
        <div className="p-2 bg-brand-600 text-white rounded-xl shrink-0 mt-0.5 shadow-soft-xs">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-brand-950 space-y-1">
          <p className="font-bold text-brand-900">
            Dynamic Slot Computation Engine Active
          </p>
          <p className="text-brand-800/90 leading-relaxed">
            Consultation slots are <strong>never stored as a static database list</strong>. They are calculated dynamically on demand using each doctor's <code className="font-mono bg-brand-100 text-brand-900 px-1 py-0.5 rounded">workingDays</code> (e.g. Mon–Sat), <code className="font-mono bg-brand-100 text-brand-900 px-1 py-0.5 rounded">startTime</code>, <code className="font-mono bg-brand-100 text-brand-900 px-1 py-0.5 rounded">endTime</code>, and <code className="font-mono bg-brand-100 text-brand-900 px-1 py-0.5 rounded">slotDuration (15 min)</code>. A doctor marked on leave generates <strong>zero slots</strong> on that date.
          </p>
        </div>
      </div>

      {/* 3 Seeded Doctors Overview Grid with Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {doctors.map((doctor) => {
          const isSelected = doctor.id === selectedDoctorId;
          const workingDaysText = doctor.workingDays.length === 6 && !doctor.workingDays.includes('Sun')
            ? 'Mon–Sat'
            : doctor.workingDays.length === 5 && !doctor.workingDays.includes('Sat') && !doctor.workingDays.includes('Sun')
            ? 'Mon–Fri'
            : doctor.workingDays.join(', ');

          return (
            <Card
              key={doctor.id}
              className={`relative transition-all flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-brand-500 shadow-soft-md border-brand-300'
                  : 'hover:border-slate-300'
              }`}
            >
              <div>
                {/* Doctor Card Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-soft-xs">
                      {doctor.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{doctor.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{doctor.specialty}</p>
                    </div>
                  </div>
                  <Badge variant="teal">{doctor.room}</Badge>
                </div>

                {/* Schedule Details */}
                <div className="py-3.5 space-y-3 text-xs text-slate-600">
                  {/* Working Days */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      Working Days:
                    </span>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {workingDaysText}
                    </span>
                  </div>

                  {/* Hours & Duration */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      Hours & Duration:
                    </span>
                    <span className="font-mono text-slate-900 font-semibold bg-brand-50 text-brand-900 px-2 py-0.5 rounded-md border border-brand-100">
                      {doctor.startTime} – {doctor.endTime} ({doctor.slotDuration || 15}m)
                    </span>
                  </div>

                  {/* Basic Consultation Fee */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Basic Consultation Fee:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatRs(doctor.consultationFee)}</span>
                  </div>

                  {/* Upcoming Leave List */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-slate-500 flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-rose-500" />
                        Upcoming Leaves:
                      </span>
                      {canManage(doctor.id) && (
                        <button
                          type="button"
                          onClick={() => handleOpenMarkLeave(doctor.id)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          + Mark Leave
                        </button>
                      )}
                    </div>

                    {upcomingLeaves(doctor).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No leaves scheduled</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {upcomingLeaves(doctor).map((leaveDate) => (
                          <span
                            key={leaveDate}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md"
                          >
                            {leaveDate}
                            {canManage(doctor.id) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLeave(doctor.id, leaveDate)}
                                className="text-rose-400 hover:text-rose-700 ml-0.5 font-bold"
                                title="Remove leave"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {canManage(doctor.id) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit3}
                    onClick={() => handleOpenEditSchedule(doctor)}
                  >
                    {isAdmin ? 'Edit Schedule & Fee' : 'Edit Schedule'}
                  </Button>
                ) : (
                  <span />
                )}

                <Button
                  size="sm"
                  variant={isSelected ? 'primary' : 'ghost'}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                >
                  {isSelected ? 'Inspecting Slots' : 'Simulate Slots'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dynamic Slot Inspector / Simulator */}
      <Card>
        <CardHeader
          title={`Dynamic Slot Generator Simulator: ${selectedDoctor?.name}`}
          subtitle={`Inspect slots dynamically computed for ${testDate} (${selectedDoctor?.startTime} – ${selectedDoctor?.endTime}, ${selectedDoctor?.slotDuration || 15} min increments)`}
          action={
            <div className="flex items-center gap-2">
              <label htmlFor="slot-date-picker" className="text-xs font-semibold text-slate-500 uppercase">
                Test Date:
              </label>
              <input
                id="slot-date-picker"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 shadow-soft-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          }
        />

        {/* Dynamic Generation Status Message */}
        <div className="mb-5">
          {slotInspection.isAvailable ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Doctor On Duty:</strong> {slotInspection.slots.length} consultation slots dynamically generated for <strong>{testDate}</strong>.
                </span>
              </div>
              <Badge variant="green">{selectedDoctor?.slotDuration || 15} min intervals</Badge>
            </div>
          ) : slotInspection.reason === 'ON_LEAVE' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs sm:text-sm text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>ON SCHEDULED LEAVE:</strong> {selectedDoctor?.name} is on leave on {testDate}. <strong>Zero slots are generated.</strong>
                </span>
              </div>
              <Badge status="NoShow">0 Slots Generated</Badge>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>OFF DUTY / NON-WORKING DAY:</strong> {slotInspection.message}
                </span>
              </div>
              <Badge status="CheckedIn">Non-working Day</Badge>
            </div>
          )}
        </div>

        {/* Generated Slots Grid */}
        {slotInspection.isAvailable ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Dynamic consultation slots for {testDate}:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Booked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {slotInspection.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    slot.isBooked
                      ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-brand-500 hover:shadow-soft-xs text-slate-800'
                  }`}
                >
                  <p className="font-mono text-xs font-bold">{slot.time12}</p>
                  <div className="mt-1">
                    {slot.isBooked ? (
                      <span className="text-[10px] font-semibold text-slate-600 block truncate" title={`Booked: ${slot.bookedPatient}`}>
                        {slot.bookedToken || 'Booked'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={UserX}
            title={slotInspection.reason === 'ON_LEAVE' ? `${selectedDoctor?.name} is on Leave` : 'Doctor Not Practicing on this Day'}
            description={slotInspection.message}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestDate(todayISO())}
              >
                Reset to Today ({todayISO()})
              </Button>
            }
          />
        )}
      </Card>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={isEditScheduleModalOpen}
        onClose={() => setIsEditScheduleModalOpen(false)}
        title={`Edit Schedule: ${editingDoctor?.name}`}
        description="Update practicing days, working hours, and consultation slot duration."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSchedule}>
              Save Schedule Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSchedule} className="space-y-5">
          {/* Working Days Checkbox Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Practicing Working Days <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => {
                const isChecked = editForm.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border ${
                      isChecked
                        ? 'bg-brand-600 border-brand-700 text-white shadow-soft-xs ring-2 ring-brand-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Selected: {editForm.workingDays.length ? editForm.workingDays.join(', ') : 'None'}
            </p>
          </div>

          {/* Time & Slot Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Start Time" id="edit-start" required>
              <Input
                id="edit-start"
                type="time"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
              />
            </FormField>

            <FormField label="End Time" id="edit-end" required>
              <Input
                id="edit-end"
                type="time"
                value={editForm.endTime}
                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
              />
            </FormField>

            <FormField label="Slot Duration" id="edit-duration" required>
              <Select
                id="edit-duration"
                value={editForm.slotDuration}
                onChange={(e) => setEditForm({ ...editForm, slotDuration: Number(e.target.value) })}
              >
                <option value={10}>10 min</option>
                <option value={15}>15 min (Standard)</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
              </Select>
            </FormField>
          </div>

          {isAdmin && (
            <FormField
              label="Basic Consultation Fee (Rs.)"
              id="edit-fee"
              required
              helperText="Applies to new bookings. Extra charges and discounts are added at payment time."
            >
              <Input
                id="edit-fee"
                type="number"
                min="1"
                value={editForm.consultationFee}
                onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
              />
            </FormField>
          )}
        </form>
      </Modal>

      {/* "Mark Leave" Modal with Real-time Booking Conflict Warning */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Mark Doctor Leave & Verify Bookings"
        description="Select doctor and leave date. System automatically checks for existing patient bookings."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={affectedBookings.length > 0 ? 'danger' : 'primary'}
              onClick={handleConfirmMarkLeave}
            >
              {affectedBookings.length > 0 ? 'Mark Leave Anyway' : 'Confirm Leave Date'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmMarkLeave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Doctor" id="leave-doctor" required>
              <Select
                id="leave-doctor"
                value={leaveDoctorId}
                onChange={(e) => {
                  setLeaveDoctorId(e.target.value);
                  setLeaveError('');
                }}
              >
                {manageableDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Leave Date"
              id="leave-date"
              required
              error={leaveError}
              helperText="Dynamic slots will be suppressed for this date"
            >
              <Input
                id="leave-date"
                type="date"
                value={newLeaveDate}
                onChange={(e) => {
                  setNewLeaveDate(e.target.value);
                  setLeaveError('');
                }}
                error={leaveError}
              />
            </FormField>
          </div>

          {/* REAL-TIME CONFLICT WARNING: If doctor already has bookings on that date */}
          {affectedBookings.length > 0 ? (
            <div className="p-4 bg-rose-50 border border-rose-300/90 rounded-2xl space-y-3 shadow-soft">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">
                    Warning: Doctor has {affectedBookings.length} active patient {affectedBookings.length === 1 ? 'booking' : 'bookings'} on this date!
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    The following patient appointments are scheduled for {newLeaveDate}. If you proceed to mark this date as leave, dynamic slots will be suppressed and these patients will need to be notified or rescheduled:
                  </p>
                </div>
              </div>

              {/* List of Affected Patients */}
              <div className="bg-white/90 border border-rose-200 rounded-xl divide-y divide-rose-100 overflow-hidden">
                {affectedBookings.map((apt) => (
                  <div key={apt.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <TokenBadge token={apt.token} size="sm" />
                      <div>
                        <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">Time Slot: {apt.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge status={apt.status} size="sm" />
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                        Needs Reschedule
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : newLeaveDate ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>No Conflicts:</strong> No existing patient bookings scheduled for {newLeaveDate}. Safe to mark as leave.
              </span>
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}

export default DoctorsPage;
