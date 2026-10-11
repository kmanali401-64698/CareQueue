import React from 'react';
import { HeartPulse } from 'lucide-react';
import { CLINIC } from '../../config/clinic';

/**
 * Header printed on prescriptions and receipts.
 * Only shows details that are filled in in src/config/clinic.js.
 */
export function ClinicLetterhead() {
  const contactLine = [CLINIC.address, CLINIC.phone && `Tel: ${CLINIC.phone}`, CLINIC.email].filter(Boolean).join(' · ');

  return (
    <div className="border-b-2 border-brand-600 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
          <HeartPulse className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-900 tracking-tight">{CLINIC.name}</h1>
          {contactLine && <p className="text-[11px] text-slate-500 mt-0.5">{contactLine}</p>}
        </div>
      </div>

      {(CLINIC.registrationNumber || CLINIC.gstin) && (
        <div className="sm:text-right sm:border-l sm:pl-4 border-slate-200 text-xs space-y-0.5">
          {CLINIC.registrationNumber && (
            <span className="font-mono font-semibold text-slate-800 block">Reg. No: {CLINIC.registrationNumber}</span>
          )}
          {CLINIC.gstin && <span className="font-mono text-slate-600 block">GSTIN: {CLINIC.gstin}</span>}
        </div>
      )}
    </div>
  );
}

export default ClinicLetterhead;
