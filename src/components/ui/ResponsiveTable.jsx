import React from 'react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './LoadingSpinner';

/**
 * ResponsiveTable:
 * - Desktop (>= md): Clean table layout with hover rows and sticky header
 * - Mobile (< md): Transforms automatically into card stacks
 */
export function ResponsiveTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyState,
  className = '',
}) {
  if (isLoading) {
    return <TableSkeleton cols={columns.length} rows={4} />;
  }

  if (!data || data.length === 0) {
    return emptyState || <EmptyState title="No records found" description="No data matches this view." />;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-soft">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 align-middle ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row[col.accessor], row, rowIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIdx) => (
          <div
            key={row[keyField] || rowIdx}
            className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-4 space-y-2.5 transition-all"
          >
            {columns.map((col, colIdx) => {
              const value = col.render ? col.render(row[col.accessor], row, rowIdx) : row[col.accessor];
              if (col.hideOnMobile) return null;

              // Render first column as title or primary block if defined
              if (colIdx === 0 && col.primaryMobile) {
                return (
                  <div key={colIdx} className="font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>{value}</div>
                  </div>
                );
              }

              return (
                <div key={colIdx} className="flex items-center justify-between text-xs py-0.5">
                  <span className="font-medium text-slate-500">{col.header}:</span>
                  <div className="text-right text-slate-800 font-medium">{value}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
