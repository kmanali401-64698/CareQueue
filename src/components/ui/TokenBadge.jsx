import React from 'react';
import { Hash } from 'lucide-react';

/**
 * TokenBadge: Healthcare Queue Ticket / Token Display
 * Format: Large bold pills, e.g., D1-07, T-102
 */
export function TokenBadge({
  token,
  prefix,
  counter,
  variant = 'teal',
  size = 'md',
  className = '',
}) {
  const displayToken = token || `${prefix ? prefix + '-' : ''}${counter || '00'}`;

  const variantStyles = {
    teal: 'bg-brand-50 text-brand-900 border-brand-200 ring-1 ring-brand-500/20 shadow-sm',
    dark: 'bg-slate-900 text-white border-slate-700 shadow-sm',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  }[variant] || 'bg-brand-50 text-brand-900 border-brand-200 ring-1 ring-brand-500/20 shadow-sm';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs tracking-wider',
    md: 'px-3.5 py-1.5 text-sm sm:text-base tracking-wide',
    lg: 'px-5 py-2.5 text-lg sm:text-xl tracking-wider font-extrabold',
  }[size] || 'px-3.5 py-1.5 text-sm sm:text-base tracking-wide';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold border transition-colors select-none ${variantStyles} ${sizeStyles} ${className}`}
      title={`Queue Token: ${displayToken}`}
    >
      <Hash className="w-3.5 h-3.5 opacity-50 shrink-0" />
      <span>{displayToken}</span>
    </span>
  );
}

export default TokenBadge;
