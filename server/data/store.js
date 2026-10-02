import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dateFromToday } from '../utils/date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

// Default initial doctors
export const INITIAL_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiology & Internal Medicine',
    room: 'OPD 101',
    tokenPrefix: 'D1',
    avatar: 'SC',
    consultationFee: 1000,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 15,
    leaves: [dateFromToday(4), dateFromToday(5)],
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Brody',
    specialty: 'Pediatrics & Adolescent Care',
    room: 'OPD 102',
    tokenPrefix: 'D2',
    avatar: 'MB',
    consultationFee: 600,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 15,
    leaves: [dateFromToday(1)],
  },
  {
    id: 'doc-3',
    name: 'Dr. Aisha Patel',
    specialty: 'Dermatology & Clinical Cosmetology',
    room: 'OPD 103',
    tokenPrefix: 'D3',
    avatar: 'AP',
    consultationFee: 1200,
    workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    startTime: '14:00',
    endTime: '18:00',
    slotDuration: 15,
    leaves: [dateFromToday(8)],
  },
];

// Default initial patients
export const INITIAL_PATIENTS = [
  {
    id: 'pat-1',
    name: 'Emma Watson',
    age: 29,
    gender: 'Female',
    phone: '+1 555-0192',
    email: 'emma.watson@carequeue.org',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    emergencyContact: 'James Watson (Spouse) - +1 555-0193',
  },
  {
    id: 'pat-2',
    name: 'Robert Vance',
    age: 54,
    gender: 'Male',
    phone: '+1 555-0144',
    email: 'robert.vance@vancerefrig.com',
    bloodGroup: 'A+',
    allergies: 'None known',
    emergencyContact: 'Phyllis Vance (Spouse) - +1 555-0145',
  },
  {
    id: 'pat-3',
    name: 'David Miller',
    age: 42,
    gender: 'Male',
    phone: '+1 555-0187',
    email: 'david.miller@techflow.io',
    bloodGroup: 'B+',
    allergies: 'Sulfa medications',
    emergencyContact: 'Claire Miller (Sister) - +1 555-0188',
  },
  {
    id: 'pat-4',
    name: 'Sophia Patel',
    age: 22,
    gender: 'Female',
    phone: '+1 555-0131',
    email: 'sophia.patel@stanford.edu',
    bloodGroup: 'AB+',
    allergies: 'Latex, Shellfish',
    emergencyContact: 'Rajesh Patel (Father) - +1 555-0132',
  },
  {
    id: 'pat-5',
    name: 'James Wilson',
    age: 61,
    gender: 'Male',
    phone: '+1 555-0129',
    email: 'j.wilson@plainsboro.med',
    bloodGroup: 'O-',
    allergies: 'Aspirin, NSAIDs',
    emergencyContact: 'Gregory House (Colleague) - +1 555-0120',
  },
];

// Seeded Past Completed Visits
export const INITIAL_PAST_VISITS = [
  {
    id: 'vis-101',
    patientId: 'pat-1',
    patientName: 'Emma Watson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    room: 'OPD 101',
    date: dateFromToday(-14),
    time: '09:30 AM',
    token: 'D1-04',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 1000,
    chiefComplaint: 'Throbbing hemicranial headache and photophobia for 3 days',
    diagnosis: 'Acute Migraine with visual aura (ICD-10 G43.109)',
    vitals: 'BP: 118/76 mmHg | Pulse: 72 bpm | Temp: 98.4°F | SpO2: 99%',
    medicines: [
      { name: 'Sumatriptan Succinate', dosage: '50mg', frequency: 'PRN (At onset)', duration: '5 days', instructions: 'Take 1 tablet at aura onset with water' },
      { name: 'Magnesium Glycinate', dosage: '400mg', frequency: '0-0-1 (Night)', duration: '30 days', instructions: 'Take after dinner before sleep' },
    ],
    advice: 'Trigger identified as high stress and screen exposure. Recommended dark room rest and headache journal.',
  },
  {
    id: 'vis-102',
    patientId: 'pat-2',
    patientName: 'Robert Vance',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    room: 'OPD 101',
    date: dateFromToday(-18),
    time: '10:15 AM',
    token: 'D1-06',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 1000,
    chiefComplaint: 'Routine cardiovascular follow-up, mild morning dizziness',
    diagnosis: 'Stage 1 Essential Hypertension, Controlled (ICD-10 I10)',
    vitals: 'BP: 134/84 mmHg | Pulse: 68 bpm | SpO2: 98%',
    medicines: [
      { name: 'Amlodipine Besylate', dosage: '5mg', frequency: '1-0-0', duration: '30 days', instructions: 'Morning after breakfast' },
    ],
    advice: 'Low sodium DASH diet adherence. Ambulatory BP monitoring advised twice weekly.',
  },
  {
    id: 'vis-103',
    patientId: 'pat-3',
    patientName: 'David Miller',
    doctorId: 'doc-2',
    doctorName: 'Dr. Marcus Brody',
    doctorSpecialty: 'Pediatrics & Adolescent Care',
    room: 'OPD 102',
    date: dateFromToday(-10),
    time: '11:00 AM',
    token: 'D2-02',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 600,
    chiefComplaint: 'Persistent nasal congestion, watery rhinorrhea, and dry cough',
    diagnosis: 'Seasonal Allergic Rhinitis (ICD-10 J30.2)',
    vitals: 'BP: 122/80 mmHg | Pulse: 74 bpm | Temp: 98.6°F',
    medicines: [
      { name: 'Fluticasone Propionate Spray', dosage: '50mcg', frequency: '1 spray each nostril daily', duration: '30 days', instructions: 'Use in morning' },
      { name: 'Cetirizine Hydrochloride', dosage: '10mg', frequency: '0-0-1', duration: '14 days', instructions: 'At bedtime with water' },
    ],
    advice: 'Avoid pollen peak hours. Saline nasal rinse before spray.',
  },
  {
    id: 'vis-104',
    patientId: 'pat-4',
    patientName: 'Sophia Patel',
    doctorId: 'doc-3',
    doctorName: 'Dr. Aisha Patel',
    doctorSpecialty: 'Dermatology & Clinical Cosmetology',
    room: 'OPD 103',
    date: dateFromToday(-6),
    time: '02:30 PM',
    token: 'D3-03',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 1200,
    chiefComplaint: 'Pruritic erythematous rash with microvesicles on bilateral forearms',
    diagnosis: 'Acute Contact Allergic Dermatitis (ICD-10 L23.9)',
    vitals: 'BP: 116/74 mmHg | Temp: 98.2°F',
    medicines: [
      { name: 'Hydrocortisone Cream 1%', dosage: 'Thin film', frequency: '1-0-1', duration: '7 days', instructions: 'Apply twice daily' },
      { name: 'Ceramide Barrier Ointment', dosage: 'Liberal', frequency: '2-3 times daily', duration: '21 days', instructions: 'Apply after washing' },
    ],
    advice: 'Discontinue cosmetic product containing linalool immediately.',
  },
  {
    id: 'vis-105',
    patientId: 'pat-5',
    patientName: 'James Wilson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    room: 'OPD 101',
    date: dateFromToday(-23),
    time: '11:45 AM',
    token: 'D1-09',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 1000,
    chiefComplaint: 'Bilateral knee stiffness, aggravated by ascending stairs',
    diagnosis: 'Primary Bilateral Gonarthrosis / Knee Osteoarthritis (ICD-10 M17.0)',
    vitals: 'BP: 128/82 mmHg | Pulse: 70 bpm',
    medicines: [
      { name: 'Glucosamine Sulfate', dosage: '1500mg', frequency: '1-0-0', duration: '60 days', instructions: 'Take with breakfast' },
      { name: 'Paracetamol', dosage: '650mg', frequency: 'PRN', duration: '14 days', instructions: 'Take for joint discomfort after food' },
    ],
    advice: 'Physical therapy prescription issued for quadriceps strengthening.',
  },
];

// Initial appointments
export const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-1',
    token: 'D1-07',
    patientId: 'pat-1',
    patientName: 'Emma Watson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    room: 'OPD 101',
    date: dateFromToday(0),
    time: '09:15 AM',
    status: 'InConsultation',
    billingStatus: 'Unpaid',
    fee: 1000,
  },
  {
    id: 'apt-2',
    token: 'D1-08',
    patientId: 'pat-2',
    patientName: 'Robert Vance',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    room: 'OPD 101',
    date: dateFromToday(0),
    time: '09:30 AM',
    status: 'CheckedIn',
    billingStatus: 'Unpaid',
    fee: 1000,
  },
  {
    id: 'apt-3',
    token: 'D2-01',
    patientId: 'pat-4',
    patientName: 'Sophia Patel',
    doctorId: 'doc-2',
    doctorName: 'Dr. Marcus Brody',
    room: 'OPD 102',
    date: dateFromToday(0),
    time: '10:00 AM',
    status: 'Booked',
    billingStatus: 'Unpaid',
    fee: 600,
  },
  {
    id: 'apt-4',
    token: 'D3-01',
    patientId: 'pat-3',
    patientName: 'David Miller',
    doctorId: 'doc-3',
    doctorName: 'Dr. Aisha Patel',
    room: 'OPD 103',
    date: dateFromToday(0),
    time: '02:00 PM',
    status: 'Booked',
    billingStatus: 'Paid',
    fee: 1200,
    amountPaid: 1200,
    paymentMethod: 'Credit Card',
    receiptNumber: 'RCP-2026-1044',
  },
  {
    id: 'apt-5',
    token: 'D1-06',
    patientId: 'pat-5',
    patientName: 'James Wilson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    room: 'OPD 101',
    date: dateFromToday(0),
    time: '08:45 AM',
    status: 'Completed',
    billingStatus: 'Paid',
    fee: 1000,
    amountPaid: 1300,
    paymentMethod: 'Insurance / Card',
    receiptNumber: 'RCP-2026-1045',
  },
  {
    id: 'apt-6',
    token: 'D2-00',
    patientId: 'pat-3',
    patientName: 'David Miller',
    doctorId: 'doc-2',
    doctorName: 'Dr. Marcus Brody',
    room: 'OPD 102',
    date: dateFromToday(0),
    time: '09:00 AM',
    status: 'NoShow',
    billingStatus: 'Unpaid',
    fee: 600,
  },
];

// Initial receipts
export const INITIAL_RECEIPTS = [
  {
    receiptNumber: 'RCP-2026-1045',
    appointmentId: 'apt-5',
    patientId: 'pat-5',
    patientName: 'James Wilson',
    patientPhone: '+1 555-0129',
    patientAge: 61,
    patientGender: 'Male',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Chen',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    room: 'OPD 101',
    date: dateFromToday(0),
    time: '09:12 AM',
    items: [
      { description: 'Basic Consultation Fee - Dr. Sarah Chen', quantity: 1, rate: 1000, amount: 1000 },
      { description: 'ECG Review', quantity: 1, rate: 300, amount: 300 },
    ],
    subtotal: 1300,
    discount: 0,
    tax: 0,
    total: 1300,
    paymentMethod: 'Insurance / Card',
    status: 'Paid',
    cashierName: 'Front Desk Receptionist',
  },
  {
    receiptNumber: 'RCP-2026-1044',
    appointmentId: 'apt-4',
    patientId: 'pat-3',
    patientName: 'David Miller',
    patientPhone: '+1 555-0187',
    patientAge: 42,
    patientGender: 'Male',
    doctorId: 'doc-3',
    doctorName: 'Dr. Aisha Patel',
    doctorSpecialty: 'Dermatology & Clinical Cosmetology',
    room: 'OPD 103',
    date: dateFromToday(0),
    time: '08:30 AM',
    items: [
      { description: 'Basic Consultation Fee - Dr. Aisha Patel', quantity: 1, rate: 1200, amount: 1200 },
    ],
    subtotal: 1200,
    discount: 0,
    tax: 0,
    total: 1200,
    paymentMethod: 'Credit Card',
    status: 'Paid',
    cashierName: 'Front Desk Receptionist',
  },
];

// Seed generator (synchronous so the store is ready before the first request)
export function getSeededData() {
  const salt = bcrypt.genSaltSync(10);
  
  // Seeded Users (1 account per role)
  const users = [
    {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@carequeue.org',
      password: bcrypt.hashSync('admin123', salt),
      role: 'Admin',
      doctorId: null,
      patientId: null,
      createdAt: dateFromToday(0),
    },
    {
      id: 'usr-rec-1',
      name: 'Front Desk Receptionist',
      email: 'receptionist@carequeue.org',
      password: bcrypt.hashSync('reception123', salt),
      role: 'Receptionist',
      doctorId: null,
      patientId: null,
      createdAt: dateFromToday(0),
    },
    {
      id: 'usr-doc-1',
      name: 'Dr. Sarah Chen',
      email: 'doctor.chen@carequeue.org',
      password: bcrypt.hashSync('doctor123', salt),
      role: 'Doctor',
      doctorId: 'doc-1',
      patientId: null,
      createdAt: dateFromToday(0),
    },
    {
      id: 'usr-pat-1',
      name: 'Emma Watson',
      email: 'emma.watson@carequeue.org',
      password: bcrypt.hashSync('patient123', salt),
      role: 'Patient',
      doctorId: null,
      patientId: 'pat-1',
      createdAt: dateFromToday(0),
    },
  ];

  return {
    users,
    doctors: INITIAL_DOCTORS,
    patients: INITIAL_PATIENTS,
    appointments: INITIAL_APPOINTMENTS,
    pastVisits: INITIAL_PAST_VISITS,
    receipts: INITIAL_RECEIPTS,
  };
}

// In-Memory / File-based Database Store Singleton
class DatabaseStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getSeededData();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load db.json, falling back to seed data:', err);
      this.data = getSeededData();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist db.json:', e);
    }
  }

  getUsers() { return this.data.users; }
  getDoctors() { return this.data.doctors; }
  getPatients() { return this.data.patients; }
  getAppointments() { return this.data.appointments; }
  getPastVisits() { return this.data.pastVisits; }
  getReceipts() { return this.data.receipts; }

  addUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  addPatient(patient) {
    this.data.patients.unshift(patient);
    this.save();
    return patient;
  }

  addDoctor(doctor) {
    this.data.doctors.push(doctor);
    this.save();
    return doctor;
  }

  updateDoctor(id, updates) {
    this.data.doctors = this.data.doctors.map(d => d.id === id ? { ...d, ...updates } : d);
    this.save();
    return this.data.doctors.find(d => d.id === id);
  }

  addAppointment(apt) {
    this.data.appointments.unshift(apt);
    this.save();
    return apt;
  }

  updateAppointment(id, updates) {
    this.data.appointments = this.data.appointments.map(a => a.id === id ? { ...a, ...updates } : a);
    this.save();
    return this.data.appointments.find(a => a.id === id);
  }

  addPastVisit(visit) {
    this.data.pastVisits.unshift(visit);
    this.save();
    return visit;
  }

  addReceipt(receipt) {
    this.data.receipts.unshift(receipt);
    this.save();
    return receipt;
  }
}

export const db = new DatabaseStore();
