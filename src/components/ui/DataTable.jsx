
/**
 * Full-featured data table with loading, empty, responsive card view, and accessibility.
 *
 * Props:
 *   columns: [{ key, label, render?, className?, headerClassName? }]
 *   rows: array of data objects
 *   keyField: string (default 'id')
 *   loading: boolean
 *   emptyIcon: React component or emoji string
 *   emptyText: string
 *   emptySubtext: string
 *   onRowClick: (row) => void
 *   className: string
 *   ariaLabel: string
 */
export function DataTable({
  columns = [],
  rows = [],
  keyField = 'id',
  loading = false,
  emptyIcon = '📭',
  emptyText = 'Không có dữ liệu',
  emptySubtext,
  onRowClick,
  className = '',
  ariaLabel = 'Bảng dữ liệu',
}) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden ${className}`}
        role="status" aria-label="Đang tải dữ liệu">
        <div className="bg-slate-50 border-b-2 border-slate-200 px-4 py-3 flex gap-4"
          style={{ background: 'var(--color-primary-50)' }}>
          {columns.map((col, i) => (
            <div key={i} className="animate-pulse h-3 rounded bg-slate-200 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, r) => (
          <div key={r} className="px-4 py-3.5 border-b border-slate-100 flex gap-4">
            {columns.map((_, c) => (
              <div key={c} className="animate-pulse h-3.5 rounded bg-slate-200 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const isEmpty = rows.length === 0;

  return (
    <>
      {/* Desktop table */}
      <div className={`hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white ${className}`}>
        <table className="w-full border-collapse text-sm" aria-label={ariaLabel}>
          <thead>
            <tr className="border-b-2 border-slate-200" style={{ background: 'var(--color-primary-50)' }}>
              {columns.map((col) => (
                <th
                  key={col.key ?? col.label}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${col.headerClassName || ''}`}
                  scope="col"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <span className="text-4xl block mb-3">{typeof emptyIcon === 'string' ? emptyIcon : '📭'}</span>
                  <p className="text-sm font-medium text-slate-600">{emptyText}</p>
                  {emptySubtext && <p className="mt-1 text-xs text-slate-400">{emptySubtext}</p>}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row[keyField] ?? i}
                  className={[
                    'border-b border-slate-100 transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/80 focus-within:bg-slate-50/80' : '',
                  ].join(' ')}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key ?? col.label} className={`px-4 py-3 text-sm text-slate-700 ${col.className || ''}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className={`md:hidden space-y-3 ${className}`}>
        {isEmpty ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <span className="text-4xl block mb-3">{typeof emptyIcon === 'string' ? emptyIcon : '📭'}</span>
            <p className="text-sm font-medium text-slate-600">{emptyText}</p>
            {emptySubtext && <p className="mt-1 text-xs text-slate-400">{emptySubtext}</p>}
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={row[keyField] ?? i}
              className={[
                'rounded-xl border border-slate-200 bg-white p-4 space-y-2',
                onRowClick ? 'cursor-pointer hover-elevate active:scale-[0.99]' : '',
              ].join(' ')}
              onClick={() => onRowClick?.(row)}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
            >
              {columns.map((col) => (
                <div key={col.key ?? col.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0">{col.label}</span>
                  <span className="text-slate-700 text-right">
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
