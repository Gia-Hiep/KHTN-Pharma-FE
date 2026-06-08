
/**
 * Container for search inputs, selects, and filter buttons.
 * Children are rendered in a responsive flex row.
 *
 * Usage:
 *   <FilterBar>
 *     <input ... />
 *     <select ... />
 *     <Button>Search</Button>
 *   </FilterBar>
 */
export function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end gap-3 mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Labeled filter field wrapper.
 *
 * Usage:
 *   <FilterField label="Tìm kiếm">
 *     <input className="input" ... />
 *   </FilterField>
 */
export function FilterField({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-slate-500">{label}</label>}
      {children}
    </div>
  );
}
