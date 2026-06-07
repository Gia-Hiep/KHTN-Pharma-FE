// File: src/components/ui/EmptyState.jsx
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  icon,
  title = 'Không có dữ liệu',
  subtitle,
  action,
  className = '',
}) {
  const IconComponent = icon || null;

  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--color-primary-50)' }}
      >
        {IconComponent ? (
          typeof IconComponent === 'string' ? (
            <span className="text-4xl">{IconComponent}</span>
          ) : (
            <IconComponent className="h-8 w-8" style={{ color: 'var(--color-primary-500)' }} />
          )
        ) : (
          <PackageOpen className="h-8 w-8" style={{ color: 'var(--color-primary-500)' }} />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500 max-w-xs text-center">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
