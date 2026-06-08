import { useState, useEffect, useCallback } from 'react';
import { Pencil, Eye, ClipboardList, Wallet, Star, Package, ArrowLeft } from 'lucide-react';
import { CustomerApi, SalesApi } from '../../apis';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';
import { StatCard } from '../../components/ui/StatCard';

const fmt = (n) =>
  n == null ? '0 ₫' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const TYPE_MAP = {
  PHARMACY: { label: 'Nhà thuốc (Sỉ)', color: 'info' },
  INDIVIDUAL: { label: 'Cá nhân (Lẻ)', color: 'neutral' },
};

export function CustomersPage() {
  const [view, setView] = useState('list');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', customerType: 'INDIVIDUAL' });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  // Detail state
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');
  const [debts, setDebts] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loyaltyBal, setLoyaltyBal] = useState(0);
  const [loyaltyTx, setLoyaltyTx] = useState([]);
  const [orders, setOrders] = useState([]);

  const reload = useCallback(() => {
    setLoading(true);
    CustomerApi.getCustomers().then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => setCustomers([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const resetForm = () => { setForm({ fullName: '', phone: '', email: '', address: '', customerType: 'INDIVIDUAL' }); setEditing(null); setShowForm(false); setError(null); };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) return setError('Tên KH không được trống');
    try {
      if (editing) { await CustomerApi.updateCustomer(editing.id, form); setMsg(`Đã cập nhật KH "${form.fullName}"`); }
      else { await CustomerApi.createCustomer(form); setMsg(`Đã tạo KH "${form.fullName}"`); }
      resetForm(); reload();
    } catch (e) {
      setError(e?.response?.status === 403 ? 'Bạn không có quyền.' : (e?.response?.data?.message || e.message || 'Lỗi'));
    }
  };

  const openDetail = async (cust) => { setSelected(cust); setDetailTab('profile'); setView('detail'); loadDebt(cust.id); loadLoyalty(cust.id); };

  const loadDebt = async (id) => {
    try { const [d, t] = await Promise.all([CustomerApi.getCustomerDebts(id).catch(() => []), CustomerApi.getTotalDebt(id).catch(() => 0)]); setDebts(Array.isArray(d) ? d : []); setTotalDebt(typeof t === 'number' ? t : (t?.totalDebt ?? 0)); } catch { setDebts([]); setTotalDebt(0); }
  };
  const loadLoyalty = async (id) => {
    try { const [bal, tx] = await Promise.all([CustomerApi.getLoyaltyBalance(id).catch(() => 0), CustomerApi.getLoyaltyTransactions(id).catch(() => [])]); setLoyaltyBal(typeof bal === 'number' ? bal : (bal?.balance ?? 0)); setLoyaltyTx(Array.isArray(tx) ? tx : []); } catch { setLoyaltyBal(0); setLoyaltyTx([]); }
  };
  const loadOrders = async (custId) => { try { const inv = await SalesApi.getInvoices({ customerId: custId }).catch(() => []); setOrders(Array.isArray(inv) ? inv : []); } catch { setOrders([]); } };
  const switchDetailTab = (tab) => { setDetailTab(tab); if (tab === 'orders' && orders.length === 0 && selected) loadOrders(selected.id); };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.fullName || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const listColumns = [
    { key: 'id', label: 'ID', className: 'w-14 font-semibold text-slate-500' },
    { key: 'fullName', label: 'Tên', className: 'font-semibold text-slate-900' },
    { key: 'phone', label: 'SĐT', render: r => r.phone || '—' },
    { key: 'email', label: 'Email', className: 'text-slate-500', render: r => r.email || '—' },
    { key: 'address', label: 'Địa chỉ', className: 'text-slate-500 max-w-[180px] truncate', render: r => r.address || '—' },
    { key: 'customerType', label: 'Loại', render: r => <Badge variant={TYPE_MAP[r.customerType]?.color || 'neutral'}>{TYPE_MAP[r.customerType]?.label || r.customerType}</Badge> },
    { key: '_actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(r); }}><Eye className="mr-1 h-3.5 w-3.5" />Xem</Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setForm({ fullName: r.fullName || '', phone: r.phone || '', email: r.email || '', address: r.address || '', customerType: r.customerType || 'INDIVIDUAL' }); setEditing(r); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  const detailTabs = [
    { key: 'profile', label: 'Hồ sơ', Icon: ClipboardList },
    { key: 'debt', label: 'Công nợ', Icon: Wallet },
    { key: 'loyalty', label: 'Loyalty', Icon: Star },
    { key: 'orders', label: 'Đơn hàng', Icon: Package },
  ];

  return (
    <div className="space-y-5">
      {/* Notifications */}
      {msg && <Alert variant="success" onDismiss={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* ═══ LIST VIEW ═══ */}
      {view === 'list' && (
        <>
          <PageHeader title="Quản lý khách hàng" subtitle={`${customers.length} khách hàng`}
            actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm KH</Button>} />

          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm KH (tên, SĐT)..." />

          <DataTable columns={listColumns} rows={filtered} loading={loading} emptyText="Chưa có khách hàng"
            onRowClick={(row) => openDetail(row)} />
        </>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      {view === 'detail' && selected && (
        <div className="space-y-4">
          <button onClick={() => { setView('list'); setSelected(null); }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </button>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">{selected.fullName}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{selected.phone || '—'}</span>
                <span>•</span>
                <span>{selected.email || '—'}</span>
                <span>•</span>
                <Badge variant={TYPE_MAP[selected.customerType]?.color || 'neutral'}>
                  {TYPE_MAP[selected.customerType]?.label || selected.customerType}
                </Badge>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-200">
              {detailTabs.map(t => (
                <button key={t.key} onClick={() => switchDetailTab(t.key)}
                  className={[
                    'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition border-b-2',
                    detailTab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700',
                  ].join(' ')}>
                  <t.Icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Profile */}
              {detailTab === 'profile' && (
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div><span className="font-semibold text-slate-500">Tên:</span> <span className="text-slate-900">{selected.fullName}</span></div>
                  <div><span className="font-semibold text-slate-500">SĐT:</span> <span className="text-slate-900">{selected.phone || '—'}</span></div>
                  <div><span className="font-semibold text-slate-500">Email:</span> <span className="text-slate-900">{selected.email || '—'}</span></div>
                  <div><span className="font-semibold text-slate-500">Loại:</span> <span className="text-slate-900">{TYPE_MAP[selected.customerType]?.label || selected.customerType}</span></div>
                  <div className="sm:col-span-2"><span className="font-semibold text-slate-500">Địa chỉ:</span> <span className="text-slate-900">{selected.address || '—'}</span></div>
                </div>
              )}

              {/* Debt */}
              {detailTab === 'debt' && (
                <div className="space-y-4">
                  <div className={`rounded-xl border px-5 py-4 ${totalDebt > 0 ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                    <span className="text-sm text-slate-600">Tổng công nợ:</span>
                    <span className={`ml-2 text-lg font-bold ${totalDebt > 0 ? 'text-red-700' : 'text-blue-700'}`}>{fmt(totalDebt)}</span>
                  </div>
                  <DataTable
                    columns={[
                      { key: 'id', label: 'Mã', className: 'w-14' },
                      { key: 'description', label: 'Ghi chú', render: d => d.description || '—' },
                      { key: 'amount', label: 'Số tiền', className: 'text-right', render: d => fmt(d.amount) },
                      { key: 'remainingAmount', label: 'Còn lại', className: 'text-right font-bold', render: d => <span className={(d.remainingAmount ?? 0) > 0 ? 'text-red-600' : 'text-blue-600'}>{fmt(d.remainingAmount)}</span> },
                      { key: 'status', label: 'Trạng thái', render: d => d.status || '—' },
                      { key: 'createdAt', label: 'Ngày', className: 'text-xs text-slate-500', render: d => d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '—' },
                    ]}
                    rows={debts} emptyText="Chưa có công nợ"
                  />
                </div>
              )}

              {/* Loyalty */}
              {detailTab === 'loyalty' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                    <span className="text-sm text-slate-600">Số dư điểm:</span>
                    <span className="ml-2 text-lg font-bold text-blue-700">{loyaltyBal}</span>
                  </div>
                  <DataTable
                    columns={[
                      { key: 'type', label: 'Loại', render: t => t.type || '—' },
                      { key: 'points', label: 'Điểm', className: 'text-right font-bold', render: t => <span className={(t.points ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}>{(t.points ?? 0) >= 0 ? '+' : ''}{t.points}</span> },
                      { key: 'description', label: 'Ghi chú', className: 'text-slate-500', render: t => t.description || t.reason || '—' },
                      { key: 'createdAt', label: 'Ngày', className: 'text-xs text-slate-500', render: t => t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '—' },
                    ]}
                    rows={loyaltyTx} emptyText="Chưa có giao dịch điểm"
                  />
                </div>
              )}

              {/* Orders */}
              {detailTab === 'orders' && (
                <DataTable
                  columns={[
                    { key: 'code', label: 'Mã HĐ', className: 'font-semibold', render: o => o.code || `#${o.id}` },
                    { key: 'status', label: 'Trạng thái' },
                    { key: 'total', label: 'Tổng', className: 'text-right font-bold', render: o => fmt(o.total) },
                    { key: 'createdAt', label: 'Ngày', className: 'text-xs text-slate-500', render: o => o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—' },
                  ]}
                  rows={orders} emptyText="Chưa có đơn hàng"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showForm} title={editing ? `Sửa — ${editing.fullName}` : 'Thêm khách hàng'} onClose={resetForm} size="md"
        footer={<><Button variant="ghost" onClick={resetForm}>Hủy</Button><Button onClick={handleSubmit}>{editing ? 'Cập nhật' : 'Tạo KH'}</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên KH *</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input w-full" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">SĐT</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input w-full" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input w-full" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Loại</label>
            <select value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value }))} className="select w-full">
              <option value="INDIVIDUAL">Cá nhân (Lẻ)</option><option value="PHARMACY">Nhà thuốc (Sỉ)</option>
            </select></div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa chỉ</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input w-full" /></div>
        </div>
      </Modal>
    </div>
  );
}
