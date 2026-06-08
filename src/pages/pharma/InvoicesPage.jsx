import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalesApi, CustomerApi } from '../../apis';
import { useAsync } from '../../hooks/useAsync';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { FilterBar, FilterField } from '../../components/ui/FilterBar';
import { Alert } from '../../components/ui/Alert';

const INVOICE_STATUS_MAP = {
  DRAFT:                 { label: 'Nháp',        color: 'neutral' },
  PENDING_RX_APPROVAL:   { label: 'Chờ duyệt RX', color: 'warning' },
  WAIT_PAYMENT:          { label: 'Chờ TT',      color: 'info' },
  PAID:                  { label: 'Đã TT',       color: 'success' },
  CANCELLED:             { label: 'Đã hủy',      color: 'danger' },
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [custMap, setCustMap] = useState({});
  const { data, loading, error, run } = useAsync(SalesApi.getInvoices);

  useEffect(() => { run({}); }, [run]);
  useEffect(() => {
    CustomerApi.getCustomers()
      .then(res => {
        const map = {};
        if (Array.isArray(res)) res.forEach(c => map[c.id] = c.fullName || c.name);
        setCustMap(map);
      }).catch(() => {});
  }, []);

  const doFilter = () => run({ status: status || undefined });

  const columns = [
    { key: 'id', label: 'ID', className: 'w-14 font-semibold text-slate-500' },
    { key: 'code', label: 'Mã HĐ', className: 'font-mono font-semibold' },
    { key: 'customerName', label: 'Khách hàng', render: r =>
      r.customerId ? (custMap[r.customerId] || `ID: ${r.customerId}`) : '(Khách vãng lai)'
    },
    { key: 'total', label: 'Tổng tiền', className: 'text-right font-bold whitespace-nowrap', render: r =>
      (r.total || 0).toLocaleString('vi-VN') + '₫'
    },
    { key: 'status', label: 'Trạng thái', className: 'text-center', render: r =>
      <StatusBadge status={r.status} map={INVOICE_STATUS_MAP} />
    },
    { key: 'paymentStatus', label: 'Thanh toán', className: 'text-center', render: r =>
      <StatusBadge status={r.paymentStatus} map={{ PAID: { label: 'Đã TT', color: 'success' }, UNPAID: { label: 'Chưa TT', color: 'warning' } }} />
    },
    { key: 'createdAt', label: 'Ngày tạo', className: 'text-xs text-slate-500 whitespace-nowrap', render: r =>
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'
    },
    { key: '_actions', label: '', render: r => (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/pharma/invoices/${r.id}`); }}>Xem</Button>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Hóa đơn nội bộ"
        actions={<Button onClick={() => navigate('/pharma/invoices/new')}>+ Tạo hóa đơn</Button>} />

      <FilterBar>
        <FilterField label="Trạng thái">
          <select className="select min-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {['DRAFT', 'PENDING_RX_APPROVAL', 'WAIT_PAYMENT', 'PAID', 'CANCELLED'].map(s => (
              <option key={s} value={s}>{INVOICE_STATUS_MAP[s]?.label || s}</option>
            ))}
          </select>
        </FilterField>
        <Button onClick={doFilter} loading={loading} size="sm">Lọc</Button>
      </FilterBar>

      {error && <Alert variant="error">Lỗi: {error}</Alert>}

      <DataTable
        columns={columns}
        rows={Array.isArray(data) ? data : []}
        loading={loading}
        emptyText={`Không có hóa đơn${status ? ` với trạng thái ${INVOICE_STATUS_MAP[status]?.label || status}` : ''}`}
        onRowClick={(row) => navigate(`/pharma/invoices/${row.id}`)}
      />
    </div>
  );
}
