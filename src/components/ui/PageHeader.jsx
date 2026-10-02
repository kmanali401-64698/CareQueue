import React from 'react';

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {breadcrumbs && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-700' : 'hover:text-slate-700'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
