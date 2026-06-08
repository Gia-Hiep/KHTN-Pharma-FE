
export function Skeleton({ className = '', lines = 1 }) {
  if (lines === 1) {
    return <div className={`animate-pulse rounded-lg bg-slate-200 h-4 ${className}`} aria-hidden="true" />;
  }
  return (
    <div className={`space-y-2.5 ${className}`} role="status" aria-label="Đang tải">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-slate-200 h-4" aria-hidden="true"
          style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`} role="status" aria-label="Đang tải">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-2/3 rounded-lg bg-slate-200" aria-hidden="true" />
        <div className="h-3 w-full rounded bg-slate-200" aria-hidden="true" />
        <div className="h-3 w-4/5 rounded bg-slate-200" aria-hidden="true" />
        <div className="h-8 w-1/3 rounded-lg bg-slate-200 mt-4" aria-hidden="true" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden ${className}`} role="status" aria-label="Đang tải bảng dữ liệu">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3 flex gap-4" style={{ background: 'var(--color-primary-50)' }}>
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="animate-pulse h-3 rounded bg-slate-200 flex-1" aria-hidden="true" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="px-4 py-3 border-b border-slate-100 flex gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="animate-pulse h-3.5 rounded bg-slate-200 flex-1" aria-hidden="true"
              style={{ width: c === 0 ? '40%' : '100%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
