import React from 'react';

/**
 * Standard CareQueue Status Badge System
 * - Booked: blue
 * - CheckedIn: amber
 * - InConsultation: purple
 * - Completed: green
 * - NoShow: red
 * - Cancelled: grey
 * - Unpaid: orange
 * - Paid: green
 */
const STATUS_STYLES = {
  // Primary clinical status keys
  Booked: {
    container: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    label: 'Booked',
  },
  CheckedIn: {
    container: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    label: 'Checked In',
  },
  InConsultation: {
    container: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
    label: 'In Consultation',
  },
  Completed: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  NoShow: {
    container: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
    label: 'No Show',
  },
  Cancelled: {
    container: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Cancelled',
  },
  Unpaid: {
    container: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dot: 'bg-orange-500',
    label: 'Unpaid',
  },
  Paid: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Paid',
  },

  // Color-based aliases
  teal: {
    container: 'bg-brand-50 text-brand-700 border-brand-200',
    dot: 'bg-brand-500',
  },
  blue: {
    container: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  amber: {
    container: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  purple: {
    container: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  green: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  red: {
    container: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  orange: {
    container: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  grey: {
    container: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  gray: {
    container: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export function Badge({
  status,
  variant,
  children,
  withDot = true,
  size = 'md',
  className = '',
}) {
  const key = status || variant || 'grey';
  const config = STATUS_STYLES[key] || STATUS_STYLES.grey;
  const label = children || config.label || key;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size] || 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.container} ${sizeClasses} ${className}`}
    >
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

export default Badge;
