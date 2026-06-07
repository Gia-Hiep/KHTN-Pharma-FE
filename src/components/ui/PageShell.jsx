// File: src/components/ui/PageShell.jsx
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VARIANT_STYLES = {
  buyer: { accent: 'var(--color-buyer)' },
  pharma: { accent: 'var(--color-pharma)' },
  admin: { accent: 'var(--color-admin)' },
};

/**
 * Reusable page shell with consistent padding, breadcrumbs, title, and enter animation.
 *
 * Props:
 *   variant: 'buyer' | 'pharma' | 'admin'
 *   title: string
 *   subtitle: string
 *   breadcrumbs: [{ label, to }] — last item is current page (no link)
 *   actions: ReactNode — buttons shown next to title
 *   children: page content
 *   className: string
 */
export function PageShell({
  variant = 'buyer',
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
  className = '',
}) {
  return (
    <motion.div
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />}
                {isLast ? (
                  <span className="font-semibold text-slate-900" aria-current="page">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="font-medium text-slate-500 transition-colors hover:text-slate-700"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Page header */}
      {(title || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1
                className="text-2xl font-extrabold tracking-tight text-slate-900"
                style={{ fontSize: 'var(--font-size-display)' }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {/* Page content */}
      {children}
    </motion.div>
  );
}
