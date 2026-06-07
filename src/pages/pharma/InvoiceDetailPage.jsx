// File: src/pages/pharma/InvoiceDetailPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, CreditCard, Package } from 'lucide-react';
import { SalesApi, CustomerApi, CatalogApi } from '../../apis';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

const CATALOG_BASE = SERVICE_URLS.catalog;
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

const fmt = (n) => n == null ? '0 ₫' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const STATUS_VARIANT = {
  DRAFT: 'gray', PENDING_RX_APPROVAL: 'warning', WAIT_PAYMENT: 'info', PAID: 'success', CANCELLED: 'danger',
};
const PAY_STATUS_VARIANT = {
  UNPAID: 'warning', PAID: 'success', REFUNDED: 'info', DEBT: 'danger',
};

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start py-2 border-b border-slate-100 last:border-0">
      <span className="w-40 shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{children}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inv,      setInv]      = useState(null);
  const [items,    setItems]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const medImageMap = useMemo(() => {
    const map = {};
    medicines.forEach(m => { if (m.id) map[m.id] = m.imageUrl || null; });
    return map;
  }, [medicines]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      SalesApi.getInvoice(id),
      SalesApi.getInvoiceItems(id).catch(() => []),
      SalesApi.getInvoicePayments(id).catch(() => []),
      CatalogApi.getMedicines().catch(() => []),
    ])
      .then(([invoice, ivItems, ivPayments, meds]) => {
        setInv(invoice);
        setItems(Array.isArray(ivItems) ? ivItems : []);
        setPayments(Array.isArray(ivPayments) ? ivPayments : []);
        setMedicines(Array.isArray(meds) ? meds : []);
        if (invoice?.customerId) {
          CustomerApi.getCustomer(invoice.customerId)
            .then(c => setCustomer(c))
            .catch(() => setCustomer(null));
        }
      })
      .catch(e => setError(e?.response?.data?.message || e?.message || 'Không tải được hóa đơn'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="py-16 text-center text-slate-500">Đang tải hóa đơn #{id}...</div>
  );
  if (error) return (
    <div className="alert alert-error mx-6 my-6">{error}</div>
  );
  if (!inv) return null;

  const paidPayments = payments.filter(p => p.status === 'SUCCESS');
  const paidAmount   = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const paymentMethod = paidPayments[0]?.paymentMethod || payments[0]?.paymentMethod || '—';

  const subtotal      = Number(inv.subtotal      || 0);
  const discount      = Number(inv.discount      || 0);
  const couponDiscount = Number(inv.couponDiscount|| 0);
  const shippingFee   = Number(inv.shippingFee   || 0);
  const total         = Number(inv.total         || 0);

  const itemColumns = [
    { key: 'medicineName', label: 'Thuốc', render: (it) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
          {resolveImageUrl(medImageMap[it.medicineId]) ? (
            <img src={resolveImageUrl(medImageMap[it.medicineId])} alt={it.medicineName}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <Package className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{it.medicineName || '—'}</div>
          <div className="text-[11px] text-slate-400">ID: {it.medicineId}</div>
        </div>
      </div>
    )},
    { key: 'unitPrice', label: 'Đơn giá', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (it) => fmt(it.unitPrice) },
    { key: 'qty', label: 'SL', className: 'text-right tabular-nums', headerClassName: 'text-right' },
    { key: 'lineTotal', label: 'Thành tiền', className: 'text-right font-bold tabular-nums', headerClassName: 'text-right', render: (it) => fmt(it.lineTotal) },
  ];

  const paymentColumns = [
    { key: 'idx', label: '#', render: (_, i) => i + 1 },
    { key: 'paymentMethod', label: 'Phương thức' },
    { key: 'amount', label: 'Số tiền', className: 'text-right font-bold tabular-nums', headerClassName: 'text-right', render: (p) => fmt(p.amount) },
    { key: 'paidAt', label: 'Thời gian', className: 'text-slate-500', render: (p) => fmtDate(p.paidAt) },
    { key: 'status', label: 'Trạng thái', render: (p) => {
      const v = p.status === 'SUCCESS' ? 'success' : p.status === 'PENDING' ? 'warning' : 'danger';
      return <Badge variant={v}>{p.status}</Badge>;
    }},
  ];

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <h2 className="flex-1 text-lg font-extrabold text-slate-900">Hóa đơn #{inv.id}</h2>
        <Badge variant={STATUS_VARIANT[inv.status] || 'gray'}>{inv.status}</Badge>
        <Badge variant={PAY_STATUS_VARIANT[inv.paymentStatus] || 'gray'}>{inv.paymentStatus}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Invoice info */}
        <Section icon={FileText} title="Thông tin hóa đơn">
          <InfoRow label="Mã hóa đơn"><span className="font-bold">{inv.code || `INV-${inv.id}`}</span></InfoRow>
          <InfoRow label="Trạng thái"><Badge variant={STATUS_VARIANT[inv.status] || 'gray'}>{inv.status}</Badge></InfoRow>
          <InfoRow label="Thanh toán"><Badge variant={PAY_STATUS_VARIANT[inv.paymentStatus] || 'gray'}>{inv.paymentStatus}</Badge></InfoRow>
          <InfoRow label="Phương thức TT">{paymentMethod}</InfoRow>
          <InfoRow label="Loại đơn">{inv.orderType || 'RETAIL'}</InfoRow>
          <InfoRow label="Kênh">{inv.channel || 'POS'}</InfoRow>
          <InfoRow label="Ngày tạo">{fmtDate(inv.createdAt)}</InfoRow>
          <InfoRow label="Ngày cập nhật">{fmtDate(inv.updatedAt)}</InfoRow>
          {inv.notes && <InfoRow label="Ghi chú">{inv.notes}</InfoRow>}
          {inv.couponCode && <InfoRow label="Mã coupon"><code className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">{inv.couponCode}</code></InfoRow>}
        </Section>

        <div className="space-y-5">
          {/* Customer */}
          <Section icon={User} title="Khách hàng">
            <InfoRow label="Tên KH"><span className="font-bold">{customer?.fullName || customer?.name || '(Khách vãng lai)'}</span></InfoRow>
            <InfoRow label="SĐT">{customer?.phone || '—'}</InfoRow>
            <InfoRow label="Địa chỉ">{customer?.address || '—'}</InfoRow>
            {inv.requiresShipping && (
              <>
                <InfoRow label="Địa chỉ giao">{inv.shippingAddress || '—'}</InfoRow>
                <InfoRow label="Trạng thái giao">{inv.shippingStatus || '—'}</InfoRow>
                {inv.trackingCode && <InfoRow label="Mã tracking">{inv.trackingCode}</InfoRow>}
              </>
            )}
          </Section>

          {/* Amounts */}
          <Section icon={CreditCard} title="Chi tiết thanh toán">
            <InfoRow label="Tạm tính">{fmt(subtotal)}</InfoRow>
            {discount > 0 && <InfoRow label="Giảm giá (%)">-{fmt(discount)}</InfoRow>}
            {couponDiscount > 0 && <InfoRow label="Giảm giá coupon">-{fmt(couponDiscount)}</InfoRow>}
            {shippingFee > 0 && <InfoRow label="Phí vận chuyển">{fmt(shippingFee)}</InfoRow>}
            <InfoRow label="Tổng cộng"><span className="text-base font-extrabold text-blue-600">{fmt(total)}</span></InfoRow>
            <InfoRow label="Đã thanh toán"><span className={`font-bold ${paidAmount >= total ? 'text-emerald-600' : 'text-amber-600'}`}>{fmt(paidAmount)}</span></InfoRow>
            {paidAmount > 0 && paidAmount < total && (
              <InfoRow label="Còn lại"><span className="font-bold text-red-600">{fmt(total - paidAmount)}</span></InfoRow>
            )}
          </Section>
        </div>
      </div>

      {/* Items */}
      <Section icon={Package} title={`Sản phẩm (${items.length})`}>
        <DataTable columns={itemColumns} rows={items} loading={false} emptyText="Chưa có sản phẩm" />
      </Section>

      {/* Payments history */}
      {payments.length > 0 && (
        <Section icon={CreditCard} title={`Lịch sử thanh toán (${payments.length})`}>
          <DataTable columns={paymentColumns} rows={payments} loading={false} emptyText="Không có thanh toán" />
        </Section>
      )}
    </div>
  );
}
