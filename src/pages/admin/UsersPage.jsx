// File: src/pages/admin/UsersPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Pencil, Key, Shield, Power, X } from 'lucide-react';
import { AuthApi } from '../../apis';
import { PageShell } from '../../components/ui';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const ROLE_OPTIONS = ['ADMIN', 'PHARMACIST', 'BUYER'];

const ROLE_VARIANT = { ADMIN: 'warning', PHARMACIST: 'info', BUYER: 'gray' };

/* ── Create / Edit User Modal ─────────────────────────────────────────── */
function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    password: '',
  });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      if (isEdit) {
        await AuthApi.updateUser(user.id, { fullName: form.fullName, email: form.email, phone: form.phone, address: form.address });
      } else {
        await AuthApi.createUser(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setMsg(err?.response?.data?.message || err?.message || 'Lỗi');
    }
    setSaving(false);
  };

  return (
    <Modal
      open
      title={isEdit ? `Sửa user #${user.id}` : 'Tạo nhân viên mới'}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Username *</label>
            <input className="input w-full" required value={form.username} onChange={set('username')} placeholder="vd: pharmacist01" />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Họ tên *</label>
          <input className="input w-full" required value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email *</label>
          <input className="input w-full" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label>
            <input className="input w-full" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa chỉ</label>
            <input className="input w-full" value={form.address} onChange={set('address')} />
          </div>
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu *</label>
            <input className="input w-full" type="password" required value={form.password} onChange={set('password')} />
          </div>
        )}
        {msg && <div className="alert alert-error text-sm">{msg}</div>}
      </form>
    </Modal>
  );
}

/* ── Change Password Modal ────────────────────────────────────────────── */
function PwdModal({ user, onClose }) {
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await AuthApi.changePassword(user.id, { newPassword: pwd });
      setMsg('success');
      setTimeout(onClose, 1200);
    } catch (err) {
      setMsg(err?.response?.data?.message || err?.message || 'Lỗi');
    }
    setSaving(false);
  };

  return (
    <Modal
      open
      title={`Đổi mật khẩu — ${user.username}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={saving}>{saving ? '...' : 'Đổi mật khẩu'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu mới *</label>
          <input className="input w-full" type="password" required minLength={6} value={pwd} onChange={e => setPwd(e.target.value)} />
        </div>
        {msg === 'success' && <div className="alert alert-success text-sm">Đổi mật khẩu thành công</div>}
        {msg && msg !== 'success' && <div className="alert alert-error text-sm">{msg}</div>}
      </form>
    </Modal>
  );
}

/* ── Set Roles Modal ──────────────────────────────────────────────────── */
function RolesModal({ user, onClose, onSaved }) {
  const [selected, setSelected] = useState(user.roles || []);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggle = (r) => setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r]);

  const submit = async () => {
    if (selected.length === 0) { setMsg('Phải chọn ít nhất 1 role'); return; }
    setSaving(true);
    try {
      await AuthApi.setUserRoles(user.id, { roles: selected });
      onSaved();
      onClose();
    } catch (err) {
      setMsg(err?.response?.data?.message || err?.message || 'Lỗi');
    }
    setSaving(false);
  };

  return (
    <Modal
      open
      title={`Phân quyền — ${user.username}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={saving}>{saving ? '...' : 'Lưu roles'}</Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2.5 mb-4">
        {ROLE_OPTIONS.map(r => (
          <label
            key={r}
            className={[
              'flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-all',
              selected.includes(r)
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            ].join(' ')}
          >
            <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} className="sr-only" />
            <Shield className="h-4 w-4" />
            {r}
          </label>
        ))}
      </div>
      {msg && <div className="alert alert-error text-sm">{msg}</div>}
    </Modal>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export function UsersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await AuthApi.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Lỗi tải danh sách');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load({}); }, [load]);

  const doSearch = () => load({ q: q || undefined, role: role || undefined });

  const toggleStatus = async (user) => {
    const action = user.active ? 'vô hiệu hoá' : 'kích hoạt';
    if (!window.confirm(`Xác nhận ${action} tài khoản "${user.username}"?`)) return;
    try {
      await AuthApi.setUserStatus(user.id, { active: !user.active });
      load({ q: q || undefined, role: role || undefined });
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const closeModal = () => setModal(null);
  const saved = () => load({ q: q || undefined, role: role || undefined });

  const columns = [
    { key: 'id', label: 'ID', className: 'text-slate-400 tabular-nums w-12' },
    { key: 'username', label: 'Username', className: 'font-bold' },
    { key: 'fullName', label: 'Họ tên', render: (r) => r.fullName || '—' },
    { key: 'email', label: 'Email', className: 'text-slate-600', render: (r) => r.email || '—' },
    { key: 'roles', label: 'Roles', render: (r) => (
      <div className="flex flex-wrap gap-1">
        {(r.roles || []).map(role => (
          <Badge key={role} variant={ROLE_VARIANT[role] || 'gray'}>{role}</Badge>
        ))}
      </div>
    )},
    { key: 'active', label: 'Trạng thái', render: (r) => (
      <Badge variant={r.active ? 'success' : 'danger'}>{r.active ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: '_actions', label: 'Hành động', render: (r) => (
      <div className="flex gap-1">
        <button title="Sửa thông tin" onClick={() => setModal({ type: 'edit', user: r })}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button title="Đổi mật khẩu" onClick={() => setModal({ type: 'pwd', user: r })}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
          <Key className="h-3.5 w-3.5" />
        </button>
        <button title="Phân quyền" onClick={() => setModal({ type: 'roles', user: r })}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
          <Shield className="h-3.5 w-3.5" />
        </button>
        <button title={r.active ? 'Vô hiệu hoá' : 'Kích hoạt'} onClick={() => toggleStatus(r)}
          className={`rounded-lg border p-1.5 transition ${
            r.active
              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
              : 'border-green-200 bg-green-50 text-green-500 hover:bg-green-100'
          }`}>
          <Power className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ];

  return (
    <PageShell variant="admin" title="Quản lý người dùng">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input w-full pl-9 py-2 text-sm"
              placeholder="Tìm theo username / email / họ tên..."
              value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
          </div>
          <select className="select py-2 text-sm w-36" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">Tất cả role</option>
            {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <Button size="sm" onClick={doSearch} disabled={loading}>
            <Search className="h-3.5 w-3.5 mr-1" /> Tìm
          </Button>
        </div>
        <Button size="sm" onClick={() => setModal({ type: 'create' })}>
          <Plus className="h-4 w-4 mr-1" /> Tạo nhân viên
        </Button>
      </div>

      {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs text-slate-500 mb-3">Tổng: {users.length} người dùng</div>
        <DataTable columns={columns} rows={users} loading={loading} emptyText="Không có người dùng nào" />
      </div>

      {/* Modals */}
      {modal?.type === 'create' && <UserFormModal onClose={closeModal} onSaved={saved} />}
      {modal?.type === 'edit'   && <UserFormModal user={modal.user} onClose={closeModal} onSaved={saved} />}
      {modal?.type === 'pwd'    && <PwdModal user={modal.user} onClose={closeModal} />}
      {modal?.type === 'roles'  && <RolesModal user={modal.user} onClose={closeModal} onSaved={saved} />}
    </PageShell>
  );
}
