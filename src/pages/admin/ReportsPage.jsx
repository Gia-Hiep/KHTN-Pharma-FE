// File: src/pages/admin/ReportsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Package,
  RefreshCw,
  Search,
  Trophy,
} from 'lucide-react';
import { ReportApi, InventoryApi } from '../../apis';
import { PageShell } from '../../components/ui';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const num = (n) => Number(n || 0).toLocaleString('vi-VN');
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const TABS = [
  { key: 'sales', label: 'Báo cáo bán hàng', icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
  { key: 'inventory', label: 'Tồn kho', icon: <Package className="h-4 w-4" aria-hidden="true" /> },
  { key: 'expiring', label: 'Sắp hết hạn', icon: <Clock className="h-4 w-4" aria-hidden="true" /> },
  { key: 'audit', label: 'Audit Logs', icon: <ClipboardList className="h-4 w-4" aria-hidden="true" /> },
];

const SOURCE_LABELS = {
  ALL: 'Tất cả',
  ONLINE: 'Online',
  POS: 'POS',
};

const PAYMENT_LABELS = {
  ALL: 'Tất cả',
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  REFUNDED: 'Hoàn tiền',
};

const ORDER_STATUS_LABELS = {
  ALL: 'Tất cả',
  PENDING_APPROVAL: 'Chờ duyệt',
  CONFIRMED: 'Đã duyệt',
  PICKING: 'Đang soạn',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
  DRAFT: 'Nháp',
  WAIT_PAYMENT: 'Chờ thanh toán',
  PAID: 'Hoàn tất',
};

const METHOD_LABELS = {
  COD: 'COD',
  STRIPE: 'Stripe',
  WALLET: 'Ví',
  BANK_TRANSFER: 'Chuyển khoản',
  ONLINE: 'Online',
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  POS: 'POS',
};

function labelOf(map, value) {
  if (!value) return 'Không rõ';
  return map[value] || value;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).replace('T', ' ').slice(0, 16);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('vi-VN');
}

function KpiCard({ label, value, color = 'blue', icon, onClick }) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  };
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'w-full rounded-2xl border px-4 py-4 text-left transition',
        colorMap[color] || colorMap.slate,
        onClick ? 'hover:shadow-sm active:scale-[0.99] focus-ring' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
        {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      </div>
      <div className="mt-2 text-xl font-extrabold leading-none">{value}</div>
    </Component>
  );
}

function StatusBadge({ type, value }) {
  const raw = value || 'UNKNOWN';
  let variant = 'gray';
  if (type === 'payment') {
    if (raw === 'PAID') variant = 'success';
    else if (raw === 'UNPAID') variant = 'warning';
    else if (raw === 'REFUNDED') variant = 'danger';
  } else if (type === 'order') {
    if (['DELIVERED', 'PAID', 'COMPLETED'].includes(raw)) variant = 'success';
    else if (['PENDING_APPROVAL', 'WAIT_PAYMENT', 'PICKING', 'PACKING', 'SHIPPING'].includes(raw)) variant = 'warning';
    else if (['REJECTED', 'CANCELLED', 'RETURNED'].includes(raw)) variant = 'danger';
    else if (raw === 'CONFIRMED') variant = 'info';
  } else if (type === 'source') {
    variant = raw === 'ONLINE' ? 'violet' : 'info';
  }
  const labels = type === 'payment' ? PAYMENT_LABELS : type === 'order' ? ORDER_STATUS_LABELS : SOURCE_LABELS;
  return <Badge variant={variant}>{labelOf(labels, raw)}</Badge>;
}

export function ReportsPage() {
  const [tab, setTab] = useState('sales');

  return (
    <PageShell variant="admin" title="Báo cáo & Thống kê">
      <div className="mb-6 flex flex-wrap gap-1.5">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              tab === key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === 'sales' && <SalesReportTab />}
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'expiring' && <ExpiringTab />}
      {tab === 'audit' && <AuditTab />}
    </PageShell>
  );
}

function SalesReportTab() {
  const [filters, setFilters] = useState({
    from: monthStart(),
    to: today(),
    source: 'ALL',
    paymentStatus: 'ALL',
    orderStatus: 'ALL',
    keyword: '',
  });
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const queryParams = useMemo(() => ({
    from: filters.from,
    to: filters.to,
    source: filters.source,
    paymentStatus: filters.paymentStatus,
  }), [filters.from, filters.to, filters.source, filters.paymentStatus]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderParams = {
        ...queryParams,
        orderStatus: filters.orderStatus,
        keyword: filters.keyword?.trim() || undefined,
      };
      const [summaryRes, orderRes, topRes] = await Promise.all([
        ReportApi.getAdminSummary(queryParams),
        ReportApi.getReportOrders(orderParams),
        ReportApi.getAdminTopProducts({ from: filters.from, to: filters.to, source: filters.source, limit: 8 }),
      ]);
      setSummary(summaryRes);
      setOrders(Array.isArray(orderRes) ? orderRes : []);
      setTopProducts(Array.isArray(topRes) ? topRes : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được báo cáo');
      setSummary(null);
      setOrders([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [
    filters.from,
    filters.to,
    filters.source,
    filters.paymentStatus,
    filters.orderStatus,
  ]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const applyFilters = (next) => setFilters(prev => ({ ...prev, ...next }));

  const openDetail = async (row) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await ReportApi.getReportOrderDetail(row.source, row.id);
      setDetail(res);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được chi tiết đơn');
    } finally {
      setDetailLoading(false);
    }
  };

  const dailyColumns = [
    { key: 'date', label: 'Ngày', className: 'font-medium', render: (r) => formatDate(r.date) },
    { key: 'totalOrders', label: 'Số đơn', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.totalOrders) },
    { key: 'totalOrderValue', label: 'Tổng giá trị', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.totalOrderValue) },
    { key: 'paidAmount', label: 'Đã thanh toán', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.paidAmount) },
    { key: 'unpaidAmount', label: 'Chưa thanh toán', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.unpaidAmount) },
    { key: 'cancelledOrRefundedOrders', label: 'Hủy/hoàn', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.cancelledOrRefundedOrders) },
  ];

  const orderColumns = [
    { key: 'code', label: 'Mã đơn', className: 'font-semibold text-slate-900' },
    { key: 'createdAt', label: 'Ngày tạo', className: 'whitespace-nowrap text-slate-500', render: (r) => formatDateTime(r.createdAt) },
    { key: 'source', label: 'Loại', render: (r) => <StatusBadge type="source" value={r.source} /> },
    { key: 'customerName', label: 'Khách hàng', render: (r) => r.customerName || '—' },
    { key: 'paymentMethod', label: 'Thanh toán', render: (r) => labelOf(METHOD_LABELS, r.paymentMethod) },
    { key: 'paymentStatus', label: 'TT tiền', render: (r) => <StatusBadge type="payment" value={r.paymentStatus} /> },
    { key: 'orderStatus', label: 'TT đơn', render: (r) => <StatusBadge type="order" value={r.orderStatus} /> },
    { key: 'itemCount', label: 'Số món', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.itemCount) },
    { key: 'total', label: 'Tổng tiền', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.total) },
    { key: 'action', label: '', className: 'text-right', render: (r) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openDetail(r); }}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        <Eye className="h-3.5 w-3.5" /> Xem
      </button>
    ) },
  ];

  const topColumns = [
    { key: 'rank', label: '#', className: 'font-bold text-amber-600', render: (r) => r.rank },
    { key: 'medicineName', label: 'Tên thuốc', className: 'font-semibold' },
    { key: 'totalQuantitySold', label: 'Số lượng', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.totalQuantitySold) },
    { key: 'totalRevenue', label: 'Doanh thu', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.totalRevenue) },
    { key: 'orderCount', label: 'Số đơn', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.orderCount) },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.4fr_auto]">
          <label className="text-xs font-semibold text-slate-500">
            Từ ngày
            <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} className="input mt-1 w-full py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Đến ngày
            <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} className="input mt-1 w-full py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Loại đơn
            <select value={filters.source} onChange={e => setFilter('source', e.target.value)} className="select mt-1 w-full py-2 text-sm">
              <option value="ALL">Tất cả</option>
              <option value="ONLINE">Online</option>
              <option value="POS">POS</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Thanh toán
            <select value={filters.paymentStatus} onChange={e => setFilter('paymentStatus', e.target.value)} className="select mt-1 w-full py-2 text-sm">
              <option value="ALL">Tất cả</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="REFUNDED">Hoàn tiền</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Trạng thái đơn
            <select value={filters.orderStatus} onChange={e => setFilter('orderStatus', e.target.value)} className="select mt-1 w-full py-2 text-sm">
              <option value="ALL">Tất cả</option>
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="CONFIRMED">Đã duyệt</option>
              <option value="DELIVERED">Đã giao</option>
              <option value="REJECTED">Từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="RETURNED">Trả hàng</option>
              <option value="PAID">POS hoàn tất</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Tìm kiếm
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={e => setFilter('keyword', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') load(); }}
                className="input w-full py-2 pl-9 text-sm"
                placeholder="Mã đơn, khách, thuốc"
              />
            </div>
          </label>
          <button onClick={load} disabled={loading} className="btn-primary mt-5 inline-flex items-center justify-center gap-1.5 py-2 text-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Tải lại
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Tổng giá trị đơn" value={fmt(summary?.totalOrderValue)} color="blue" icon={<CalendarDays className="h-5 w-5" />} />
        <KpiCard label="Đã thanh toán" value={fmt(summary?.paidAmount)} color="green" onClick={() => applyFilters({ paymentStatus: 'PAID', orderStatus: 'ALL' })} />
        <KpiCard label="Chưa thanh toán" value={fmt(summary?.unpaidAmount)} color="amber" onClick={() => applyFilters({ paymentStatus: 'UNPAID', orderStatus: 'ALL' })} />
        <KpiCard label="Tổng số đơn" value={num(summary?.totalOrders)} color="cyan" />
        <KpiCard label="Chờ dược sĩ duyệt" value={num(summary?.pendingApprovalOrders)} color="violet" onClick={() => applyFilters({ orderStatus: 'PENDING_APPROVAL', paymentStatus: 'ALL' })} />
        <KpiCard label="Hủy / hoàn tiền" value={num(summary?.cancelledOrRefundedOrders)} color="red" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Doanh thu theo ngày</h3>
        <DataTable
          columns={dailyColumns}
          rows={summary?.dailyBreakdown || []}
          loading={loading && !summary}
          emptyText="Không có dữ liệu theo ngày"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-700">Chi tiết đơn hàng</h3>
          <span className="text-xs font-medium text-slate-500">{num(orders.length)} đơn</span>
        </div>
        <DataTable
          columns={orderColumns}
          rows={orders}
          loading={loading && orders.length === 0}
          emptyText="Không có đơn hàng phù hợp"
          onRowClick={openDetail}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Sản phẩm bán chạy</h3>
        <DataTable
          columns={topColumns}
          rows={topProducts}
          loading={loading && topProducts.length === 0}
          emptyText="Chưa có sản phẩm bán chạy trong kỳ"
        />
      </div>

      <OrderDetailModal
        detail={detail}
        loading={detailLoading}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function OrderDetailModal({ detail, loading, onClose }) {
  const itemColumns = [
    { key: 'medicineName', label: 'Thuốc', className: 'font-semibold' },
    { key: 'qty', label: 'SL', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.qty) },
    { key: 'unitLabel', label: 'Đơn vị', render: (r) => r.unitLabel || '—' },
    { key: 'unitPrice', label: 'Đơn giá', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.unitPrice) },
    { key: 'lineTotal', label: 'Thành tiền', className: 'text-right font-semibold tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.lineTotal) },
  ];

  const paymentColumns = [
    { key: 'paymentMethod', label: 'Phương thức', render: (r) => labelOf(METHOD_LABELS, r.paymentMethod) },
    { key: 'status', label: 'Trạng thái', render: (r) => r.status || '—' },
    { key: 'amount', label: 'Số tiền', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.amount) },
    { key: 'transactionId', label: 'Mã giao dịch', className: 'font-mono text-xs', render: (r) => r.transactionId || '—' },
    { key: 'paidAt', label: 'Thời gian', className: 'whitespace-nowrap text-slate-500', render: (r) => formatDateTime(r.paidAt) },
  ];

  return (
    <Modal open={Boolean(detail) || loading} title={detail ? `Chi tiết ${detail.code}` : 'Chi tiết đơn hàng'} onClose={onClose} size="xl">
      {loading && !detail ? (
        <div className="py-12 text-center text-sm text-slate-500">Đang tải chi tiết...</div>
      ) : detail ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoBlock label="Mã đơn" value={detail.code} />
            <InfoBlock label="Loại đơn" value={<StatusBadge type="source" value={detail.source} />} />
            <InfoBlock label="Ngày tạo" value={formatDateTime(detail.createdAt)} />
            <InfoBlock label="Khách hàng" value={detail.customerName || '—'} />
            <InfoBlock label="Thanh toán" value={labelOf(METHOD_LABELS, detail.paymentMethod)} />
            <InfoBlock label="Trạng thái tiền" value={<StatusBadge type="payment" value={detail.paymentStatus} />} />
            <InfoBlock label="Trạng thái đơn" value={<StatusBadge type="order" value={detail.orderStatus} />} />
            <InfoBlock label="Dược sĩ xử lý" value={detail.processedBy ? `#${detail.processedBy}` : '—'} />
            <InfoBlock label="Mã giao dịch" value={detail.transactionId || '—'} />
          </div>

          {(detail.shippingAddress || detail.notes) && (
            <div className="grid gap-3 md:grid-cols-2">
              {detail.shippingAddress && <InfoBlock label="Địa chỉ giao hàng" value={detail.shippingAddress} />}
              {detail.notes && <InfoBlock label="Ghi chú" value={detail.notes} />}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <KpiCard label="Tạm tính" value={fmt(detail.subtotal)} color="slate" />
            <KpiCard label="Giảm giá" value={fmt(detail.discount)} color="amber" />
            <KpiCard label="Tổng tiền" value={fmt(detail.total)} color="green" />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold text-slate-700">Sản phẩm trong đơn</h4>
            <DataTable columns={itemColumns} rows={detail.items || []} emptyText="Không có sản phẩm" />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold text-slate-700">Thanh toán</h4>
            <DataTable columns={paymentColumns} rows={detail.payments || []} emptyText="Chưa có giao dịch thanh toán" />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function InventoryTab() {
  const [lowStock, setLowStock] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      InventoryApi.getLowStockAlerts().catch(() => []),
      InventoryApi.getSummary().catch(() => []),
    ])
      .then(([ls, sm]) => {
        setLowStock(Array.isArray(ls) ? ls : []);
        setSummary(Array.isArray(sm) ? sm : []);
      })
      .catch(e => setError(e?.message || 'Không tải được tồn kho'))
      .finally(() => setLoading(false));
  }, []);

  const outOfStock = summary.filter(s => Number(s.availableQty ?? 0) <= 0);
  const lowStockColumns = [
    { key: 'medicineName', label: 'Thuốc', className: 'font-semibold', render: (r) => r.medicineName || '—' },
    { key: 'currentQty', label: 'Tồn kho', className: 'text-right font-bold text-amber-600 tabular-nums', headerClassName: 'text-right', render: (r) => num(r.currentQty ?? r.availableQty) },
    { key: 'threshold', label: 'Ngưỡng', className: 'text-right text-slate-500 tabular-nums', headerClassName: 'text-right', render: (r) => num(r.threshold) },
  ];
  const outOfStockColumns = [
    { key: 'medicineName', label: 'Thuốc', className: 'font-semibold', render: (r) => r.medicineName || '—' },
    { key: 'totalQty', label: 'Tổng', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => num(r.totalQty) },
    { key: 'availableQty', label: 'Khả dụng', className: 'text-right font-bold text-red-600 tabular-nums', headerClassName: 'text-right', render: (r) => num(r.availableQty) },
  ];

  return (
    <div className="space-y-5">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard label="Tổng sản phẩm" value={num(summary.length)} color="blue" icon={<Box className="h-5 w-5" />} />
        <KpiCard label="Tồn kho thấp" value={num(lowStock.length)} color="amber" />
        <KpiCard label="Hết hàng" value={num(outOfStock.length)} color="red" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-700">Tồn kho thấp</h3>
          <DataTable columns={lowStockColumns} rows={lowStock} loading={loading} emptyText="Không có cảnh báo tồn kho thấp" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-700">Hết hàng</h3>
          <DataTable columns={outOfStockColumns} rows={outOfStock} loading={loading} emptyText="Không có thuốc hết hàng" />
        </div>
      </div>
    </div>
  );
}

function ExpiringTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const before = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    InventoryApi.getExpiryAlerts(before)
      .then(res => setData(Array.isArray(res) ? res : []))
      .catch(e => setError(e?.message || 'Không tải được lô sắp hết hạn'))
      .finally(() => setLoading(false));
  }, []);

  const calcDays = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  };

  const columns = [
    { key: 'medicineName', label: 'Thuốc', className: 'font-semibold', render: (r) => r.medicineName || '—' },
    { key: 'lotNumber', label: 'Lô', className: 'font-mono text-xs' },
    { key: 'qty', label: 'SL', className: 'text-right font-bold tabular-nums', headerClassName: 'text-right', render: (r) => num(r.qty) },
    { key: 'expiryDate', label: 'Hạn dùng', className: 'text-slate-500', render: (r) => r.expiryDate ? String(r.expiryDate).substring(0, 10) : '—' },
    { key: 'daysLeft', label: 'Còn ngày', className: 'text-right font-bold tabular-nums', headerClassName: 'text-right', render: (r) => {
      const days = calcDays(r.expiryDate);
      if (days == null) return '—';
      const color = days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-slate-500';
      return <span className={color}>{days}</span>;
    } },
  ];

  return (
    <div className="space-y-5">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DataTable columns={columns} rows={data} loading={loading} emptyText="Không có thuốc sắp hết hạn" />
      </div>
    </div>
  );
}

function AuditTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = () => {
    setLoading(true);
    ReportApi.getAuditLogs({ page, size: 20 })
      .then(res => setData(Array.isArray(res) ? res : res?.content ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [page]);

  const columns = [
    { key: 'timestamp', label: 'Thời gian', className: 'whitespace-nowrap text-xs text-slate-500', render: (r) => formatDateTime(r.timestamp || r.createdAt) },
    { key: 'action', label: 'Action', className: 'font-semibold', render: (r) => r.action || r.actionType || '—' },
    { key: 'entity', label: 'Entity', render: (r) => `${r.entityType || '—'} #${r.entityId || ''}` },
    { key: 'user', label: 'User', render: (r) => r.username || r.performedBy || '—' },
    { key: 'details', label: 'Chi tiết', className: 'max-w-[260px] truncate text-slate-500', render: (r) => r.details || r.description || '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DataTable columns={columns} rows={data} loading={loading} emptyText="Không có audit logs" />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Trước
        </button>
        <span className="text-sm text-slate-500">Trang {page + 1}</span>
        <button
          disabled={data.length < 20}
          onClick={() => setPage(p => p + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
