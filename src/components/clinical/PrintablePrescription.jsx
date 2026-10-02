import React from 'react';
import {
  Printer,
  HeartPulse,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui';

export function PrintablePrescription({ prescription, onClose }) {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  // Missing fields render blank — never another patient's or doctor's details
  const {
    doctorName = '',
    doctorSpecialty = '',
    room = '',
    doctorRegNo = '',
    patientName = '',
    patientAge = '',
    patientGender = '',
    patientPhone = '',
    date = '',
    token = '',
    vitals = '',
    allergies = '',
    diagnosis = '',
    medicines = [],
    advice = '',
  } = prescription;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200/90 print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-xs sm:text-sm tracking-wide">
              Official Medical Prescription Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-white border-slate-700 hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Print Prescription
            </Button>
          </div>
        </div>

        {/* Printable Prescription Document Area */}
        <div className="printable-sheet p-6 sm:p-10 space-y-6 bg-white text-slate-900 font-sans text-xs sm:text-sm">
          {/* Clinic Official Header */}
          <div className="border-b-2 border-brand-600 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-soft">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-brand-900 tracking-tight uppercase">
                  CareQueue Medical Center
                </h1>
                <p className="text-xs text-brand-700 font-semibold tracking-wider uppercase">
                  Department of Outpatient Clinical Care & Specialist OPD
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  100 Health Sciences Blvd, Suite 400 • Medical District • Tel: (555) 019-CARE
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-4 border-slate-200 text-xs">
              <span className="font-mono font-bold text-brand-800 block text-sm">
                Reg: CL-2026-8891
              </span>
              <span className="text-slate-500 block text-[11px]">Accredited Healthcare Facility</span>
              <span className="text-slate-400 block text-[10px]">Govt. Health Lic. #49281-B</span>
            </div>
          </div>

          {/* Doctor Details Bar */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Consulting Physician</span>
              <span className="font-bold text-slate-900 text-sm">{doctorName}</span>
              <span className="text-slate-600 block text-[11px]">{doctorSpecialty}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">OPD Room</span>
              <span className="font-bold text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
                {room}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Physician Registration</span>
              <span className="font-mono font-semibold text-slate-700">{doctorRegNo}</span>
            </div>
          </div>

          {/* Patient Details & Vitals Strip */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Age / Gender</span>
                <span className="font-medium text-slate-800">{patientAge} yrs • {patientGender}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Date & Token</span>
                <span className="font-mono font-bold text-slate-900">{date} • {token}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Contact Phone</span>
                <span className="font-mono text-slate-700">{patientPhone}</span>
              </div>
            </div>

            {/* Vitals and Allergies Highlight */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Recorded Vitals:</span>
                <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{vitals}</span>
              </div>

              {allergies && (
                <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Allergies: {allergies}</span>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Diagnosis */}
          <div className="bg-brand-50/60 border border-brand-200/90 rounded-xl p-3.5">
            <span className="font-bold text-brand-900 uppercase text-[10px] tracking-wider block">
              Clinical Assessment & Provisional Diagnosis
            </span>
            <p className="font-bold text-brand-950 text-sm mt-0.5">{diagnosis}</p>
          </div>

          {/* Prescription Rx Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <span className="text-2xl font-serif font-black text-brand-800 leading-none">℞</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prescribed Medications & Dosage Schedule
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Name & Strength</th>
                  <th className="py-2.5 px-3">Dosage</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines && medicines.length > 0 ? (
                  medicines.map((med, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{med.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{med.dosage}</td>
                      <td className="py-2.5 px-3 font-semibold text-brand-800 bg-brand-50/50">{med.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-700">{med.duration}</td>
                      <td className="py-2.5 px-3 text-slate-600 italic">{med.instructions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-400 italic">
                      No medications entered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advice & Lifestyle Recommendations */}
          {advice && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                Doctor's Advice & Patient Instructions
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{advice}</p>
            </div>
          )}

          {/* Prescription Footer & Signature Line */}
          <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1 text-slate-500 text-[11px]">
              <p className="font-semibold text-slate-700">Notice to Pharmacist:</p>
              <p>Dispense strictly as prescribed. Do not substitute active salts without physician approval.</p>
              <p className="text-[10px] text-slate-400">Generated securely via CareQueue EMR System</p>
            </div>

            <div className="text-center space-y-1 min-w-[200px]">
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-600 text-sm">{doctorName}</span>
              </div>
              <p className="font-bold text-slate-900 text-xs">{doctorName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Medical Practitioner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintablePrescription;
