import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { OrderApi } from '../../apis/order.api';
import { StatusBadge, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '../../components/ui/StatusBadge';
import { PageShell, EmptyState, Button } from '../../components/ui';
import { SkeletonCard } from '../../components/ui/Skeleton';

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// Extend the default maps with extra buyer statuses
const BUYER_ORDER_MAP = {
  ...ORDER_STATUS_MAP,
  PICKING:   { label: 'Đang soạn',     color: 'violet' },
  PACKING:   { label: 'Đang đóng gói', color: 'info' },
  REJECTED:  { label: 'Bị từ chối',    color: 'danger' },
  RETURNED:  { label: 'Hoàn trả',      color: 'warning' },
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    OrderApi.myOrders()
      .then(setOrders)
      .catch(e => setErr(e?.message || 'Không tải được danh sách đơn'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <PageShell
      variant="buyer"
      title="Đơn hàng của tôi"
      actions={
        <Link to="/shop/medicines" className="btn-primary" aria-label="Đặt hàng mới">
          + Đặt hàng mới
        </Link>
      }
    >
      {/* Error */}
      {err && (
        <div className="alert alert-error flex items-center justify-between" role="alert">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {err}
          </span>
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className="h-3.5 w-3.5" />} aria-label="Thử lại">
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !orders.length ? (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon={ShoppingBag}
              title="Bạn chưa có đơn hàng nào"
              subtitle="Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên."
              action={
                <Link to="/shop/medicines" className="btn-primary inline-flex" aria-label="Bắt đầu mua hàng">
                  Bắt đầu mua ngay →
                </Link>
              }
            />
          </div>
        </div>
      ) : (
        /* Order List */
        <div className="space-y-3">
          {orders.map(o => (
            <Link
              key={o.id}
              to={`/shop/orders/${o.id}`}
              className="card block p-4 hover-elevate md:p-5"
              aria-label={`Đơn hàng #${o.id}`}
            >
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {/* Order ID */}
                <div className="text-lg font-extrabold" style={{ color: 'var(--color-primary-600)' }}>#{o.id}</div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{o.items?.length || 0} sản phẩm</div>
                  <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>

                {/* Total */}
                <div className="font-bold text-slate-900">{fmt(o.total)}</div>

                {/* Payment badge */}
                {o.paymentStatus && (
                  <StatusBadge status={o.paymentStatus} map={PAYMENT_STATUS_MAP} size="xs" />
                )}

                {/* Status badge */}
                <StatusBadge status={o.status} map={BUYER_ORDER_MAP} />

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
