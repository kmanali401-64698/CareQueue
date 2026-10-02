import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true/false/neutral, label: 'vs yesterday' }
  subtitle,
  badgeText,
  iconColor = 'teal', // 'teal' | 'blue' | 'purple' | 'amber' | 'emerald'
  className = '',
}) {
  const iconColors = {
    teal: 'bg-brand-50 text-brand-600 border border-brand-200/60',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    purple: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    rose: 'bg-rose-50 text-rose-600 border border-rose-200/60',
  }[iconColor] || 'bg-brand-50 text-brand-600 border border-brand-200/60';

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 sm:p-6 transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconColors}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight whitespace-nowrap">{value}</span>
        {badgeText && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badgeText}
          </span>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-medium gap-0.5 ${
                trend.isPositive === true
                  ? 'text-emerald-600 font-semibold'
                  : trend.isPositive === false
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              {trend.isPositive === true ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : trend.isPositive === false ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {trend?.label && <span className="text-slate-400">{trend.label}</span>}
          {!trend && subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
