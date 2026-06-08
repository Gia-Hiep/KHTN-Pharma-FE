
export function Card({ children, header, footer, className = '', hoverable = false, highlight = false, onClick, ...props }) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        hoverable ? 'hover-elevate cursor-pointer' : '',
        highlight ? 'border-primary-200 bg-primary-50/30' : '',
        className,
      ].join(' ')}
      style={{ transition: 'all var(--duration-fast) var(--ease-out)' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {header && (
        <div className="border-b border-slate-200 px-4 py-3 md:px-6 md:py-4">
          {typeof header === 'string' ? (
            <h3 className="text-base font-semibold text-slate-900">{header}</h3>
          ) : header}
        </div>
      )}
      {children}
      {footer && (
        <div className="border-t border-slate-200 px-4 py-3 md:px-6 md:py-4">
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 md:p-6 ${className}`}>{children}</div>;
}
