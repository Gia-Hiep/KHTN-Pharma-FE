// File: src/components/ui/Button.jsx
import { Loader2 } from 'lucide-react';

const VARIANT_CLASS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  success:   'btn-success',
  warning:   'btn-warning',
  ghost:     'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-ring',
  outline:   'btn-outline',
};

const SIZE_CLASS = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) {
  const base = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const sizeClass = SIZE_CLASS[size] || '';

  return (
    <button
      className={`${base} ${sizeClass} ${className}`}
      disabled={loading || props.disabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
