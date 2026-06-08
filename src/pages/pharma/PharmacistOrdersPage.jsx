import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { OrderApi } from '../../apis/order.api';
import { StatusBadge, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '../../components/ui/StatusBadge';
import { DataTable } from '../../components/ui/DataTable';
import { PageShell } from '../../components/ui';

const fmt = (n) =>
  n == null ? '-' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const PHARMA_ORDER_MAP = {
  ...ORDER_STATUS_MAP,
  PICKING: { label: 'Đang soạn', color: 'violet' },
  PACKING: { label: 'Đóng gói', color: 'info' },
  REJECTED: { label: 'Từ chối', color: 'danger' },
  RETURNED: { label: 'Hoàn trả', color: 'warning' },
};

const TABS = ['ALL', 'PENDING_APPROVAL', 'CONFIRMED', 'PICKING', 'PACKING', 'SHIPPING', 'DELIVERED', 'RETURNED', 'REJECTED'];
const TAB_LABEL = {
  ALL: 'Tất cả',
  ...Object.fromEntries(Object.entries(PHARMA_ORDER_MAP).map(([key, value]) => [key, value.label])),
};

export function OrdersManagePage() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    setErr(null);
    OrderApi.pharmacistAllOrders()
      .then((data) => setAllOrders(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.message || 'Không tải được danh sách đơn'))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === 'ALL' ? allOrders : allOrders.filter((order) => order.status === filter);

  const columns = [
    { key: 'id', label: 'Mã', className: 'font-bold w-16', render: (row) => <span className="text-teal-600">{`#${row.id}`}</span> },
    {
      key: 'buyerName',
      label: 'Khách hàng',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.buyerName || `KH #${row.buyerId}`}</div>
          <div className="text-xs text-slate-500">{row.items?.length || 0} SP • {row.shippingAddress?.substring(0, 30) || '-'}</div>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Tổng',
      className: 'text-right font-bold whitespace-nowrap tabular-nums',
      headerClassName: '!text-right',
      render: (row) => <span className="block text-right">{fmt(row.total)}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      className: 'text-center',
      render: (row) =>
        row.paymentStatus ? <StatusBadge status={row.paymentStatus} map={PAYMENT_STATUS_MAP} size="xs" /> : '-',
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      className: 'whitespace-nowrap text-xs text-slate-500',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '-'),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      className: 'text-center',
      render: (row) => <StatusBadge status={row.status} map={PHARMA_ORDER_MAP} />,
    },
  ];

  return (
    <PageShell variant="pharma" title="Quản lý đơn hàng" subtitle={`${allOrders.length} đơn hàng`}>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((status) => {
          const count = status === 'ALL' ? allOrders.length : allOrders.filter((order) => order.status === status).length;
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                active ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
              style={active ? { background: 'var(--color-pharma)' } : {}}
            >
              {TAB_LABEL[status] || status} ({count})
            </button>
          );
        })}
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {err}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={visible}
        loading={loading}
        keyField="id"
        emptyIcon=" "
        emptyText="Chưa có đơn hàng nào"
        emptySubtext="Đơn hàng từ khách hàng sẽ hiển thị tại đây"
        onRowClick={(row) => {
          window.location.href = `/pharma/orders/${row.id}`;
        }}
      />
    </PageShell>
  );
}
