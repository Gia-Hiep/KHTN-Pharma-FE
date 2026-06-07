// File: src/components/ui/Badge.jsx

const VARIANTS = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  gray:    'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-600',
  violet:  'bg-violet-100 text-violet-700',
};

export function Badge({ variant = 'gray', children, className = '' }) {
  const colorClass = VARIANTS[variant] || VARIANTS.gray;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass} ${className}`}>
      {children}
    </span>
  );
}
