import React from 'react';
import { AlertCircle } from 'lucide-react';

export function FormField({
  label,
  id,
  error,
  helperText,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Input({
  id,
  type = 'text',
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const borderClasses = error
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900 placeholder-rose-300'
    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200 text-slate-900 placeholder-slate-400';

  return (
    <input
      id={id}
      type={type}
      disabled={disabled}
      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white shadow-soft-xs transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${borderClasses} ${className}`}
      {...props}
    />
  );
}

export function Select({
  id,
  error,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const borderClasses = error
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200';

  return (
    <select
      id={id}
      disabled={disabled}
      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white shadow-soft-xs transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-800 ${borderClasses} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  id,
  error,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) {
  const borderClasses = error
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200';

  return (
    <textarea
      id={id}
      rows={rows}
      disabled={disabled}
      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white shadow-soft-xs transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-800 ${borderClasses} ${className}`}
      {...props}
    />
  );
}
