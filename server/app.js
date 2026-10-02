import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './data/store.js';
import { authenticateToken, requireRoles, JWT_SECRET } from './middleware/auth.js';
import { todayISO } from './utils/date.js';

export const app = express();

app.use(cors());
app.use(express.json());

const STAFF = ['Admin', 'Receptionist', 'Doctor'];
const FRONT_DESK = ['Admin', 'Receptionist'];

// Allowed manual status transitions (completion with clinical notes goes through /complete)
const STATUS_TRANSITIONS = {
  Booked: ['CheckedIn', 'NoShow'],
  CheckedIn: ['InConsultation', 'NoShow', 'Booked'],
  InConsultation: ['Completed', 'CheckedIn'],
};

/** Doctors may only act on their own roster; Admin & Receptionist on any. */
function canActForDoctor(user, doctorId) {
  if (FRONT_DESK.includes(user.role)) return true;
  return user.role === 'Doctor' && user.doctorId === doctorId;
}

/** Next queue token for a doctor on a given date, e.g. D1-03 (unique per doctor per day). */
function nextQueueToken(doctor, date) {
  const prefix = `${doctor.tokenPrefix}-`;
  const maxUsed = db
    .getAppointments()
    .filter((a) => a.doctorId === doctor.id && a.date === date && a.token?.startsWith(prefix))
    .reduce((max, a) => Math.max(max, parseInt(a.token.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(maxUsed + 1).padStart(2, '0')}`;
}

/** Next sequential receipt number, e.g. RCP-2026-1046. */
function nextReceiptNumber() {
  const year = new Date().getFullYear();
  const maxUsed = db
    .getReceipts()
    .reduce((max, r) => Math.max(max, parseInt(String(r.receiptNumber).split('-').pop(), 10) || 0), 1000);
  return `RCP-${year}-${maxUsed + 1}`;
}

function currentTime12h() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** Mask a patient name for public screens: "Emma Watson" -> "Emma W." */
function maskName(name = '') {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

// Helper to sign JWT tokens
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      doctorId: user.doctorId || null,
      patientId: user.patientId || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helpers for date and time slot validation
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const is12Hour = /am|pm/i.test(str);
  if (is12Hour) {
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } else {
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/auth/signup
 * Patient only; creates the Patient record and User together
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      age, 
      gender, 
      bloodGroup, 
      allergies, 
      emergencyContact 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    // 1. Create Patient demographic record
    const patientId = `pat-${Date.now()}`;
    const newPatient = {
      id: patientId,
      name: name.trim(),
      age: Number(age) || null,
      gender: gender || 'Not specified',
      phone: phone || '',
      email: cleanEmail,
      bloodGroup: bloodGroup || 'Unknown',
      allergies: allergies || 'None known',
      emergencyContact: emergencyContact || 'Not specified',
      createdAt: todayISO(),
    };
    db.addPatient(newPatient);

    // 2. Hash password and create User record (Patient role only)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr-pat-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'Patient', // Strict: public signup is Patient only
      doctorId: null,
      patientId: patientId,
      createdAt: todayISO(),
    };
    db.addUser(newUser);

    // 3. Generate JWT
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Patient registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        patientId: newUser.patientId,
      },
      patient: newPatient,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Returns a JWT token upon successful authentication
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
        patientId: user.patientId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Protected: returns currently authenticated user profile
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.getUsers().find((u) => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
      patientId: user.patientId,
    },
  });
});

// ==========================================
// 2. ADMIN STAFF MANAGEMENT (Protected)
// ==========================================

/**
 * POST /api/admin/users
 * Admin only: Create Doctor and Receptionist staff accounts.
 * Staff cannot sign up publicly.
 */
app.post('/api/admin/users', authenticateToken, requireRoles('Admin'), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      specialty, 
      room, 
      workingDays, 
      startTime, 
      endTime, 
      slotDuration, 
      consultationFee 
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['Doctor', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid staff role specified. Must be Doctor, Receptionist, or Admin' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    let doctorId = null;
    let newDoctor = null;

    // If role is Doctor, create a linked doctor roster entity
    if (role === 'Doctor') {
      const docCount = db.getDoctors().length + 1;
      doctorId = `doc-${Date.now()}`;
      newDoctor = {
        id: doctorId,
        name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
        specialty: specialty || 'General Medicine & Family Practice',
        room: room || `OPD 10${docCount}`,
        tokenPrefix: `D${docCount}`,
        avatar: name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        consultationFee: Number(consultationFee) || 600,
        workingDays: workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: startTime || '09:00',
        endTime: endTime || '13:00',
        slotDuration: Number(slotDuration) || 15,
        leaves: [],
      };
      db.addDoctor(newDoctor);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr-${role.toLowerCase().slice(0, 3)}-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      doctorId,
      patientId: null,
      createdAt: todayISO(),
    };
    db.addUser(newUser);

    return res.status(201).json({
      message: `${role} account created successfully by Administrator`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        doctorId: newUser.doctorId,
      },
      doctor: newDoctor,
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Failed to create staff account' });
  }
});

/**
 * GET /api/admin/users
 * Admin only: List all staff accounts
 */
app.get('/api/admin/users', authenticateToken, requireRoles('Admin'), (req, res) => {
  const staff = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    doctorId: u.doctorId,
    patientId: u.patientId,
    createdAt: u.createdAt,
  }));
  return res.json({ staff });
});

// ==========================================
// 3. APPOINTMENTS (Role-Scoped Access)
// ==========================================

/**
 * GET /api/appointments
 * Scoped data:
 *  - Doctor only sees their own queue and consultations
 *  - Patient only sees their own appointments
 *  - Admin & Receptionist see all clinic appointments
 */
app.get('/api/appointments', authenticateToken, (req, res) => {
  const { role, doctorId, patientId } = req.user;
  const allApts = db.getAppointments();

  if (role === 'Doctor') {
    const doctorApts = allApts.filter((a) => a.doctorId === doctorId);
    return res.json({ appointments: doctorApts });
  }

  if (role === 'Patient') {
    const patientApts = allApts.filter((a) => a.patientId === patientId);
    return res.json({ appointments: patientApts });
  }

  // Admin or Receptionist sees all
  return res.json({ appointments: allApts });
});

/**
 * POST /api/appointments
 * Create a new appointment
 */
app.post('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { doctorId, date, time, patientId, patientName } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'Doctor, date, and time are required' });
    }

    const doctor = db.getDoctors().find((d) => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    if (doctor.leaves && doctor.leaves.includes(date)) {
      return res.status(409).json({ error: `${doctor.name} is on leave on ${date}` });
    }

    const slotTaken = db
      .getAppointments()
      .some((a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'Cancelled');
    if (slotTaken) {
      return res.status(409).json({ error: 'This slot has already been booked. Please choose another time.' });
    }

    // If Patient is booking, enforce their own patientId
    const resolvedPatientId = req.user.role === 'Patient' ? req.user.patientId : patientId;
    if (!resolvedPatientId) {
      return res.status(400).json({ error: 'A registered patient is required to book an appointment' });
    }
    const patientRecord = db.getPatients().find((p) => p.id === resolvedPatientId);
    if (!patientRecord) {
      return res.status(404).json({ error: 'Patient not found. Register the patient first.' });
    }
    const resolvedPatientName = req.user.role === 'Patient' ? patientRecord.name : (patientName || patientRecord.name);

    const token = nextQueueToken(doctor, date);

    const newApt = {
      id: `apt-${Date.now()}`,
      token,
      patientId: resolvedPatientId,
      patientName: resolvedPatientName,
      doctorId,
      doctorName: doctor.name,
      room: doctor.room,
      date,
      time,
      status: 'Booked',
      billingStatus: 'Unpaid',
      fee: doctor.consultationFee || 0,
    };

    db.addAppointment(newApt);
    return res.status(201).json({ appointment: newApt });
  } catch (err) {
    console.error('Book appointment error:', err);
    return res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment (Only allowed before check-in)
 */
app.post('/api/appointments/:id/cancel', authenticateToken, (req, res) => {
  const apt = db.getAppointments().find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  // Patients can only cancel their own appointments
  if (req.user.role === 'Patient' && apt.patientId !== req.user.patientId) {
    return res.status(403).json({ error: 'Access denied: You can only cancel your own appointments' });
  }

  if (apt.status !== 'Booked') {
    return res.status(400).json({
      error: `Cancellation forbidden. Appointment is already in '${apt.status}' status. Cancellation is only allowed before check-in.`,
    });
  }

  const updated = db.updateAppointment(apt.id, { status: 'Cancelled', billingStatus: 'Cancelled' });
  return res.json({ message: 'Appointment cancelled successfully', appointment: updated });
});

/**
 * PATCH /api/appointments/:id/status
 * Staff: move an appointment through the queue (check-in, call in, no-show, ...)
 */
app.patch('/api/appointments/:id/status', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const apt = db.getAppointments().find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  if (!canActForDoctor(req.user, apt.doctorId)) {
    return res.status(403).json({ error: 'Access denied: You can only manage your own patient queue' });
  }

  const { status } = req.body;
  const allowed = STATUS_TRANSITIONS[apt.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot change status from '${apt.status}' to '${status}'` });
  }

  const updates = { status };
  if (status === 'CheckedIn' && !apt.checkedInAt) updates.checkedInAt = new Date().toISOString();
  if (status === 'Completed') updates.completedAt = new Date().toISOString();
  const updated = db.updateAppointment(apt.id, updates);
  return res.json({ appointment: updated });
});

/**
 * POST /api/appointments/:id/pay   { paymentMethod, extraCharges: [{ description, amount }], discount }
 * Front desk: record payment and issue an official receipt.
 * The doctor's basic consultation fee is always the first line; the final payable amount
 * varies per patient via extra charges (tests, procedures, ...) and an optional discount.
 */
app.post('/api/appointments/:id/pay', authenticateToken, requireRoles(...FRONT_DESK), (req, res) => {
  const apt = db.getAppointments().find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  if (apt.billingStatus === 'Paid') {
    return res.status(400).json({ error: `Appointment ${apt.token} is already paid (receipt ${apt.receiptNumber})` });
  }
  if (apt.status === 'Cancelled') {
    return res.status(400).json({ error: 'Cannot collect payment for a cancelled appointment' });
  }

  const doctor = db.getDoctors().find((d) => d.id === apt.doctorId);
  const patient = db.getPatients().find((p) => p.id === apt.patientId);
  const fee = Number(apt.fee ?? doctor?.consultationFee ?? 0);
  const paymentMethod = req.body.paymentMethod || 'Cash';

  const extraCharges = Array.isArray(req.body.extraCharges) ? req.body.extraCharges : [];
  const extraItems = [];
  for (const charge of extraCharges) {
    const description = String(charge?.description || '').trim();
    const amount = Number(charge?.amount);
    if (!description && !amount) continue; // ignore blank rows
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Each extra charge needs a description and a positive amount' });
    }
    extraItems.push({ description, quantity: 1, rate: amount, amount });
  }

  const items = [
    { description: `Basic Consultation Fee - ${apt.doctorName}`, quantity: 1, rate: fee, amount: fee },
    ...extraItems,
  ];
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = Number(req.body.discount || 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
    return res.status(400).json({ error: 'Discount must be between 0 and the bill subtotal' });
  }
  const total = subtotal - discount;
  const receiptNumber = nextReceiptNumber();

  const receipt = {
    receiptNumber,
    appointmentId: apt.id,
    patientId: apt.patientId,
    patientName: apt.patientName,
    patientPhone: patient?.phone || '',
    patientAge: patient?.age ?? '',
    patientGender: patient?.gender || '',
    doctorId: apt.doctorId,
    doctorName: apt.doctorName,
    doctorSpecialty: doctor?.specialty || 'General OPD',
    room: apt.room,
    date: todayISO(),
    time: currentTime12h(),
    items,
    subtotal,
    discount,
    tax: 0,
    total,
    paymentMethod,
    status: 'Paid',
    cashierName: req.user.name,
  };
  db.addReceipt(receipt);
  const updated = db.updateAppointment(apt.id, { billingStatus: 'Paid', paymentMethod, receiptNumber, amountPaid: total });
  return res.status(201).json({ receipt, appointment: updated });
});

/**
 * POST /api/appointments/:id/complete
 * Doctor (own patients) / front desk: record consultation notes & prescription, discharge patient
 */
app.post('/api/appointments/:id/complete', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const apt = db.getAppointments().find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  if (!canActForDoctor(req.user, apt.doctorId)) {
    return res.status(403).json({ error: 'Access denied: You can only complete your own consultations' });
  }
  if (!['CheckedIn', 'InConsultation'].includes(apt.status)) {
    return res.status(400).json({ error: `Only checked-in patients can be discharged (current status: ${apt.status})` });
  }

  const { chiefComplaint, diagnosis, vitals, medicines, advice, clinicalNotes } = req.body;
  if (!diagnosis || !String(diagnosis).trim()) {
    return res.status(400).json({ error: 'A diagnosis is required to complete the consultation' });
  }

  const doctor = db.getDoctors().find((d) => d.id === apt.doctorId);
  const cleanMedicines = Array.isArray(medicines) ? medicines.filter((m) => m && String(m.name || '').trim()) : [];
  const visit = {
    id: `vis-${Date.now()}`,
    appointmentId: apt.id,
    patientId: apt.patientId,
    patientName: apt.patientName,
    doctorId: apt.doctorId,
    doctorName: apt.doctorName,
    doctorSpecialty: doctor?.specialty || 'General OPD',
    room: apt.room,
    date: apt.date,
    time: apt.time,
    token: apt.token,
    status: 'Completed',
    billingStatus: apt.billingStatus,
    fee: apt.fee,
    chiefComplaint: chiefComplaint || '',
    diagnosis: String(diagnosis).trim(),
    vitals: vitals || '',
    medicines: cleanMedicines,
    advice: advice || '',
    clinicalNotes: clinicalNotes || '',
  };
  db.addPastVisit(visit);
  const updated = db.updateAppointment(apt.id, { status: 'Completed', completedAt: new Date().toISOString() });
  return res.status(201).json({ visit, appointment: updated });
});

/**
 * GET /api/doctors/:id/booked-slots?date=YYYY-MM-DD
 * Any signed-in user: times already taken (no patient details), so patients don't pick a taken slot
 */
app.get('/api/doctors/:id/booked-slots', authenticateToken, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query parameter is required' });
  const times = db
    .getAppointments()
    .filter((a) => a.doctorId === req.params.id && a.date === date && a.status !== 'Cancelled')
    .map((a) => a.time);
  return res.json({ times });
});

/**
 * GET /api/public/queue?date=YYYY-MM-DD
 * Public (waiting-room TV): doctors and the day's queue with masked patient names
 */
app.get('/api/public/queue', (req, res) => {
  const date = req.query.date || todayISO();
  const appointments = db
    .getAppointments()
    .filter((a) => a.date === date && a.status !== 'Cancelled')
    .map((a) => ({
      id: a.id,
      token: a.token,
      patientName: maskName(a.patientName),
      doctorId: a.doctorId,
      doctorName: a.doctorName,
      room: a.room,
      date: a.date,
      time: a.time,
      status: a.status,
    }));
  return res.json({ date, doctors: db.getDoctors(), appointments });
});

// ==========================================
// 4. MEDICAL VISITS & PRESCRIPTIONS (Role-Scoped)
// ==========================================

/**
 * GET /api/visits
 * Scoped data:
 *  - Doctor only sees their own patient consultations
 *  - Patient only sees their own past visits and prescriptions
 *  - Admin & Receptionist see all clinic visits
 */
app.get('/api/visits', authenticateToken, (req, res) => {
  const { role, doctorId, patientId } = req.user;
  const allVisits = db.getPastVisits();

  if (role === 'Doctor') {
    return res.json({ visits: allVisits.filter((v) => v.doctorId === doctorId) });
  }

  if (role === 'Patient') {
    return res.json({ visits: allVisits.filter((v) => v.patientId === patientId) });
  }

  return res.json({ visits: allVisits });
});

// ==========================================
// 5. BILLING & RECEIPTS (Role-Scoped)
// ==========================================

/**
 * GET /api/receipts
 * Scoped data:
 *  - Patient only sees their own receipts and invoices
 *  - Staff sees all receipts
 */
app.get('/api/receipts', authenticateToken, (req, res) => {
  const { role, patientId } = req.user;
  const allReceipts = db.getReceipts();

  if (role === 'Patient') {
    return res.json({ receipts: allReceipts.filter((r) => r.patientId === patientId) });
  }

  return res.json({ receipts: allReceipts });
});

// ==========================================
// 6. DOCTORS & PATIENT DIRECTORY
// ==========================================

app.get('/api/doctors', (req, res) => {
  res.json({ doctors: db.getDoctors() });
});

/**
 * PATCH /api/doctors/:id/schedule
 * Front desk or the doctor themself: update working days / hours / slot length
 */
app.patch('/api/doctors/:id/schedule', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const doctor = db.getDoctors().find((d) => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  if (!canActForDoctor(req.user, doctor.id)) {
    return res.status(403).json({ error: 'Access denied: You can only edit your own schedule' });
  }

  const { workingDays, startTime, endTime, slotDuration } = req.body;
  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return res.status(400).json({ error: 'At least one working day is required' });
  }
  if (!timeRe.test(startTime) || !timeRe.test(endTime) || startTime >= endTime) {
    return res.status(400).json({ error: 'Start time must be a valid HH:MM earlier than end time' });
  }
  const duration = Number(slotDuration);
  if (!Number.isInteger(duration) || duration < 5 || duration > 120) {
    return res.status(400).json({ error: 'Slot duration must be between 5 and 120 minutes' });
  }

  const updated = db.updateDoctor(doctor.id, { workingDays, startTime, endTime, slotDuration: duration });
  return res.json({ doctor: updated });
});

/**
 * POST /api/doctors/:id/leaves   { date }
 * DELETE /api/doctors/:id/leaves/:date
 */
app.post('/api/doctors/:id/leaves', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const doctor = db.getDoctors().find((d) => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  if (!canActForDoctor(req.user, doctor.id)) {
    return res.status(403).json({ error: 'Access denied: You can only manage your own leaves' });
  }
  const { date } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return res.status(400).json({ error: 'A valid leave date (YYYY-MM-DD) is required' });
  }
  if ((doctor.leaves || []).includes(date)) {
    return res.status(409).json({ error: 'Doctor is already on leave on this date' });
  }

  const updated = db.updateDoctor(doctor.id, { leaves: [...(doctor.leaves || []), date].sort() });
  const affectedBookings = db
    .getAppointments()
    .filter((a) => a.doctorId === doctor.id && a.date === date && a.status === 'Booked').length;
  return res.status(201).json({ doctor: updated, affectedBookings });
});

app.delete('/api/doctors/:id/leaves/:date', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const doctor = db.getDoctors().find((d) => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  if (!canActForDoctor(req.user, doctor.id)) {
    return res.status(403).json({ error: 'Access denied: You can only manage your own leaves' });
  }
  const updated = db.updateDoctor(doctor.id, { leaves: (doctor.leaves || []).filter((d) => d !== req.params.date) });
  return res.json({ doctor: updated });
});

app.get('/api/patients', authenticateToken, (req, res) => {
  if (req.user.role === 'Patient') {
    const patient = db.getPatients().find((p) => p.id === req.user.patientId);
    return res.json({ patients: patient ? [patient] : [] });
  }
  return res.json({ patients: db.getPatients() });
});

/**
 * POST /api/patients
 * Front desk / doctors: register a walk-in patient (no login account is created)
 */
app.post('/api/patients', authenticateToken, requireRoles(...STAFF), (req, res) => {
  const { name, age, gender, phone, email, bloodGroup, allergies, emergencyContact } = req.body;
  const numericAge = Number(age);
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Patient name is required' });
  if (!Number.isFinite(numericAge) || numericAge <= 0 || numericAge > 125) {
    return res.status(400).json({ error: 'A valid age (1–125) is required' });
  }
  if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Contact phone is required' });

  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  if (cleanEmail && db.getPatients().some((p) => (p.email || '').toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'A patient with this email address already exists' });
  }

  const patient = {
    id: `pat-${Date.now()}`,
    name: String(name).trim(),
    age: numericAge,
    gender: gender || 'Other',
    phone: String(phone).trim(),
    email: cleanEmail,
    bloodGroup: bloodGroup || 'Unknown',
    allergies: allergies || 'None known',
    emergencyContact: emergencyContact || 'Not specified',
    createdAt: todayISO(),
  };
  db.addPatient(patient);
  return res.status(201).json({ patient });
});

export default app;
