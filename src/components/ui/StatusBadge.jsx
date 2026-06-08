
/**
 * Reusable status badge with color-coded variants.
 *
 * Usage:
 *   <StatusBadge status="CONFIRMED" map={ORDER_STATUS_MAP} />
 *
 * Map format:
 *   { CONFIRMED: { label: 'Đã duyệt', color: 'success' } }
 *
 * Colors: success, warning, danger, info, neutral, violet
 */

const COLOR_MAP = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
  violet:  'bg-violet-100 text-violet-700',
};

export function StatusBadge({ status, map = {}, size = 'sm', className = '' }) {
  const entry = map[status] || { label: status, color: 'neutral' };
  const colorClass = COLOR_MAP[entry.color] || COLOR_MAP.neutral;
  const sizeClass = size === 'xs'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${colorClass} ${className}`}>
      {entry.label}
    </span>
  );
}

/* ─── Common status maps ─────────────────────────────────────────────── */

export const ORDER_STATUS_MAP = {
  PENDING_APPROVAL:  { label: 'Chờ duyệt',       color: 'warning' },
  CONFIRMED:         { label: 'Đã duyệt',        color: 'info' },
  PICKING:           { label: 'Đang lấy hàng',   color: 'info' },
  PICKED:            { label: 'Đã lấy hàng',     color: 'info' },
  SHIPPING:          { label: 'Đang giao',        color: 'violet' },
  DELIVERED:         { label: 'Đã giao',          color: 'success' },
  CANCELLED:         { label: 'Đã hủy',           color: 'danger' },
  RETURNED:          { label: 'Đã hoàn',          color: 'danger' },
  COMPLETED:         { label: 'Hoàn tất',         color: 'success' },
};

export const PAYMENT_STATUS_MAP = {
  UNPAID:    { label: 'Chưa TT',      color: 'warning' },
  PAID:      { label: 'Đã TT',        color: 'success' },
  REFUNDED:  { label: 'Hoàn tiền',    color: 'danger' },
  PARTIAL:   { label: 'TT 1 phần',    color: 'info' },
};

export const PO_STATUS_MAP = {
  DRAFT:     { label: 'Nháp',         color: 'neutral' },
  SUBMITTED: { label: 'Đã gửi',       color: 'info' },
  RECEIVED:  { label: 'Đã nhận',      color: 'success' },
  CANCELLED: { label: 'Đã hủy',       color: 'danger' },
};
