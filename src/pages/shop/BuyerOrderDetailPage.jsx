import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, Truck, CreditCard, MapPin, FileText, RotateCcw, XCircle, CheckCircle2 } from 'lucide-react';
import { CatalogApi } from '../../apis';
import { OrderApi } from '../../apis/order.api';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { PageShell, Card, CardBody, Timeline, Button, Badge } from '../../components/ui';

const CATALOG_BASE = SERVICE_URLS.catalog;

const getMedicinesSafe = () => CatalogApi.getMedicinesSilent().catch(() => []);

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const STEPS = ['PENDING_APPROVAL', 'CONFIRMED', 'PICKING', 'PACKING', 'SHIPPING', 'DELIVERED'];

const STEP_LABEL = {
  PENDING_APPROVAL: 'Chờ duyệt',
  CONFIRMED: 'Đã xác nhận',
  PICKING: 'Soạn hàng',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Hoàn trả',
};

const PAYMENT_LABEL = {
  COD: 'COD — Thanh toán khi nhận hàng',
  CASH: 'COD — Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản / QR VietQR',
  ONLINE: 'Online',
  STRIPE: 'Thẻ quốc tế (Stripe)',
  WALLET: 'Ví PharmaCare',
  VNPAY: 'Thẻ quốc tế (Stripe)',
  MOMO: 'Ví MoMo (Stripe)',
};

const PAYMENT_STATUS_BADGE = {
  UNPAID: { label: 'Chưa thanh toán', cls: 'bg-red-100 text-red-700' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-100 text-emerald-700' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'bg-orange-100 text-orange-700' },
};

const SALE_MODE_LABEL = {
  RETAIL: 'Giá lẻ',
  WHOLESALE: 'Giá sỉ',
};

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Đang tải">
      <div className="skeleton-text w-32" aria-hidden="true" />
      <div className="card">
        <div className="card-body space-y-4">
          <div className="skeleton-text h-6 w-1/3" aria-hidden="true" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded-full" aria-hidden="true" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton-text h-4 w-1/2" aria-hidden="true" />
                  <div className="skeleton-text h-3 w-1/4" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [acting, setActing] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const medImageMap = useMemo(() => {
    const map = {};
    medicines.forEach((medicine) => {
      if (medicine.id) map[medicine.id] = medicine.imageUrl || null;
    });
    return map;
  }, [medicines]);

  const reload = useCallback(() => {
    setLoading(true);
    setErr(null);
    Promise.all([OrderApi.myOrderDetail(id), getMedicinesSafe()])
      .then(([orderData, medicineList]) => {
        setOrder(orderData);
        setMedicines(Array.isArray(medicineList) ? medicineList : []);
      })
      .catch((error) => setErr(error?.message || 'Không tải được đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <DetailSkeleton />;

  if (err || !order) {
    return (
      <PageShell variant="buyer">
        <Card>
          <CardBody className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Không tải được đơn hàng</h3>
            <p className="mt-2 text-sm text-slate-500">{err}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={reload} aria-label="Thử lại">Thử lại</Button>
              <Link to="/shop/orders" className="btn-secondary" aria-label="Quay lại danh sách">
                ← Quay lại
              </Link>
            </div>
          </CardBody>
        </Card>
      </PageShell>
    );
  }

  const isTerminal = ['REJECTED', 'CANCELLED', 'RETURNED'].includes(order.status);
  const isDelivered = order.status === 'DELIVERED';
  const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'CASH';
  const paymentBadge = PAYMENT_STATUS_BADGE[order.paymentStatus];

  // Build timeline steps with timestamps
  const getTimestamp = (step) => {
    const map = {
      PENDING_APPROVAL: order.createdAt,
      CONFIRMED: order.confirmedAt,
      PICKING: order.pickingAt,
      PACKING: order.packingAt,
      SHIPPING: order.shippedAt,
      DELIVERED: order.deliveredAt,
    };
    return map[step]
      ? new Date(map[step]).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
      })
      : null;
  };

  const timelineSteps = STEPS.map((step) => ({
    key: step,
    label: STEP_LABEL[step],
    timestamp: getTimestamp(step),
  }));

  return (
    <PageShell
      variant="buyer"
      breadcrumbs={[
        { label: 'Đơn hàng', to: '/shop/orders' },
        { label: `#${order.id}` },
      ]}
    >
      {/* ── Header ── */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Đơn hàng <span style={{ color: 'var(--color-primary-600)' }}>#{order.id}</span>
            </h1>
            <div className="flex items-center gap-2">
              {paymentBadge && <span className={`badge ${paymentBadge.cls}`}>{paymentBadge.label}</span>}
              <span
                className={`badge ${
                  isTerminal ? 'bg-red-100 text-red-700' : isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {STEP_LABEL[order.status]}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Timeline (vertical) ── */}
      {!isTerminal && (
        <Card header="Tiến trình đơn hàng">
          <CardBody>
            <Timeline steps={timelineSteps} currentKey={order.status} />
          </CardBody>
        </Card>
      )}

      {/* ── Rejection/Return/Shipping alerts ── */}
      {order.rejectionReason && (
        <div className="alert alert-error flex items-center gap-2" role="alert">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Lý do từ chối: <strong>{order.rejectionReason}</strong></span>
        </div>
      )}

      {/* Refund notification */}
      {order.paymentStatus === 'REFUNDED' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-800">Đã hoàn tiền vào ví</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Số tiền <strong>{fmt(order.total)}</strong> đã được hoàn vào ví PharmaCare của bạn.
              <Link to="/shop/wallet" className="ml-1 font-semibold text-amber-900 underline hover:no-underline">
                Xem ví →
              </Link>
            </div>
          </div>
        </div>
      )}

      {order.status === 'RETURNED' && (
        <div className="alert alert-warning flex items-center gap-2" role="alert">
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Đơn đã hoàn trả</strong>
            {order.returnReason && <span> — {order.returnReason}</span>}
          </span>
        </div>
      )}

      {order.carrier && (
        <div className="alert alert-success flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{order.carrier}</strong>
            {order.trackingCode && <span> • Mã vận đơn: <strong>{order.trackingCode}</strong></span>}
            {order.shippedAt && <span> • Giao lúc: {new Date(order.shippedAt).toLocaleString('vi-VN')}</span>}
          </span>
        </div>
      )}

      {/* ── Delivery confirmation ── */}
      {isDelivered && (
        <Card highlight>
          <CardBody>
            <div className="flex items-center gap-2 text-lg font-bold text-emerald-800">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Đơn hàng đã giao thành công
            </div>
            {order.deliveredAt && (
              <div className="mt-1 text-xs text-slate-500">
                Giao lúc: {new Date(order.deliveredAt).toLocaleString('vi-VN')}
              </div>
            )}

            {!order.buyerConfirmed ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="font-bold text-amber-800 flex items-center gap-2">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  Xác nhận đã nhận hàng
                </div>
                <div className="mt-1 text-sm text-amber-700">
                  Bạn đã nhận được hàng chưa? Xác nhận để hoàn tất đơn hàng.
                </div>
                <Button
                  variant="success"
                  loading={acting}
                  className="mt-3"
                  onClick={async () => {
                    if (!window.confirm('Xác nhận bạn đã nhận được hàng?')) return;
                    setActing(true);
                    try {
                      setOrder(await OrderApi.buyerConfirmReceived(id));
                      toast.success('Đã xác nhận nhận hàng');
                    } catch (error) {
                      toast.error(error?.message || 'Không thể xác nhận');
                    } finally {
                      setActing(false);
                    }
                  }}
                  aria-label="Xác nhận đã nhận hàng"
                >
                  Đã nhận được hàng
                </Button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-100 p-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Bạn đã xác nhận nhận hàng
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Products ── */}
      <Card header="Sản phẩm">
        <CardBody>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-3 py-3 text-sm">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {resolveImageUrl(medImageMap[item.medicineId]) ? (
                    <img
                      src={resolveImageUrl(medImageMap[item.medicineId])}
                      alt={item.medicineName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`${resolveImageUrl(medImageMap[item.medicineId]) ? 'hidden' : 'flex'} h-full w-full items-center justify-center`}
                  >
                    <Package className="h-5 w-5 text-slate-300" aria-hidden="true" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800">
                    {item.medicineName} × <span className="font-semibold">{item.qty}</span> {item.unitLabel || ''}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {fmt(item.unitPrice)} / {item.unitLabel || 'đơn vị'} · {SALE_MODE_LABEL[item.saleMode || item.priceTier] || item.saleMode || item.priceTier || 'RETAIL'}
                  </div>
                  {item.conversionFactor > 1 && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      1 {item.unitLabel || item.unitCode} = {item.conversionFactor} đơn vị gốc
                    </div>
                  )}
                </div>

                <span className="font-bold text-slate-900 shrink-0">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-4">
            <span className="text-base font-bold text-slate-900">Tổng:</span>
            <span className="ml-3 text-xl font-extrabold" style={{ color: 'var(--color-primary-600)' }}>{fmt(order.total)}</span>
          </div>
        </CardBody>
      </Card>

      {/* ── Order info ── */}
      <Card header="Thông tin đơn hàng">
        <CardBody className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="ml-1 font-semibold text-slate-900">{order.shippingAddress || '—'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500">Thanh toán:</span>
                <span className="ml-1 font-semibold text-slate-900">
                  {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod || '—'}
                </span>
                {' — '}
                {order.paymentStatus === 'PAID' && <span className="font-semibold text-emerald-600">Đã thanh toán</span>}
                {order.paymentStatus === 'UNPAID' && isCOD && <span className="text-amber-600">Thu khi giao hàng</span>}
                {order.paymentStatus === 'UNPAID' && !isCOD && <span className="text-red-600">Chưa thanh toán</span>}
                {order.paymentStatus === 'REFUNDED' && <span className="text-orange-600">Đã hoàn tiền</span>}
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500">Ghi chú:</span> <span className="text-slate-900">{order.notes}</span>
              </div>
            </div>
          )}
          {order.couponCode && (
            <div>
              <span className="text-slate-500">Coupon:</span>{' '}
              <span className="font-semibold" style={{ color: 'var(--color-primary-600)' }}>{order.couponCode}</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {order.status === 'PENDING_APPROVAL' && (
          <Button
            variant="danger"
            loading={acting}
            onClick={async () => {
              if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
              setActing(true);
              try {
                setOrder(await OrderApi.cancelOrder(id));
                toast.success('Đã hủy đơn hàng');
              } catch (error) {
                toast.error(error?.response?.data?.message || error?.message || 'Không thể hủy đơn');
              } finally {
                setActing(false);
              }
            }}
            aria-label="Hủy đơn hàng"
          >
            Hủy đơn hàng
          </Button>
        )}

        {!isTerminal && !isDelivered && (
          <Button variant="secondary" onClick={reload} aria-label="Cập nhật trạng thái đơn hàng">
            Cập nhật trạng thái
          </Button>
        )}
      </div>
    </PageShell>
  );
}
