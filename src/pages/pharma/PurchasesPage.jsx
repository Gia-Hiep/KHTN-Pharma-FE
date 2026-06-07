import { useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogApi, PurchaseApi } from '../../apis';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pill, XCircle } from 'lucide-react';

const CATALOG_BASE = SERVICE_URLS.catalog;

const STATUS_MAP = {
  DRAFT: { label: 'Nháp', variant: 'warning' },
  RECEIVED: { label: 'Đã nhận', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
};

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const EMPTY_PO_FORM = { supplierId: '', notes: '' };

const EMPTY_ITEM = {
  medicineId: '',
  medicineName: '',
  unitCode: '',
  unitLabel: '',
  conversionFactor: 1,
  lotNumber: '',
  expiryDate: '',
  qty: 1,
  importPrice: 0,
};

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function normalizeUnits(medicine) {
  const units = Array.isArray(medicine?.units)
    ? medicine.units.filter((unit) => unit && unit.isActive !== false)
    : [];

  if (units.length > 0) return units;

  return [{
    unitCode: 'BASE',
    unitLabel: medicine?.unit || 'Đơn vị',
    conversionFactor: 1,
    retailPrice: medicine?.salePrice ?? 0,
    isBaseUnit: true,
    isDefaultSaleUnit: true,
    isActive: true,
  }];
}

function resolveDefaultUnit(medicine) {
  const units = normalizeUnits(medicine);
  return units.find((unit) => unit.isDefaultSaleUnit)
    || units.find((unit) => unit.isBaseUnit)
    || units[0]
    || null;
}

function buildItemFromMedicine(medicine) {
  const unit = resolveDefaultUnit(medicine);
  return {
    ...EMPTY_ITEM,
    medicineId: String(medicine?.id || ''),
    medicineName: medicine?.name || '',
    unitCode: unit?.unitCode || 'BASE',
    unitLabel: unit?.unitLabel || medicine?.unit || 'Đơn vị',
    conversionFactor: unit?.conversionFactor || 1,
  };
}

function MedThumbnail({ imageUrl, name, size = 32 }) {
  const src = resolveImageUrl(imageUrl);
  const cls = size <= 32 ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 ${cls}`}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : <Pill className="h-4 w-4 text-slate-400" />}
    </div>
  );
}

function StatusStepper({ status }) {
  const steps = [
    { key: 'DRAFT', label: 'Nháp' },
    { key: 'RECEIVED', label: 'Đã nhận hàng' },
  ];
  const activeIndex = steps.findIndex((step) => step.key === status);

  if (status === 'CANCELLED') {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5">
        <XCircle className="h-5 w-5" />
        <span className="font-bold text-red-700">Phiếu đã bị hủy</span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center">
      {steps.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex-1 text-center">
              <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${done ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {done ? '✓' : index + 1}
              </div>
              <div className={`text-xs ${done ? 'font-semibold text-blue-600' : 'text-slate-400'}`}>{step.label}</div>
            </div>
            {index < steps.length - 1 && <div className={`h-0.5 min-w-5 flex-[0.5] ${done && index < activeIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function PurchaseItemEditor({ item, medicines, onChange, removable, onRemove }) {
  const medicine = medicines.find((med) => String(med.id) === String(item.medicineId)) || null;
  const units = normalizeUnits(medicine);

  const handleMedicineChange = (medicineId) => {
    const nextMedicine = medicines.find((med) => String(med.id) === String(medicineId));
    if (!nextMedicine) {
      onChange({ ...EMPTY_ITEM });
      return;
    }
    onChange(buildItemFromMedicine(nextMedicine));
  };

  const handleUnitChange = (unitCode) => {
    const unit = units.find((entry) => entry.unitCode === unitCode);
    if (!unit) return;
    onChange({
      ...item,
      unitCode: unit.unitCode,
      unitLabel: unit.unitLabel,
      conversionFactor: unit.conversionFactor || 1,
    });
  };

  return (
    <div className="grid items-end gap-2 lg:grid-cols-[minmax(180px,2fr)_140px_120px_120px_90px_140px_auto]">
      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Thuốc *</label>
        <select value={item.medicineId} className="select w-full" onChange={(e) => handleMedicineChange(e.target.value)}>
          <option value="">-- Chọn thuốc --</option>
          {medicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Đơn vị nhập *</label>
        <select value={item.unitCode} className="select w-full" onChange={(e) => handleUnitChange(e.target.value)} disabled={!medicine}>
          <option value="">-- Đơn vị --</option>
          {units.map((unit) => (
            <option key={unit.unitCode} value={unit.unitCode}>{unit.unitLabel}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Lô SX</label>
        <input value={item.lotNumber} onChange={(e) => onChange({ ...item, lotNumber: e.target.value })} className="input w-full text-sm" placeholder="LOT-..." />
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-600">HSD</label>
        <input type="date" value={item.expiryDate} onChange={(e) => onChange({ ...item, expiryDate: e.target.value })} className="input w-full text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-600">SL *</label>
        <input type="number" min={1} value={item.qty} onChange={(e) => onChange({ ...item, qty: Math.max(1, Number(e.target.value) || 1) })} className="input w-full text-center text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Giá nhập / {item.unitLabel || 'đơn vị'}</label>
        <input type="number" min={0} value={item.importPrice} onChange={(e) => onChange({ ...item, importPrice: Number(e.target.value) || 0 })} className="input w-full text-right text-sm" />
      </div>

      {removable ? (
        <button onClick={onRemove} className="rounded bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Xóa</button>
      ) : <div />}

      {medicine && (
        <div className="lg:col-span-7 text-[11px] text-slate-500">
          1 {item.unitLabel || item.unitCode} = {item.conversionFactor || 1} đơn vị gốc · Số lượng nhập kho thực tế: {(item.qty || 0) * (item.conversionFactor || 1)}
        </div>
      )}
    </div>
  );
}

export function PurchasesPage() {
  const [tab, setTab] = useState('list');
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const [selectedPO, setSelectedPO] = useState(null);
  const [poItems, setPOItems] = useState([]);
  const [receiveResult, setReceiveResult] = useState(null);
  const [acting, setActing] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_PO_FORM });
  const [newItems, setNewItems] = useState([{ ...EMPTY_ITEM }]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ ...EMPTY_ITEM });
  const [editingPO, setEditingPO] = useState(false);
  const [poEditForm, setPOEditForm] = useState({ supplierId: '', notes: '' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemEditForm, setItemEditForm] = useState({ ...EMPTY_ITEM });
  const [cancelReason, setCancelReason] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([
      PurchaseApi.getPurchases().catch(() => []),
      PurchaseApi.getSuppliers().catch(() => []),
      CatalogApi.getMedicines().catch(() => []),
    ])
      .then(([purchaseList, supplierList, medicineList]) => {
        setPurchases(Array.isArray(purchaseList) ? purchaseList : []);
        setSuppliers(Array.isArray(supplierList) ? supplierList : []);
        setMedicines(Array.isArray(medicineList) ? medicineList : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const medImageMap = useMemo(() => {
    const map = {};
    medicines.forEach((medicine) => {
      if (medicine.id) map[medicine.id] = medicine.imageUrl || null;
    });
    return map;
  }, [medicines]);

  const supplierName = (supplierId) => suppliers.find((supplier) => supplier.id === supplierId)?.name || '—';

  const reloadDetail = useCallback(async () => {
    if (!selectedPO) return;
    try {
      const [updated, items] = await Promise.all([
        PurchaseApi.getPurchase(selectedPO.id),
        PurchaseApi.getPurchaseItems(selectedPO.id).catch(() => []),
      ]);
      setSelectedPO(updated);
      setPOItems(Array.isArray(items) ? items : []);
    } catch {
      setPOItems([]);
    }
  }, [selectedPO]);

  const handleCreate = async () => {
    if (!form.supplierId) return setError('Chọn nhà cung cấp');
    const validItems = newItems.filter((item) => item.medicineId && item.unitCode && item.qty > 0);
    if (validItems.length === 0) return setError('Thêm ít nhất 1 sản phẩm hợp lệ');

    setActing(true);
    setError(null);
    try {
      const purchase = await PurchaseApi.createPurchase({
        supplierId: Number(form.supplierId),
        notes: form.notes || null,
      });
      const purchaseId = purchase?.id ?? purchase;

      for (const item of validItems) {
        await PurchaseApi.addPurchaseItem(purchaseId, {
          medicineId: Number(item.medicineId),
          medicineName: item.medicineName,
          unitCode: item.unitCode,
          unitLabel: item.unitLabel,
          conversionFactor: Number(item.conversionFactor) || 1,
          lotNumber: item.lotNumber || `LOT-${Date.now()}`,
          expiryDate: item.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          qty: Number(item.qty),
          importPrice: Number(item.importPrice),
        });
      }

      setMsg(`Đã tạo phiếu nhập #${purchaseId}`);
      setForm({ ...EMPTY_PO_FORM });
      setNewItems([{ ...EMPTY_ITEM }]);
      setTab('list');
      reload();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi tạo phiếu nhập');
    } finally {
      setActing(false);
    }
  };

  const viewDetail = async (purchase) => {
    setSelectedPO(purchase);
    setReceiveResult(null);
    setEditingPO(false);
    setEditingItemId(null);
    setShowAddItem(false);
    setCancelReason('');
    try {
      const items = await PurchaseApi.getPurchaseItems(purchase.id);
      setPOItems(Array.isArray(items) ? items : []);
    } catch {
      setPOItems([]);
    }
    setTab('detail');
  };

  const startEditPO = () => {
    setPOEditForm({
      supplierId: selectedPO?.supplierId || '',
      notes: selectedPO?.notes || '',
    });
    setEditingPO(true);
  };

  const saveEditPO = async () => {
    setActing(true);
    setError(null);
    try {
      const updated = await PurchaseApi.updatePurchase(selectedPO.id, {
        supplierId: poEditForm.supplierId ? Number(poEditForm.supplierId) : null,
        notes: poEditForm.notes || null,
      });
      setSelectedPO(updated);
      setEditingPO(false);
      setMsg('Đã cập nhật thông tin phiếu');
      reload();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi cập nhật phiếu');
    } finally {
      setActing(false);
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setItemEditForm({
      medicineId: String(item.medicineId),
      medicineName: item.medicineName || '',
      unitCode: item.unitCode || '',
      unitLabel: item.unitLabel || '',
      conversionFactor: item.conversionFactor || 1,
      lotNumber: item.lotNumber || '',
      expiryDate: item.expiryDate || '',
      qty: item.qty || 1,
      importPrice: item.importPrice || 0,
    });
  };

  const saveEditItem = async () => {
    setActing(true);
    setError(null);
    try {
      await PurchaseApi.updatePurchaseItem(selectedPO.id, editingItemId, {
        medicineId: itemEditForm.medicineId ? Number(itemEditForm.medicineId) : null,
        unitCode: itemEditForm.unitCode,
        unitLabel: itemEditForm.unitLabel,
        conversionFactor: Number(itemEditForm.conversionFactor) || 1,
        lotNumber: itemEditForm.lotNumber || null,
        expiryDate: itemEditForm.expiryDate || null,
        qty: Number(itemEditForm.qty),
        importPrice: Number(itemEditForm.importPrice),
      });
      setEditingItemId(null);
      await reloadDetail();
      setMsg('Đã cập nhật dòng sản phẩm');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi cập nhật item');
    } finally {
      setActing(false);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Xóa dòng sản phẩm này?')) return;
    setActing(true);
    setError(null);
    try {
      await PurchaseApi.deletePurchaseItem(selectedPO.id, itemId);
      await reloadDetail();
      setMsg('Đã xóa dòng sản phẩm');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi xóa item');
    } finally {
      setActing(false);
    }
  };

  const addItemInDetail = async () => {
    if (!newItemForm.medicineId || !newItemForm.unitCode) return setError('Chọn thuốc và đơn vị nhập');
    setActing(true);
    setError(null);
    try {
      await PurchaseApi.addPurchaseItem(selectedPO.id, {
        medicineId: Number(newItemForm.medicineId),
        medicineName: newItemForm.medicineName,
        unitCode: newItemForm.unitCode,
        unitLabel: newItemForm.unitLabel,
        conversionFactor: Number(newItemForm.conversionFactor) || 1,
        lotNumber: newItemForm.lotNumber || `LOT-${Date.now()}`,
        expiryDate: newItemForm.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        qty: Number(newItemForm.qty),
        importPrice: Number(newItemForm.importPrice),
      });
      setNewItemForm({ ...EMPTY_ITEM });
      setShowAddItem(false);
      await reloadDetail();
      setMsg('Đã thêm sản phẩm');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi thêm item');
    } finally {
      setActing(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedPO || poItems.length === 0) return setError('Phiếu chưa có sản phẩm');
    if (!window.confirm(`Xác nhận nhận hàng phiếu ${selectedPO.code || `PO-${selectedPO.id}`}?`)) return;
    setActing(true);
    setError(null);
    try {
      const result = await PurchaseApi.receivePurchase(selectedPO.id);
      setReceiveResult(result);
      setMsg(`Đã nhận hàng phiếu ${selectedPO.code || `PO-${selectedPO.id}`}`);
      await reloadDetail();
      reload();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi nhận hàng');
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedPO) return;
    if (!window.confirm(`Hủy phiếu ${selectedPO.code || `PO-${selectedPO.id}`}?`)) return;
    setActing(true);
    setError(null);
    try {
      await PurchaseApi.cancelPurchase(selectedPO.id, cancelReason || 'Hủy bởi dược sĩ');
      setMsg(`Đã hủy phiếu ${selectedPO.code || `PO-${selectedPO.id}`}`);
      await reloadDetail();
      reload();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi hủy phiếu');
    } finally {
      setActing(false);
    }
  };

  const isDraft = selectedPO?.status === 'DRAFT';

  const listColumns = [
    { key: 'code', label: 'Mã PO', className: 'font-semibold', render: (purchase) => purchase.code || `PO-${purchase.id}` },
    { key: 'supplierName', label: 'Nhà cung cấp', render: (purchase) => purchase.supplierName || supplierName(purchase.supplierId) },
    { key: 'createdAt', label: 'Ngày tạo', className: 'text-slate-500', render: (purchase) => purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('vi-VN') : '—' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (purchase) => {
        const status = STATUS_MAP[purchase.status] || { label: purchase.status, variant: 'gray' };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    { key: 'total', label: 'Tổng tiền', headerClassName: '!text-right', className: 'text-right font-semibold', render: (purchase) => fmt(purchase.total) },
    { key: '_actions', label: '', render: (purchase) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); viewDetail(purchase); }}>Xem</Button> },
  ];

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <PageHeader title="Quản lý nhập hàng" subtitle={`${purchases.length} phiếu nhập`} />

      {msg && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          {msg}
          <button onClick={() => setMsg(null)} className="text-blue-400 hover:text-blue-600">✕</button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          ⚠ {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex gap-2">
        {['list', 'create'].map((value) => (
          <button
            key={value}
            onClick={() => { setTab(value); setReceiveResult(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {value === 'list' ? 'Danh sách' : 'Tạo phiếu nhập'}
          </button>
        ))}
        {tab === 'detail' && <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Chi tiết {selectedPO?.code || `PO-${selectedPO?.id}`}</span>}
      </div>

      {tab === 'list' && (
        <DataTable columns={listColumns} rows={purchases} loading={loading} emptyText="Chưa có phiếu nhập nào" />
      )}

      {tab === 'create' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold">Tạo phiếu nhập mới</h3>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Nhà cung cấp *</label>
            <select value={form.supplierId} onChange={(e) => setForm((current) => ({ ...current, supplierId: e.target.value }))} className="select w-full">
              <option value="">-- Chọn NCC --</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Ghi chú</label>
            <input value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="input w-full" placeholder="Ghi chú tùy chọn" />
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">Sản phẩm nhập</label>
          <div className="mb-4 space-y-3">
            {newItems.map((item, index) => (
              <PurchaseItemEditor
                key={index}
                item={item}
                medicines={medicines}
                onChange={(nextItem) => setNewItems((current) => current.map((entry, itemIndex) => itemIndex === index ? nextItem : entry))}
                removable={newItems.length > 1}
                onRemove={() => setNewItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
          </div>

          <button onClick={() => setNewItems((current) => [...current, { ...EMPTY_ITEM }])} className="mb-4 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs hover:bg-slate-100">
            + Thêm dòng
          </button>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTab('list')}>Hủy</Button>
            <Button onClick={handleCreate} loading={acting}>{acting ? 'Đang tạo...' : 'Tạo phiếu nhập'}</Button>
          </div>
        </div>
      )}

      {tab === 'detail' && selectedPO && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Phiếu nhập {selectedPO.code || `PO-${selectedPO.id}`}</h3>
            <Button variant="ghost" size="sm" onClick={() => { setTab('list'); setReceiveResult(null); }}>← Quay lại</Button>
          </div>

          <StatusStepper status={selectedPO.status} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-600">Thông tin phiếu</h4>
              {isDraft && !editingPO && <Button size="sm" variant="ghost" onClick={startEditPO}>Sửa</Button>}
            </div>

            {editingPO ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Nhà cung cấp</label>
                  <select value={poEditForm.supplierId} onChange={(e) => setPOEditForm((current) => ({ ...current, supplierId: e.target.value }))} className="select w-full">
                    <option value="">-- Chọn NCC --</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Ghi chú</label>
                  <input value={poEditForm.notes} onChange={(e) => setPOEditForm((current) => ({ ...current, notes: e.target.value }))} className="input w-full" />
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingPO(false)}>Hủy</Button>
                  <Button size="sm" onClick={saveEditPO} loading={acting}>{acting ? 'Đang lưu...' : 'Lưu'}</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Mã phiếu:</strong> {selectedPO.code || `PO-${selectedPO.id}`}</div>
                <div><strong>NCC:</strong> {selectedPO.supplierName || supplierName(selectedPO.supplierId)}</div>
                <div><strong>Ngày tạo:</strong> {selectedPO.createdAt ? new Date(selectedPO.createdAt).toLocaleString('vi-VN') : '—'}</div>
                <div><strong>Trạng thái:</strong> <Badge variant={STATUS_MAP[selectedPO.status]?.variant || 'gray'}>{STATUS_MAP[selectedPO.status]?.label || selectedPO.status}</Badge></div>
                <div><strong>Tổng tiền:</strong> <span className="font-bold text-blue-600">{fmt(selectedPO.total)}</span></div>
                {selectedPO.receivedAt && <div><strong>Ngày nhận:</strong> {new Date(selectedPO.receivedAt).toLocaleString('vi-VN')}</div>}
                {selectedPO.notes && <div className="col-span-2"><strong>Ghi chú:</strong> {selectedPO.notes}</div>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-600">Sản phẩm ({poItems.length})</h4>
              {isDraft && (
                <Button size="sm" variant={showAddItem ? 'ghost' : 'secondary'} onClick={() => setShowAddItem(!showAddItem)}>
                  {showAddItem ? 'Đóng' : '+ Thêm sản phẩm'}
                </Button>
              )}
            </div>

            {showAddItem && isDraft && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 text-sm font-semibold text-blue-700">Thêm sản phẩm mới</div>
                <PurchaseItemEditor item={newItemForm} medicines={medicines} onChange={setNewItemForm} />
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>Hủy</Button>
                  <Button size="sm" onClick={addItemInDetail} loading={acting}>{acting ? 'Đang thêm...' : 'Thêm'}</Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">Thuốc</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">Đơn vị nhập</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">Lô SX</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">HSD</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">SL</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">SL base</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Giá nhập</th>
                    <th className="border-b-2 border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Thành tiền</th>
                    {isDraft && <th className="w-24 border-b-2 border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-500">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {poItems.length === 0 && (
                    <tr>
                      <td colSpan={isDraft ? 9 : 8} className="py-8 text-center text-slate-400">Chưa có sản phẩm nào.</td>
                    </tr>
                  )}
                  {poItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <tr key={item.id} className={`border-b border-slate-100 ${isEditing ? 'bg-amber-50' : ''}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <MedThumbnail imageUrl={medImageMap[item.medicineId]} name={item.medicineName} />
                            <span>{item.medicineName || `#${item.medicineId}`}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <select
                              value={itemEditForm.unitCode}
                              onChange={(e) => {
                                const medicine = medicines.find((med) => String(med.id) === String(itemEditForm.medicineId));
                                const units = normalizeUnits(medicine);
                                const unit = units.find((entry) => entry.unitCode === e.target.value);
                                if (!unit) return;
                                setItemEditForm((current) => ({
                                  ...current,
                                  unitCode: unit.unitCode,
                                  unitLabel: unit.unitLabel,
                                  conversionFactor: unit.conversionFactor || 1,
                                }));
                              }}
                              className="select w-full text-sm"
                            >
                              {normalizeUnits(medicines.find((med) => String(med.id) === String(itemEditForm.medicineId))).map((unit) => (
                                <option key={unit.unitCode} value={unit.unitCode}>{unit.unitLabel}</option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <div>{item.unitLabel || item.unitCode || '—'}</div>
                              <div className="text-[11px] text-slate-400">1 = {item.conversionFactor || 1} base</div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? <input value={itemEditForm.lotNumber} onChange={(e) => setItemEditForm((current) => ({ ...current, lotNumber: e.target.value }))} className="input w-28 text-sm" /> : (item.lotNumber || '—')}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? <input type="date" value={itemEditForm.expiryDate} onChange={(e) => setItemEditForm((current) => ({ ...current, expiryDate: e.target.value }))} className="input w-36 text-sm" /> : (item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '—')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isEditing ? <input type="number" min={1} value={itemEditForm.qty} onChange={(e) => setItemEditForm((current) => ({ ...current, qty: Math.max(1, Number(e.target.value) || 1) }))} className="input w-16 text-center text-sm" /> : item.qty}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-600">
                          {(isEditing ? itemEditForm.qty : item.qty) * (isEditing ? itemEditForm.conversionFactor : item.conversionFactor)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isEditing ? <input type="number" min={0} value={itemEditForm.importPrice} onChange={(e) => setItemEditForm((current) => ({ ...current, importPrice: Number(e.target.value) || 0 }))} className="input w-28 text-right text-sm" /> : fmt(item.importPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(item.lineTotal || (item.qty * item.importPrice))}</td>
                        {isDraft && (
                          <td className="px-3 py-2 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <button onClick={saveEditItem} disabled={acting} className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50">✓</button>
                                <button onClick={() => setEditingItemId(null)} className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs">✕</button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button onClick={() => startEditItem(item)} className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs hover:bg-slate-50">Sửa</button>
                                <button onClick={() => deleteItem(item.id)} className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100">Xóa</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {poItems.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={isDraft ? 7 : 7} className="px-3 py-2.5 text-right font-bold">Tổng cộng</td>
                      <td className="px-3 py-2.5 text-right text-base font-bold text-blue-600">{fmt(selectedPO.total)}</td>
                      {isDraft && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {isDraft && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-600">Thao tác</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleReceive} loading={acting} disabled={acting || poItems.length === 0}>Nhận hàng — Nhập kho</Button>
                <div className="flex flex-1 gap-2">
                  <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Lý do hủy (tùy chọn)..." className="input flex-1 text-sm" />
                  <Button variant="ghost" onClick={handleCancel} loading={acting} className="!border-red-200 !text-red-600 hover:!bg-red-50">Hủy phiếu</Button>
                </div>
              </div>
            </div>
          )}

          {receiveResult && (
            <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5">
              <h4 className="mb-3 text-base font-bold text-blue-700">Nhận hàng thành công</h4>
              <div className="mb-3 text-sm text-blue-800">
                Mã phiếu: <strong>{receiveResult.purchaseCode}</strong> · Trạng thái: <strong>{receiveResult.status}</strong>
              </div>

              {receiveResult.inbound?.results?.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-blue-200">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border-b border-blue-200 px-2 py-1.5 text-left font-semibold">Medicine ID</th>
                        <th className="border-b border-blue-200 px-2 py-1.5 text-left font-semibold">Lot ID</th>
                        <th className="border-b border-blue-200 px-2 py-1.5 text-left font-semibold">Lot #</th>
                        <th className="border-b border-blue-200 px-2 py-1.5 text-right font-semibold">SL nhập</th>
                        <th className="border-b border-blue-200 px-2 py-1.5 text-right font-semibold">Tồn sau nhập</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveResult.inbound.results.map((result, index) => (
                        <tr key={index} className="border-b border-blue-100">
                          <td className="px-2 py-1.5">#{result.medicineId}</td>
                          <td className="px-2 py-1.5">#{result.lotId}</td>
                          <td className="px-2 py-1.5 font-mono">{result.lotNumber}</td>
                          <td className="px-2 py-1.5 text-right font-semibold text-blue-700">+{result.addedQty}</td>
                          <td className="px-2 py-1.5 text-right font-bold">{result.qtyOnHandAfter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
