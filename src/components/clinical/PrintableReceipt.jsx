import React from 'react';
import {
  Printer,
  HeartPulse,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui';
import { formatRs } from '../../utils/currency';

export function PrintableReceipt({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  // Missing fields render blank — never another patient's details
  const {
    receiptNumber = '',
    date = '',
    time = '',
    patientName = '',
    patientId = '',
    patientAge = '',
    patientGender = '',
    patientPhone = '',
    doctorName = '',
    doctorSpecialty = '',
    room = '',
    paymentMethod = '',
    items = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    cashierName = '',
  } = receipt;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200/90 print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs sm:text-sm tracking-wide">
              Official Medical Payment Receipt
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
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Printable Receipt Document Area */}
        <div className="printable-sheet p-6 sm:p-10 space-y-6 bg-white text-slate-900 font-sans text-xs sm:text-sm">
          {/* Clinic Official Header (IDENTICAL TO PRESCRIPTION) */}
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
              <span className="text-slate-400 block text-[10px]">Tax ID: US-EIN-9481023</span>
            </div>
          </div>

          {/* Receipt Title & Meta Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Official Document
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                MEDICAL CONSULTATION RECEIPT & TAX INVOICE
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receipt Number</span>
              <span className="font-mono text-base font-bold text-brand-800">{receiptNumber}</span>
              <span className="text-xs text-slate-500 block font-mono">{date} • {time}</span>
            </div>
          </div>

          {/* Patient & Doctor Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Patient Box */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-white">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                Billed To (Patient)
              </span>
              <p className="font-bold text-slate-900 text-sm">{patientName}</p>
              <p className="text-slate-600">{patientAge} yrs • {patientGender} • ID: {patientId}</p>
              <p className="font-mono text-slate-500 text-[11px]">Phone: {patientPhone}</p>
            </div>

            {/* Doctor & Service Box */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-white">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                Consulting Physician
              </span>
              <p className="font-bold text-slate-900 text-sm">{doctorName}</p>
              <p className="text-slate-600">{doctorSpecialty}</p>
              <p className="text-brand-700 font-medium text-[11px]">Consultation Room: {room}</p>
            </div>
          </div>

          {/* Billing Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Service / Consultation Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items && items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatRs(item.rate, 2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatRs(item.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatRs(subtotal, 2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">- {formatRs(discount, 2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Healthcare Tax / GST:</span>
                  <span className="font-mono font-medium text-emerald-600">Rs. 0.00 (Exempt)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-900 font-bold text-sm">
                  <span>Total Paid:</span>
                  <span className="font-mono text-base text-brand-900">{formatRs(total, 2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status & Official Stamp */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Payment Status</span>
                <span className="font-bold text-emerald-900 text-sm">Full Payment Received</span>
                <span className="text-xs text-emerald-700 block font-medium">Method: {paymentMethod}</span>
              </div>
            </div>

            {/* Official PAID Stamp */}
            <div className="border-2 border-dashed border-emerald-600 px-4 py-1.5 rounded-lg text-center transform -rotate-2">
              <span className="font-black text-emerald-700 text-base tracking-widest uppercase">
                PAID & SETTLED
              </span>
              <span className="text-[9px] text-emerald-600 block uppercase font-mono">
                CareQueue Accounts
              </span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
            <div className="text-slate-500 text-[11px] space-y-0.5">
              <p className="font-semibold text-slate-700">Terms & Policy:</p>
              <p>Receipt issued for clinical medical services rendered. Retain for insurance reimbursement.</p>
              <p className="text-[10px] text-slate-400">Printed via CareQueue Cloud Health Management</p>
            </div>

            <div className="text-center min-w-[180px] space-y-1">
              <div className="h-8 border-b border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-600 text-xs">{cashierName}</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Authorized Desk Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintableReceipt;
