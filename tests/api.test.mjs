/**
 * API integration tests. Runs the Express app on a random port against a throwaway database.
 *   npm test
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEST_DB = path.join(os.tmpdir(), `carequeue-test-${process.pid}.json`);
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
process.env.DB_PATH = TEST_DB; // must be set before the store is imported
process.env.JWT_SECRET = "test-secret";

const { default: app } = await import("../server/app.js");
const server = await new Promise((resolve) => { const srv = app.listen(0, () => resolve(srv)); });
const BASE = `http://localhost:${server.address().port}`;
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, extra); }
};
async function call(method, url, token, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const login = async (email, password) => (await call('POST', '/api/auth/login', null, { email, password })).data.token;

const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY = iso(today);
// find next date doc-1 works (Mon-Sat) and isn't on leave
const futureDate = (() => { for (let i = 1; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); if (d.getDay() !== 0 && i !== 4 && i !== 5) return iso(d); } })();

const rec = await login('receptionist@carequeue.org', 'reception123');
const doc = await login('doctor.chen@carequeue.org', 'doctor123');
const pat = await login('emma.watson@carequeue.org', 'patient123');
const adm = await login('admin@carequeue.org', 'admin123');
check('all roles log in', rec && doc && pat && adm);

// Public queue
let r = await call('GET', '/api/public/queue');
check('public queue is today', r.data.date === TODAY && r.data.appointments.length > 0, JSON.stringify(r.data).slice(0, 200));
check('public queue masks names', r.data.appointments.every((a) => /^\S+( \S\.)?$/.test(a.patientName)), r.data.appointments.map((a) => a.patientName).join(','));
check('public queue hides billing', r.data.appointments.every((a) => a.fee === undefined && a.patientId === undefined));

// Seed data is relative to today
r = await call('GET', '/api/appointments', rec);
check('seeded appointments are dated today', r.data.appointments.some((a) => a.date === TODAY));

// Booking: unique token + slot conflict
r = await call('POST', '/api/appointments', rec, { patientId: 'pat-2', doctorId: 'doc-1', date: futureDate, time: '10:00 AM' });
check('receptionist books', r.status === 201, JSON.stringify(r.data));
const apt1 = r.data.appointment;
check('first token of the day is D1-01', apt1?.token === 'D1-01', apt1?.token);
r = await call('POST', '/api/appointments', pat, { doctorId: 'doc-1', date: futureDate, time: '10:00 AM' });
check('double booking rejected (409)', r.status === 409);
r = await call('POST', '/api/appointments', pat, { doctorId: 'doc-1', date: futureDate, time: '10:15 AM', patientId: 'pat-2' });
check('patient booking forced to own record', r.status === 201 && r.data.appointment.patientId === 'pat-1', JSON.stringify(r.data));
const apt2 = r.data.appointment;
check('second token increments', apt2?.token === 'D1-02', apt2?.token);
r = await call('POST', '/api/appointments', rec, { doctorId: 'doc-1', date: futureDate, time: '10:30 AM' });
check('staff booking without patient rejected', r.status === 400);
r = await call('POST', '/api/appointments', rec, { patientId: 'pat-3', doctorId: 'doc-2', date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); })(), time: '10:00 AM' });
check('booking on leave day rejected', r.status === 409, JSON.stringify(r.data));

// Booked slots endpoint (patient can see times only)
r = await call('GET', `/api/doctors/doc-1/booked-slots?date=${futureDate}`, pat);
check('booked-slots returns times', r.data.times?.includes('10:00 AM') && r.data.times.includes('10:15 AM'));

// Patient cannot cancel others
r = await call('POST', `/api/appointments/${apt1.id}/cancel`, pat);
check('patient cannot cancel others', r.status === 403);
r = await call('POST', `/api/appointments/${apt2.id}/cancel`, pat);
check('patient cancels own', r.status === 200 && r.data.appointment.status === 'Cancelled');

// Status flow + permissions
r = await call('PATCH', `/api/appointments/${apt1.id}/status`, pat, { status: 'CheckedIn' });
check('patient cannot change status', r.status === 403);
r = await call('PATCH', `/api/appointments/${apt1.id}/status`, rec, { status: 'Completed' });
check('invalid transition rejected', r.status === 400);
r = await call('PATCH', `/api/appointments/${apt1.id}/status`, rec, { status: 'CheckedIn' });
check('check-in works', r.status === 200 && r.data.appointment.status === 'CheckedIn' && r.data.appointment.checkedInAt);
r = await call('PATCH', `/api/appointments/${apt1.id}/status`, doc, { status: 'InConsultation' });
check('own doctor starts consult', r.status === 200);

// Doctor of another roster cannot act
const apts = (await call('GET', '/api/appointments', rec)).data.appointments;
const doc3Apt = apts.find((a) => a.doctorId === 'doc-3' && a.status === 'Booked');
r = await call('PATCH', `/api/appointments/${doc3Apt.id}/status`, doc, { status: 'CheckedIn' });
check("doctor cannot touch another doctor's queue", r.status === 403);

// Complete visit
r = await call('POST', `/api/appointments/${apt1.id}/complete`, doc, { diagnosis: '' });
check('completion requires diagnosis', r.status === 400);
r = await call('POST', `/api/appointments/${apt1.id}/complete`, doc, {
  chiefComplaint: 'Cough', diagnosis: 'URTI (J06.9)', vitals: 'BP 120/80',
  medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days', instructions: '' }, { name: '  ' }],
});
check('visit completed', r.status === 201 && r.data.appointment.status === 'Completed');
check('blank medicine rows dropped', r.data.visit?.medicines.length === 1);
r = await call('GET', '/api/visits', pat);
check('patient does not see other patient visits', r.data.visits.every((v) => v.patientId === 'pat-1'));

// Payment
r = await call('POST', `/api/appointments/${apt1.id}/pay`, doc, {});
check('doctor cannot collect payment', r.status === 403);
r = await call('POST', `/api/appointments/${apt1.id}/pay`, rec, { paymentMethod: 'Card' });
check('payment creates receipt', r.status === 201 && /^RCP-\d{4}-\d+$/.test(r.data.receipt.receiptNumber) && r.data.receipt.total === 1000 && r.data.appointment.amountPaid === 1000, JSON.stringify(r.data).slice(0, 200));
const rn = r.data.receipt?.receiptNumber;
r = await call('POST', `/api/appointments/${apt1.id}/pay`, rec, {});
check('double payment rejected', r.status === 400);
r = await call('GET', '/api/receipts', rec);
check('receipt persisted', r.data.receipts.some((x) => x.receiptNumber === rn));

// Variable final amount: basic fee + extra charges - discount
const payApt = (await call("GET", "/api/appointments", rec)).data.appointments.find((a) => a.billingStatus === "Unpaid" && a.doctorId === "doc-2" && a.status !== "NoShow");
r = await call("POST", `/api/appointments/${payApt.id}/pay`, rec, { extraCharges: [{ description: "Blood test", amount: 400 }], discount: 5000 });
check("discount above subtotal rejected", r.status === 400);
r = await call("POST", `/api/appointments/${payApt.id}/pay`, rec, { extraCharges: [{ description: "", amount: 400 }] });
check("extra charge without description rejected", r.status === 400);
r = await call("POST", `/api/appointments/${payApt.id}/pay`, rec, { paymentMethod: "UPI", extraCharges: [{ description: "Blood test", amount: 400 }, { description: "", amount: "" }], discount: 100 });
check("final amount = basic fee + extras - discount", r.status === 201 && r.data.receipt.items.length === 2 && r.data.receipt.items[0].amount === 600 && r.data.receipt.subtotal === 1000 && r.data.receipt.discount === 100 && r.data.receipt.total === 900 && r.data.appointment.amountPaid === 900, JSON.stringify(r.data.receipt));

// Doctor schedule & leaves
r = await call('PATCH', '/api/doctors/doc-2/schedule', doc, { workingDays: ['Mon'], startTime: '09:00', endTime: '12:00', slotDuration: 15 });
check("doctor cannot edit another doctor's schedule", r.status === 403);
r = await call('PATCH', '/api/doctors/doc-1/schedule', doc, { workingDays: ['Mon'], startTime: '12:00', endTime: '09:00', slotDuration: 15 });
check('invalid schedule rejected', r.status === 400);
r = await call('PATCH', '/api/doctors/doc-1/schedule', doc, { workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], startTime: '09:00', endTime: '13:00', slotDuration: 20 });
check('own schedule updated', r.status === 200 && r.data.doctor.slotDuration === 20);
r = await call('POST', '/api/doctors/doc-1/leaves', rec, { date: futureDate });
check('leave added with affected count', r.status === 201 && r.data.affectedBookings === 0 && r.data.doctor.leaves.includes(futureDate), JSON.stringify(r.data).slice(0, 200));
r = await call('POST', '/api/doctors/doc-1/leaves', rec, { date: futureDate });
check('duplicate leave rejected', r.status === 409);
r = await call('DELETE', `/api/doctors/doc-1/leaves/${futureDate}`, rec);
check('leave removed', r.status === 200 && !r.data.doctor.leaves.includes(futureDate));

// Patients
r = await call('POST', '/api/patients', pat, { name: 'X', age: 30, phone: '1' });
check('patient cannot register patients', r.status === 403);
r = await call('POST', '/api/patients', rec, { name: 'Test Walkin', age: 0, phone: '1' });
check('invalid age rejected', r.status === 400);
r = await call('POST', '/api/patients', rec, { name: 'Test Walkin', age: 40, phone: '+1 555 0000', email: 'emma.watson@carequeue.org' });
check('duplicate patient email rejected', r.status === 409);
r = await call('POST', '/api/patients', rec, { name: 'Test Walkin', age: 40, phone: '+1 555 0000' });
check('patient registered', r.status === 201 && r.data.patient.id);

// Booking date/time rules
const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return iso(d); })();
const nextSunday = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return iso(d); })();
r = await call('POST', '/api/appointments', rec, { patientId: 'pat-2', doctorId: 'doc-1', date: yesterday, time: '10:00 AM' });
check('past date rejected', r.status === 400);
r = await call('POST', '/api/appointments', rec, { patientId: 'pat-2', doctorId: 'doc-1', date: nextSunday, time: '10:00 AM' });
check('non-working day rejected', r.status === 409);
r = await call('POST', '/api/appointments', pat, { doctorId: 'doc-1', date: futureDate, time: '10:07 AM' });
check('patient must pick an on-grid slot', r.status === 400);
r = await call('POST', '/api/appointments', pat, { doctorId: 'doc-1', date: futureDate, time: '06:00 PM' });
check('patient slot outside working hours rejected', r.status === 400);
r = await call('POST', '/api/appointments', rec, { patientId: 'pat-2', doctorId: 'doc-1', date: futureDate, time: 'banana' });
check('invalid time rejected', r.status === 400);

// Admin-only fee changes
r = await call('PATCH', '/api/doctors/doc-1/fee', rec, { consultationFee: 900 });
check('receptionist cannot change fees', r.status === 403);
r = await call('PATCH', '/api/doctors/doc-1/fee', adm, { consultationFee: -5 });
check('invalid fee rejected', r.status === 400);
r = await call('PATCH', '/api/doctors/doc-1/fee', adm, { consultationFee: 1100 });
check('admin updates fee', r.status === 200 && r.data.doctor.consultationFee === 1100);

// Admin staff list excludes patients
r = await call('GET', '/api/admin/users', adm);
check('staff list has no patients', r.status === 200 && r.data.staff.length > 0 && r.data.staff.every((u) => u.role !== 'Patient'));

// Signup validation & linking to an existing front-desk patient record
r = await call('POST', '/api/auth/signup', null, { name: 'X', email: 'not-an-email', password: 'secret1' });
check('signup rejects bad email', r.status === 400);
r = await call('POST', '/api/auth/signup', null, { name: 'X', email: 'x@example.com', password: '123' });
check('signup rejects short password', r.status === 400);
const walkin = (await call('POST', '/api/patients', rec, { name: 'Linked Walkin', age: 33, phone: '+91 90000 00000', email: 'linked@example.com', bloodGroup: 'B-' })).data.patient;
r = await call('POST', '/api/auth/signup', null, { name: 'Linked Walkin', email: 'linked@example.com', password: 'secret1' });
check('signup links existing patient record', r.status === 201 && r.data.user.patientId === walkin.id && r.data.patient.bloodGroup === 'B-', JSON.stringify(r.data).slice(0, 200));

// Login brute-force protection
for (let i = 0; i < 10; i++) await call('POST', '/api/auth/login', null, { email: 'admin@carequeue.org', password: 'wrong' });
r = await call('POST', '/api/auth/login', null, { email: 'admin@carequeue.org', password: 'admin123' });
check('login locked after 10 failures', r.status === 429);

// Auth edge cases
r = await call('GET', '/api/appointments', 'garbage');
check('bad token rejected', r.status === 403);
r = await call('GET', '/api/admin/users', rec);
check('receptionist cannot list staff', r.status === 403);

console.log(`\n${pass} passed, ${fail} failed`);
server.close();
fs.rmSync(TEST_DB, { force: true });
process.exit(fail ? 1 : 0);
