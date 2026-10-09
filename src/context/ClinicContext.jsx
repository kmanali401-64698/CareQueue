import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { todayISO } from '../utils/date';

const ClinicContext = createContext();

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayNameOf(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

/**
 * Clinic data store. All data lives on the server (role-scoped there);
 * this context loads it, exposes derived helpers, and sends every mutation to the API.
 */
export function ClinicProvider({ children }) {
  const { token, logout } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pastVisits, setPastVisits] = useState([]);
  const [receipts, setReceipts] = useState([]);
  // Which session (token) the loaded data belongs to; data is "loading" until it matches the current one
  const [loadedFor, setLoadedFor] = useState(undefined);
  const isLoading = loadedFor !== token;

  /** Authenticated JSON request; throws an Error carrying the server's message on failure. */
  const api = useCallback(
    async (url, { method = 'GET', body } = {}) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      // Expired/invalid session: drop it so the router sends the user back to login
      if (token && (res.status === 401 || res.status === 403) && /token/i.test(data.error || '')) {
        logout();
      }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    },
    [token, logout]
  );

  /** (Re)load everything visible to the current user. Public visitors get the waiting-room queue only. */
  const refresh = useCallback(async () => {
    try {
      if (!token) {
        const data = await api(`/api/public/queue?date=${todayISO()}`);
        setDoctors(data.doctors);
        setAppointments(data.appointments);
        setPatients([]);
        setPastVisits([]);
        setReceipts([]);
        return;
      }


      const [d, p, a, v, r] = await Promise.all([
        api('/api/doctors'),
        api('/api/patients'),
        api('/api/appointments'),
        api('/api/visits'),
        api('/api/receipts'),
      ]);
      setDoctors(d.doctors);
      setPatients(p.patients);
      setAppointments(a.appointments);
      setPastVisits(v.visits);
      setReceipts(r.receipts);
    } catch (err) {
      console.error('Failed to load clinic data:', err);
    } finally {
      setLoadedFor(token);
    }
  }, [api, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const replaceAppointment = (updated) =>
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));

  const replaceDoctor = (updated) =>
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

  /**
   * Dynamic Slot Generation Engine.
   * `extraBookedTimes` marks slots taken by appointments the caller can't see (e.g. other patients').
   */
  const generateDoctorSlots = (doctorId, targetDateString, extraBookedTimes = []) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) {
      return { isAvailable: false, reason: 'NOT_FOUND', message: 'Doctor not found in clinic registry.', slots: [] };
    }

    if (!targetDateString) {
      return { isAvailable: false, reason: 'NO_DATE', message: 'Please select a date to generate slots.', slots: [] };
    }

    if (targetDateString < todayISO()) {
      return { isAvailable: false, reason: 'PAST_DATE', message: 'Appointments cannot be booked for past dates.', slots: [] };
    }

    if (doctor.leaves && doctor.leaves.includes(targetDateString)) {
      return {
        isAvailable: false,
        reason: 'ON_LEAVE',
        message: `${doctor.name} is on scheduled leave on ${targetDateString}. No consultation slots available.`,
        slots: [],
      };
    }

    const currentDayName = dayNameOf(targetDateString);
    if (!doctor.workingDays.includes(currentDayName)) {
      return {
        isAvailable: false,
        reason: 'OFF_DUTY',
        message: `${doctor.name} does not practice on ${currentDayName}s. Scheduled working days: ${doctor.workingDays.join(', ')}.`,
        slots: [],
      };
    }

    const [startH, startM] = doctor.startTime.split(':').map(Number);
    const [endH, endM] = doctor.endTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    const duration = doctor.slotDuration || 15;

    const bookedSlotsOnDate = appointments.filter(
      (apt) => apt.doctorId === doctorId && apt.date === targetDateString && apt.status !== 'Cancelled'
    );

    // Slots earlier than "now" are not bookable today
    const now = new Date();
    const isToday = targetDateString === todayISO();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const generatedSlots = [];
    for (let timeMinutes = startTotalMinutes; timeMinutes < endTotalMinutes; timeMinutes += duration) {
      const h24 = Math.floor(timeMinutes / 60);
      const m = timeMinutes % 60;
      const h12 = h24 % 12 || 12;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const time12 = `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
      const time24 = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const bookedRecord = bookedSlotsOnDate.find((apt) => apt.time === time12 || apt.time === time24);
      const takenElsewhere = !bookedRecord && (extraBookedTimes.includes(time12) || extraBookedTimes.includes(time24));
      const isPast = isToday && timeMinutes < nowMinutes;

      generatedSlots.push({
        time12,
        time24,
        isBooked: !!bookedRecord || takenElsewhere || isPast,
        bookedPatient: bookedRecord ? bookedRecord.patientName : null,
        bookedToken: bookedRecord ? bookedRecord.token : null,
        status: bookedRecord ? bookedRecord.status : takenElsewhere ? 'Booked' : isPast ? 'Past' : 'Available',
      });
    }

    return {
      isAvailable: true,
      reason: 'OK',
      message: `${generatedSlots.length} slots generated (${duration} min duration).`,
      slots: generatedSlots,
      workingHours: `${doctor.startTime} – ${doctor.endTime}`,
      slotDuration: duration,
    };
  };

  /** Times already booked for a doctor/date, including other patients' bookings (no personal details). */
  const fetchBookedSlots = useCallback(
    async (doctorId, date) => {
      if (!token || !doctorId || !date) return [];
      const data = await api(`/api/doctors/${doctorId}/booked-slots?date=${date}`);
      return data.times || [];
    },
    [api, token]
  );

  /** Register a new patient (staff). */
  const addPatient = async (patientData) => {
    const { patient } = await api('/api/patients', { method: 'POST', body: patientData });
    setPatients((prev) => [patient, ...prev]);
    return patient;
  };

  /** Update doctor schedule (workingDays, startTime, endTime, slotDuration). */
  const updateDoctorSchedule = async (doctorId, scheduleUpdate) => {
    const { doctor } = await api(`/api/doctors/${doctorId}/schedule`, { method: 'PATCH', body: scheduleUpdate });
    replaceDoctor(doctor);
    return doctor;
  };

  /** Change a doctor's basic consultation fee (Admin only; applies to new bookings). */
  const updateDoctorFee = async (doctorId, consultationFee) => {
    const { doctor } = await api(`/api/doctors/${doctorId}/fee`, { method: 'PATCH', body: { consultationFee } });
    replaceDoctor(doctor);
    return doctor;
  };

  /** Cancel an appointment (only allowed before check-in, i.e. status === 'Booked'). */
  const cancelAppointment = async (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found');
    if (apt.status !== 'Booked') {
      throw new Error(`Cannot cancel appointment in "${apt.status}" status. Cancellation is only permitted before check-in.`);
    }
    const { appointment } = await api(`/api/appointments/${appointmentId}/cancel`, { method: 'POST' });
    replaceAppointment(appointment);
    return true;
  };

  /** Active bookings for a doctor on a date (leave conflict detection). */
  const getDoctorBookingsOnDate = (doctorId, dateString) =>
    appointments.filter((apt) => apt.doctorId === doctorId && apt.date === dateString && apt.status !== 'Cancelled');

  /** Leave management. Returns the number of booked appointments affected by the new leave. */
  const addDoctorLeave = async (doctorId, leaveDate) => {
    const { doctor, affectedBookings } = await api(`/api/doctors/${doctorId}/leaves`, {
      method: 'POST',
      body: { date: leaveDate },
    });
    replaceDoctor(doctor);
    return affectedBookings;
  };

  const removeDoctorLeave = async (doctorId, leaveDate) => {
    const { doctor } = await api(`/api/doctors/${doctorId}/leaves/${leaveDate}`, { method: 'DELETE' });
    replaceDoctor(doctor);
  };

  /** Book an appointment in a generated slot. */
  const bookAppointment = async ({ patientId, patientName, doctorId, date, time }) => {
    const { appointment } = await api('/api/appointments', {
      method: 'POST',
      body: { patientId, patientName, doctorId, date, time },
    });
    setAppointments((prev) => [appointment, ...prev]);
    return appointment;
  };

  /** Move an appointment through the queue (CheckedIn, InConsultation, NoShow, Completed). */
  const updateAppointmentStatus = async (id, newStatus) => {
    const { appointment } = await api(`/api/appointments/${id}/status`, { method: 'PATCH', body: { status: newStatus } });
    replaceAppointment(appointment);
    return appointment;
  };

  /**
   * Record payment and receive the official receipt.
   * options: { paymentMethod, extraCharges: [{ description, amount }], discount }
   */
  const markAsPaid = async (appointmentId, { paymentMethod = 'Cash', extraCharges = [], discount = 0 } = {}) => {
    const { receipt, appointment } = await api(`/api/appointments/${appointmentId}/pay`, {
      method: 'POST',
      body: { paymentMethod, extraCharges, discount },
    });
    setReceipts((prev) => [receipt, ...prev]);
    replaceAppointment(appointment);
    return receipt;
  };

  /** Save the consultation (diagnosis, prescription) to the patient's history and discharge them. */
  const completeVisit = async (appointmentId, visitDetails) => {
    const { visit, appointment } = await api(`/api/appointments/${appointmentId}/complete`, {
      method: 'POST',
      body: visitDetails,
    });
    setPastVisits((prev) => [visit, ...prev]);
    replaceAppointment(appointment);
    return visit;
  };

  const getPatientHistory = (patientId) => pastVisits.filter((vis) => vis.patientId === patientId);

  /** Queue status helper for Waiting Room Display & Receptionist Dashboard. */
  const getDoctorQueueData = (doctorId, targetDate = todayISO()) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return null;

    const doctorApts = appointments.filter(
      (a) => a.doctorId === doctorId && a.date === targetDate && a.status !== 'Cancelled'
    );

    const nowServing = doctorApts.find((a) => a.status === 'InConsultation') || null;
    const waitingList = doctorApts.filter((a) => a.status === 'CheckedIn');
    const bookedList = doctorApts.filter((a) => a.status === 'Booked');
    const completedList = doctorApts.filter((a) => a.status === 'Completed');

    // Next 3 tokens in waiting order (CheckedIn first, then Booked)
    const nextQueue = [...waitingList, ...bookedList].slice(0, 3);

    const isOnLeave = doctor.leaves && doctor.leaves.includes(targetDate);
    const isWorkingDay = doctor.workingDays.includes(dayNameOf(targetDate));

    return {
      doctor,
      nowServing,
      nextQueue,
      waitingCount: waitingList.length,
      bookedCount: bookedList.length,
      completedCount: completedList.length,
      totalQueueCount: waitingList.length + bookedList.length + (nowServing ? 1 : 0),
      isOnLeave,
      isWorkingDay,
      statusLabel: isOnLeave ? 'On Leave' : !isWorkingDay ? 'Off Duty' : nowServing ? 'In Consultation' : 'On Duty',
    };
  };

  /** KPI stats for the Receptionist Dashboard. */
  const getTodayStats = (targetDate = todayISO()) => {
    const todayApts = appointments.filter((a) => a.date === targetDate && a.status !== 'Cancelled');
    const paidAppointments = appointments.filter((a) => a.date === targetDate && a.billingStatus === 'Paid');

    return {
      totalAppointments: todayApts.length,
      checkedIn: todayApts.filter((a) => a.status === 'CheckedIn').length,
      inConsultation: todayApts.filter((a) => a.status === 'InConsultation').length,
      completed: todayApts.filter((a) => a.status === 'Completed').length,
      noShows: todayApts.filter((a) => a.status === 'NoShow').length,
      booked: todayApts.filter((a) => a.status === 'Booked').length,
      collectedRevenue: paidAppointments.reduce((sum, a) => sum + (a.amountPaid ?? a.fee ?? 0), 0),
      paidCount: paidAppointments.length,
    };
  };

  return (
    <ClinicContext.Provider
      value={{
        doctors,
        patients,
        appointments,
        pastVisits,
        receipts,
        isLoading,
        today: todayISO(),
        refresh,
        generateDoctorSlots,
        fetchBookedSlots,
        addDoctorLeave,
        removeDoctorLeave,
        updateDoctorSchedule,
        updateDoctorFee,
        getDoctorBookingsOnDate,
        addPatient,
        cancelAppointment,
        bookAppointment,
        updateAppointmentStatus,
        markAsPaid,
        completeVisit,
        getPatientHistory,
        getDoctorQueueData,
        getTodayStats,
        setDoctors,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
