/**
 * Your clinic's real details.
 *
 * These are printed on prescriptions and receipts and shown on the Privacy Policy
 * and Terms pages. Fill them in before going live. Any field left as '' is simply
 * not shown, so nothing invented ever appears on a printed document.
 */
export const CLINIC = {
  // Name shown in the app, on documents and on the legal pages
  name: 'CareQueue Clinic',

  // Printed on prescriptions and receipts
  address: '', // e.g. '12 MG Road, Shivajinagar, Pune 411005'
  phone: '', // e.g. '+91 20 1234 5678'
  email: '', // e.g. 'contact@yourclinic.in'
  registrationNumber: '', // clinic / establishment registration number
  gstin: '', // only if the clinic is GST-registered

  // Used on the Privacy Policy and Terms pages
  legalName: '', // the person or business legally operating the clinic
  grievanceOfficer: '', // name of the person handling privacy requests
  jurisdiction: '', // e.g. 'Pune, Maharashtra, India'
  website: '', // e.g. 'https://www.yourclinic.in'
};

/** Fields the legal pages need before launch. */
export const MISSING_LEGAL_DETAILS = ['legalName', 'address', 'email', 'grievanceOfficer', 'jurisdiction'].filter(
  (key) => !CLINIC[key]
);
