// File: src/components/ui/ProgressBar.jsx

/**
 * Animated progress bar with color variants.
 *
 * Props:
 *   value: number (0-100)
 *   size: 'sm' | 'md' | 'lg'
 *   color: 'primary' | 'success' | 'warning' | 'danger' | 'auto'
 *   showLabel: boolean
 *   className: string
 */
export function ProgressBar({
  value = 0,
  size = 'md',
  color = 'auto',
  showLabel = false,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(100, value));

  const resolvedColor = color === 'auto'
    ? clamped >= 70 ? 'success' : clamped >= 30 ? 'warning' : 'danger'
    : color;

  const colorMap = {
    primary: 'var(--color-primary-500)',
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)',
    danger:  'var(--color-danger-500)',
  };

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 overflow-hidden rounded-full bg-slate-100 ${heights[size] || heights.md}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% hoàn thành`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: colorMap[resolvedColor] || colorMap.primary,
            transition: 'width var(--duration-normal) var(--ease-out)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
