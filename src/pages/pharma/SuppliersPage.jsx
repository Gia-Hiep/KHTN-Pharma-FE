import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { PurchaseApi } from '../../apis';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    PurchaseApi.getSuppliers()
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const resetForm = () => { setForm({ name: '', phone: '', email: '', address: '' }); setEditing(null); setShowForm(false); setError(null); };
  const startEdit = (s) => { setForm({ name: s.name || '', phone: s.phone || '', email: s.email || '', address: s.address || '' }); setEditing(s); setShowForm(true); setError(null); };

  const checkDuplicate = () =>
    suppliers.find(s => (editing ? s.id !== editing.id : true) && ((form.phone && s.phone === form.phone) || (form.email && s.email === form.email)));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Tên NCC không được trống');
    const dup = checkDuplicate();
    if (dup) return setError(`Trùng SĐT/Email với NCC "${dup.name}" (ID: ${dup.id})`);
    try {
      if (editing) { await PurchaseApi.updateSupplier(editing.id, form); setMsg(`Đã cập nhật NCC "${form.name}"`); }
      else { await PurchaseApi.createSupplier(form); setMsg(`Đã tạo NCC "${form.name}"`); }
      resetForm(); reload();
    } catch (e) {
      setError(e?.response?.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : (e?.response?.data?.message || e.message || 'Lỗi'));
    }
  };

  const handleDeactivate = async (s) => {
    if (!confirm(`Xóa nhà cung cấp "${s.name}"?`)) return;
    try { await PurchaseApi.deactivateSupplier(s.id); setMsg(`Đã xóa NCC "${s.name}"`); reload(); }
    catch (e) { setError(e?.response?.status === 403 ? 'Bạn không có quyền.' : (e?.response?.data?.message || e.message || 'Lỗi')); }
  };

  const filtered = suppliers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const columns = [
    { key: 'id', label: 'ID', className: 'w-14 font-semibold text-slate-500' },
    { key: 'name', label: 'Tên NCC', className: 'font-semibold text-slate-900' },
    { key: 'phone', label: 'SĐT', render: r => r.phone || '—' },
    { key: 'email', label: 'Email', render: r => r.email || '—' },
    { key: 'address', label: 'Địa chỉ', className: 'text-slate-500 max-w-[200px] truncate', render: r => r.address || '—' },
    { key: '_actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); startEdit(r); }}><Pencil className="mr-1 h-3.5 w-3.5" />Sửa</Button>
        <Button size="sm" variant="ghost" className="!text-red-600 !border-red-200 hover:!bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeactivate(r); }}><Trash2 className="mr-1 h-3.5 w-3.5" />Xóa</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý nhà cung cấp"
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>+ Thêm NCC</Button>} />

      {msg && <Alert variant="success" onDismiss={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Search */}
      <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm NCC (tên, SĐT, email)..." />

      {/* Table */}
      <DataTable columns={columns} rows={filtered} loading={loading} emptyText="Không tìm thấy NCC" />

      {/* Create/Edit Modal */}
      <Modal open={showForm} title={editing ? `Sửa NCC — ${editing.name}` : 'Thêm nhà cung cấp'} onClose={resetForm} size="md"
        footer={<><Button variant="ghost" onClick={resetForm}>Hủy</Button><Button onClick={handleSubmit}>{editing ? 'Cập nhật' : 'Tạo NCC'}</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên NCC *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input w-full" placeholder="VD: Công ty TNHH ABC" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="0901234567" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="ncc@email.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa chỉ</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input w-full" placeholder="123 Nguyễn Văn..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
