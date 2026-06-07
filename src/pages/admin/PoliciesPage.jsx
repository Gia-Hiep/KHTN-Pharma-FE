// File: src/pages/admin/PoliciesPage.jsx
import { useState, useEffect } from 'react';
import { DollarSign, Ticket, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { CatalogApi, CustomerApi } from '../../apis';
import { PageShell } from '../../components/ui';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const TABS = [
  { key: 'pricing', label: 'Bảng giá', icon: DollarSign },
  { key: 'coupons', label: 'Coupon', icon: Ticket },
];

export function PoliciesPage() {
  const [tab, setTab] = useState('pricing');

  return (
    <PageShell variant="admin" title="Chính sách giá & Coupon">
      <div className="flex gap-1.5 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={[
              'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              tab === key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
            ].join(' ')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'pricing' ? <PricingTab /> : <CouponTab />}
    </PageShell>
  );
}

/* ═══════════════════════════════════ PRICING TAB ═══════════════════════════════════ */
function PricingTab() {
  const [allMeds, setAllMeds] = useState([]);
  const [medQ, setMedQ] = useState('');
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [selectedMed, setSelectedMed] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tierCode: 'WHOLESALE', price: '', minQty: 1, effectiveFrom: '', effectiveTo: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    CatalogApi.getMedicines()
      .then(res => setAllMeds(Array.isArray(res) ? res : []))
      .catch(() => setAllMeds([]))
      .finally(() => setLoadingMeds(false));
  }, []);

  const filtered = medQ.trim()
    ? allMeds.filter(m =>
        m.name?.toLowerCase().includes(medQ.toLowerCase()) ||
        m.code?.toLowerCase().includes(medQ.toLowerCase()))
    : allMeds;

  const selectMed = async (med) => {
    setSelectedMed(med);
    setLoadingTiers(true);
    try {
      const res = await CatalogApi.getPricingTiers(med.id);
      setTiers(Array.isArray(res) ? res : []);
    } catch { setTiers([]); }
    setLoadingTiers(false);
  };

  const createTier = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await CatalogApi.createPricingTier({ ...form, medicineId: selectedMed.id, price: Number(form.price), minQty: Number(form.minQty) });
      setShowForm(false);
      setForm({ tierCode: 'WHOLESALE', price: '', minQty: 1, effectiveFrom: '', effectiveTo: '' });
      selectMed(selectedMed);
      setMsg({ type: 'success', text: 'Tạo pricing tier thành công' });
    } catch (e) { setMsg({ type: 'error', text: e?.response?.data?.message || e?.message || 'Lỗi' }); }
  };

  const deleteTier = async (tierId) => {
    if (!window.confirm('Xóa pricing tier này?')) return;
    try {
      await CatalogApi.deletePricingTier(tierId);
      selectMed(selectedMed);
    } catch (e) { setMsg({ type: 'error', text: e?.message || 'Lỗi xóa' }); }
  };

  const tierColumns = [
    { key: 'tierCode', label: 'Tier Code', className: 'font-semibold' },
    { key: 'price', label: 'Giá', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => fmt(r.price) },
    { key: 'minQty', label: 'Min Qty', className: 'text-right tabular-nums', headerClassName: 'text-right' },
    { key: 'effective', label: 'Hiệu lực', className: 'text-center text-xs', render: (r) =>
      `${r.effectiveFrom ? r.effectiveFrom.substring(0, 10) : '—'} → ${r.effectiveTo ? r.effectiveTo.substring(0, 10) : '∞'}`
    },
    { key: '_actions', label: '', render: (r) => (
      <button onClick={() => deleteTier(r.id)}
        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )},
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2 items-start">
      {/* Left: Medicine list */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Danh sách thuốc ({filtered.length})</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={medQ} onChange={e => setMedQ(e.target.value)}
            placeholder="Lọc theo tên / mã..."
            className="input w-full pl-9 py-2 text-sm" />
        </div>

        {msg && (
          <div className={`alert text-sm mb-3 ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>
        )}

        {loadingMeds ? (
          <div className="text-center py-8 text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Không có thuốc nào</div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {filtered.map(m => (
              <button key={m.id} type="button" onClick={() => selectMed(m)}
                className={[
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                  selectedMed?.id === m.id
                    ? 'bg-violet-50 border-l-[3px] border-l-violet-500'
                    : 'hover:bg-slate-50 border-l-[3px] border-l-transparent',
                ].join(' ')}>
                <span className="font-semibold text-slate-900 truncate">{m.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">{m.code}</span>
                {m.unit && <span className="shrink-0 text-[11px] text-slate-500">({m.unit})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Pricing tiers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {!selectedMed ? (
          <div className="text-center py-16 text-slate-400">← Chọn một thuốc để xem bảng giá</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Bảng giá: <span className="text-violet-600">{selectedMed.name}</span></h3>
              <Button size="sm" variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm(!showForm)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm tier
              </Button>
            </div>

            {loadingTiers ? (
              <div className="text-slate-500 text-sm">Đang tải...</div>
            ) : (
              <DataTable columns={tierColumns} rows={tiers} loading={false} emptyText="Chưa có pricing tier" />
            )}

            {showForm && (
              <form onSubmit={createTier} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Tier Code</label>
                    <select value={form.tierCode} onChange={e => setForm(f => ({ ...f, tierCode: e.target.value }))} className="select w-full text-sm">
                      {['RETAIL', 'WHOLESALE', 'INSURANCE', 'VIP'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Giá (VND)</label>
                    <input type="number" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Min Qty</label>
                    <input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Từ ngày</label>
                    <input type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} className="input w-full text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Lưu</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ COUPON TAB ═══════════════════════════════════ */
function CouponTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENT', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
  const [msg, setMsg] = useState(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await CustomerApi.getCoupons();
      setCoupons(Array.isArray(res) ? res : []);
    } catch { setCoupons([]); }
    setLoading(false);
  };
  useEffect(() => { loadCoupons(); }, []);

  const createCoupon = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await CustomerApi.createCoupon({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      });
      setShowForm(false);
      setForm({ code: '', discountType: 'PERCENT', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
      loadCoupons();
      setMsg({ type: 'success', text: 'Tạo coupon thành công' });
    } catch (e) { setMsg({ type: 'error', text: e?.response?.data?.message || e?.message || 'Lỗi' }); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Vô hiệu hóa coupon?')) return;
    try { await CustomerApi.deactivateCoupon(id); loadCoupons(); } catch (e) { setMsg({ type: 'error', text: e?.message || 'Lỗi' }); }
  };

  const couponColumns = [
    { key: 'code', label: 'Mã', className: 'font-bold font-mono' },
    { key: 'discountType', label: 'Loại', render: (r) => <Badge variant={r.discountType === 'PERCENT' ? 'info' : 'success'}>{r.discountType === 'PERCENT' ? '%' : 'VND'}</Badge> },
    { key: 'discountValue', label: 'Giá trị', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => r.discountType === 'PERCENT' ? r.discountValue + '%' : fmt(r.discountValue) },
    { key: 'minOrderAmount', label: 'Đơn tối thiểu', className: 'text-right tabular-nums', headerClassName: 'text-right', render: (r) => r.minOrderAmount ? fmt(r.minOrderAmount) : '—' },
    { key: 'usage', label: 'Đã dùng / Max', render: (r) => `${r.usedCount ?? 0} / ${r.maxUses ?? '∞'}` },
    { key: 'expiresAt', label: 'Hết hạn', className: 'text-xs', render: (r) => r.expiresAt ? r.expiresAt.substring(0, 10) : '∞' },
    { key: '_actions', label: '', render: (r) => (
      <button onClick={() => deactivate(r.id)}
        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Quản lý Coupon</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Tạo coupon
        </Button>
      </div>

      {msg && (
        <div className={`alert text-sm ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>
      )}

      {showForm && (
        <form onSubmit={createCoupon} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mã coupon</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="VD: SUMMER20" className="input w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Loại giảm</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="select w-full text-sm">
                <option value="PERCENT">% Phần trăm</option>
                <option value="FIXED">Cố định (VND)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Giá trị</label>
              <input type="number" required value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} className="input w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Đơn tối thiểu</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                placeholder="0" className="input w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Lượt dùng tối đa</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Không giới hạn" className="input w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Hết hạn</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Lưu</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DataTable columns={couponColumns} rows={coupons} loading={loading} emptyText="Chưa có coupon" />
      </div>
    </div>
  );
}
