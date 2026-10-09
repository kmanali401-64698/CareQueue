import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pill } from 'lucide-react';
import { Modal, Button, FormField, Input, Select } from '../ui';
import { useClinic } from '../../context/ClinicContext';
import { formatRs } from '../../utils/currency';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit / Credit Card', 'Insurance', 'Net Banking'];
const EMPTY_CHARGE = { description: '', amount: '' };

/**
 * Collect payment for an appointment. Starts from the doctor's basic consultation fee;
 * the receptionist can add patient-specific charges (tests, procedures, ...) and a discount.
 */
export function CollectPaymentModal({ appointment, onClose, onPaid }) {
  const { markAsPaid, pastVisits } = useClinic();
  const [extraCharges, setExtraCharges] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!appointment) return null;

  // Prescription written during this appointment (if the doctor has completed the visit)
  const visit = pastVisits.find((v) => v.appointmentId === appointment.id);
  const prescribed = visit?.medicines || [];
  const medicineLabel = (m) => [m.name, m.dosage, m.duration && `× ${m.duration}`].filter(Boolean).join(' ');
  const medicinesAlreadyAdded = prescribed.length > 0 && prescribed.every((m) => extraCharges.some((c) => c.description === medicineLabel(m)));
  const addPrescribedMedicines = () =>
    setExtraCharges((prev) => [
      ...prev,
      ...prescribed
        .filter((m) => !prev.some((c) => c.description === medicineLabel(m)))
        .map((m) => ({ description: medicineLabel(m), amount: '' })),
    ]);

  const basicFee = Number(appointment.fee) || 0;
  const extrasTotal = extraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const subtotal = basicFee + extrasTotal;
  const discountValue = Number(discount) || 0;
  const total = subtotal - discountValue;

  const updateCharge = (index, field, value) =>
    setExtraCharges((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = extraCharges.filter((c) => c.description.trim() || c.amount);
    if (filled.some((c) => !c.description.trim() || !(Number(c.amount) > 0))) {
      setError('Each extra charge needs a description and an amount greater than 0');
      return;
    }
    if (discountValue < 0 || discountValue > subtotal) {
      setError('Discount must be between 0 and the subtotal');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const receipt = await markAsPaid(appointment.id, {
        paymentMethod,
        extraCharges: filled.map((c) => ({ description: c.description.trim(), amount: Number(c.amount) })),
        discount: discountValue,
      });
      toast.success(
        `Payment of ${formatRs(receipt.total)} recorded for ${appointment.patientName}. Receipt ${receipt.receiptNumber} generated.`
      );
      onPaid(receipt);
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => !isSubmitting && onClose()}
      title={`Collect Payment • ${appointment.token}`}
      description={`${appointment.patientName} • ${appointment.doctorName}`}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting || total < 0}>
            Collect {formatRs(total)} & Print
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Basic consultation fee (fixed per doctor) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
          <span className="font-semibold text-slate-700">Basic Consultation Fee</span>
          <span className="font-mono font-bold text-slate-900">{formatRs(basicFee)}</span>
        </div>

        {/* Prescription from this visit */}
        {visit ? (
          <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/50 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-brand-600" />
                Prescription • {visit.diagnosis}
              </span>
              {prescribed.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPrescribedMedicines}
                  disabled={isSubmitting || medicinesAlreadyAdded}
                >
                  {medicinesAlreadyAdded ? 'Medicines added' : 'Add medicines to bill'}
                </Button>
              )}
            </div>
            {prescribed.length > 0 ? (
              <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                {prescribed.map((m, i) => (
                  <li key={i}>
                    {medicineLabel(m)}
                    {m.frequency ? ` (${m.frequency})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No medicines prescribed.</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            No prescription has been saved for this visit yet. Medicines can be added to the bill once the doctor
            completes the consultation.
          </p>
        )}

        {/* Patient-specific additional charges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Additional Charges</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={Plus}
              onClick={() => setExtraCharges((prev) => [...prev, { ...EMPTY_CHARGE }])}
              disabled={isSubmitting}
            >
              Add Charge
            </Button>
          </div>
          {extraCharges.length === 0 && (
            <p className="text-xs text-slate-400">None — e.g. medicines dispensed, lab tests, ECG, dressing, injections.</p>
          )}
          {extraCharges.map((charge, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                id={`charge-desc-${index}`}
                placeholder="Description (e.g. Blood test)"
                value={charge.description}
                onChange={(e) => updateCharge(index, 'description', e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                id={`charge-amt-${index}`}
                type="number"
                min="1"
                placeholder="Rs."
                className="!w-28"
                value={charge.amount}
                onChange={(e) => updateCharge(index, 'amount', e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-rose-600"
                onClick={() => setExtraCharges((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove charge"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Discount (Rs.)" id="payment-discount">
            <Input
              id="payment-discount"
              type="number"
              min="0"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField label="Payment Method" id="payment-method">
            <Select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={isSubmitting}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Bill summary */}
        <div className="p-3 rounded-xl border border-slate-200 text-sm space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatRs(subtotal)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="font-mono">- {formatRs(discountValue)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Final Payable</span>
            <span className="font-mono">{formatRs(total)}</span>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      </form>
    </Modal>
  );
}

export default CollectPaymentModal;
