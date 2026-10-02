import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({
  size = 'md',
  message,
  className = '',
}) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }[size] || 'w-6 h-6';

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 gap-2.5 ${className}`}>
      <Loader2 className={`${sizeMap} animate-spin text-brand-600`} />
      {message && <p className="text-xs sm:text-sm text-slate-500 font-medium">{message}</p>}
    </div>
  );
}

export function Skeleton({ className = '', variant = 'text' }) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }[variant] || 'rounded';

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variantStyles} ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 4, cols = 5 }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4 pb-3 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2.5 border-b border-slate-50">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
