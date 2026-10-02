import React from 'react';

export function Card({
  children,
  className = '',
  hoverEffect = false,
  padding = 'normal', // 'none' | 'sm' | 'normal' | 'lg'
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding] || 'p-5 sm:p-6';

  const hoverClass = hoverEffect
    ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200'
    : '';

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-soft overflow-hidden ${paddingStyles} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  children,
}) {
  if (children) {
    return (
      <div className={`pb-4 mb-4 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`pb-4 mb-4 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
