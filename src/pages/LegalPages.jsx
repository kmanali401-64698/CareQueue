import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, AlertTriangle } from 'lucide-react';
import { CLINIC, MISSING_LEGAL_DETAILS } from '../config/clinic';

const LAST_UPDATED = '11 October 2026';

const operator = CLINIC.legalName || CLINIC.name;

/** Shared layout for the Privacy Policy and Terms pages. */
function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-900 font-bold mb-6">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </span>
          {CLINIC.name}
        </Link>

        <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 text-sm text-slate-700 leading-relaxed space-y-6">
          <header className="space-y-1 border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          {MISSING_LEGAL_DETAILS.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Some of the clinic's contact details have not been added yet ({MISSING_LEGAL_DETAILS.join(', ')}). The
                clinic must fill them in (src/config/clinic.js) before this page is published.
              </p>
            </div>
          )}

          {children}

          <ContactBlock />
        </article>

        <nav className="mt-6 flex gap-4 text-xs text-slate-500">
          <Link to="/privacy" className="hover:text-slate-800 hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-800 hover:underline">Terms and Conditions</Link>
          <Link to="/login" className="hover:text-slate-800 hover:underline">Sign in</Link>
        </nav>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function ContactBlock() {
  const lines = [
    CLINIC.legalName && ['Operated by', CLINIC.legalName],
    CLINIC.grievanceOfficer && ['Grievance officer', CLINIC.grievanceOfficer],
    CLINIC.address && ['Address', CLINIC.address],
    CLINIC.email && ['Email', CLINIC.email],
    CLINIC.phone && ['Phone', CLINIC.phone],
  ].filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <Section title="Contact">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {lines.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-slate-900">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </Section>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This policy explains what information {operator} collects through this appointment and records system, why it
        is collected, who can see it, and what you can do about it.
      </p>

      <Section title="Information we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account details:</strong> your name, email address and password. Passwords are stored only as a
            one-way hash and cannot be read by anyone, including clinic staff.
          </li>
          <li>
            <strong>Patient profile:</strong> age, gender, phone number, blood group, known allergies and an emergency
            contact.
          </li>
          <li>
            <strong>Health records:</strong> your appointments, check-in times, and what the doctor records during a
            visit, such as complaints, vitals, diagnosis, clinical notes and prescriptions.
          </li>
          <li>
            <strong>Billing records:</strong> consultation fees, any extra charges or discounts, the payment method and
            the receipts issued.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc pl-5 space-y-1">
          <li>To book and manage appointments, and to run the waiting-room queue.</li>
          <li>To let your doctor see your history and record your diagnosis and prescription.</li>
          <li>To record payments and issue receipts.</li>
          <li>To keep the system secure, for example by blocking repeated failed sign-in attempts.</li>
        </ul>
        <p>We do not sell your information and do not use it for advertising.</p>
      </Section>

      <Section title="Who can see your information">
        <ul className="list-disc pl-5 space-y-1">
          <li>You can see your own appointments, prescriptions and receipts.</li>
          <li>Doctors can see the records of patients they consult.</li>
          <li>Reception and administrative staff can see what they need to run appointments and billing.</li>
          <li>
            The waiting-room screen shows only your queue token and your first name with the initial of your last name.
          </li>
        </ul>
        <p>
          We share information outside the clinic only when the law requires it, or when you ask us to (for example, a
          receipt for an insurance claim).
        </p>
      </Section>

      <Section title="Cookies, browser storage and third parties">
        <p>
          When you sign in, the app keeps a sign-in token in your browser's local storage so you stay signed in. It is
          removed when you sign out. We do not use analytics or advertising cookies.
        </p>
        <p>
          The app loads its font from Google Fonts. When it does, your browser connects to Google's servers, which can
          see your IP address.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Medical and billing records are kept for as long as the clinic needs them to care for you and to meet its legal
          record-keeping obligations. Some records cannot be deleted before that period ends, even on request.
        </p>
      </Section>

      <Section title="Your choices and rights">
        <ul className="list-disc pl-5 space-y-1">
          <li>You can update your phone number, emergency contact and allergies yourself in the patient portal.</li>
          <li>To correct other details, or to ask for a copy of your records, contact the clinic.</li>
          <li>
            You can ask us to close your account and delete your information, subject to the record-keeping rules
            above.
          </li>
        </ul>
      </Section>

      <Section title="Children">
        <p>Accounts for patients under 18 should be created and managed by a parent or guardian.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we will update the date at the top of this page.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms and Conditions">
      <p>
        These terms apply to your use of this appointment and records system, operated by {operator}. By creating an
        account or booking an appointment, you agree to them.
      </p>

      <Section title="Not for emergencies">
        <p className="font-medium text-slate-900">
          Do not use this system in a medical emergency. Call 112 or go to the nearest emergency department.
        </p>
      </Section>

      <Section title="Medical advice">
        <p>
          Diagnoses and prescriptions come from the clinic's doctors. The system only records them; it does not give
          medical advice.
        </p>
      </Section>

      <Section title="Your account">
        <ul className="list-disc pl-5 space-y-1">
          <li>Give accurate details, especially allergies and contact information.</li>
          <li>Keep your password private. You are responsible for activity on your account.</li>
          <li>Staff accounts are created by the clinic administrator and may only be used for clinic work.</li>
        </ul>
      </Section>

      <Section title="Appointments">
        <ul className="list-disc pl-5 space-y-1">
          <li>Appointment times depend on the doctor's schedule and may change, for example if a doctor is on leave.</li>
          <li>You can cancel an appointment online until you have been checked in at the clinic.</li>
          <li>Your token shows your place in the queue. Actual waiting times can vary.</li>
        </ul>
      </Section>

      <Section title="Fees and payment">
        <p>
          Each doctor's basic consultation fee is shown when you book. Your final bill may also include charges such as
          tests or medicines, and any discount the clinic applies. Payment is made at the clinic, and a receipt is issued
          for every payment.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Do not try to access other people's records, interfere with the system, or use it for anything other than
          your own care or your work at the clinic. We may suspend accounts that are misused.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          We try to keep the system available, but it may sometimes be unavailable for maintenance or because of
          technical problems. You can always contact the clinic directly.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent the law allows, {operator} is not responsible for losses caused by the system being unavailable
          or by information you entered incorrectly. Nothing in these terms limits liability that cannot be limited by
          law.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of India.
          {CLINIC.jurisdiction && ` Disputes will be handled by the courts in ${CLINIC.jurisdiction}.`}
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>If we change these terms, we will update the date at the top of this page.</p>
      </Section>
    </LegalLayout>
  );
}
