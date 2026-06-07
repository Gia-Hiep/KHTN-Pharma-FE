import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CatalogApi, CustomerApi, InventoryApi, SalesApi } from '../../apis';
import { Button } from '../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + '₫';

const SALE_MODE_LABEL = {
  RETAIL: 'Giá lẻ',
  WHOLESALE: 'Giá sỉ',
};

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
    wholesalePrice: null,
    wholesaleMinQty: null,
    isBaseUnit: true,
    isDefaultSaleUnit: true,
  }];
}

function resolveDefaultUnit(units) {
  return units.find((unit) => unit.isDefaultSaleUnit)
    || units.find((unit) => unit.isBaseUnit)
    || units[0]
    || null;
}

function resolveUnitPricing(unit, fallbackPrice, qty) {
  const retailPrice = Number(unit?.retailPrice ?? fallbackPrice ?? 0);
  const hasWholesale = unit?.wholesalePrice != null && unit?.wholesaleMinQty != null;
  const wholesalePrice = Number(unit?.wholesalePrice ?? retailPrice);
  const applyWholesale = hasWholesale && qty >= Number(unit.wholesaleMinQty);

  return {
    unitPrice: applyWholesale ? wholesalePrice : retailPrice,
    saleMode: applyWholesale ? 'WHOLESALE' : 'RETAIL',
    hasWholesale,
    wholesaleMinQty: unit?.wholesaleMinQty ?? null,
  };
}

function getSellableQty(baseQty, unit) {
  if (typeof baseQty !== 'number') return baseQty;
  const factor = Math.max(1, Number(unit?.conversionFactor) || 1);
  return Math.floor(baseQty / factor);
}

function StepBadge({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
          done ? 'bg-blue-500 text-white' : active ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-slate-200 text-slate-400',
        ].join(' ')}
      >
        {done ? '✓' : n}
      </div>
      <span className={`text-sm ${active ? 'font-bold text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function Step1({ onCreated }) {
  const [mode, setMode] = useState('existing');
  const [customers, setCustomers] = useState([]);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [form, setForm] = useState({ code: '', customerPhone: '', customerName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    CustomerApi.getCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const change = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const handleSelectCustomer = (custId) => {
    setSelectedCustId(custId);
    const customer = customers.find((item) => String(item.id) === String(custId));
    if (customer) {
      setForm((current) => ({
        ...current,
        customerName: customer.fullName || customer.name || '',
        customerPhone: customer.phone || '',
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
        customerName: form.customerName.trim() || undefined,
      };
      if (mode === 'existing' && selectedCustId) payload.customerId = Number(selectedCustId);
      const invoice = await SalesApi.createInvoice(payload);
      onCreated(invoice);
    } catch (err) {
      setError(err?.message || 'Tạo hóa đơn thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Thông tin khách hàng</h3>

        <div className="mb-4 flex gap-2">
          {[
            ['existing', 'Chọn khách hàng có sẵn'],
            ['new', 'Khách vãng lai / tạo mới'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setMode(value); setError(null); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${mode === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Mã hóa đơn</label>
          <input className="input w-full" name="code" placeholder="Để trống để hệ thống tự tạo" value={form.code} onChange={change} />
        </div>

        {mode === 'existing' && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">Chọn khách hàng</label>
            <select className="select w-full" value={selectedCustId} onChange={(e) => handleSelectCustomer(e.target.value)}>
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName || customer.name}{customer.phone ? ` — ${customer.phone}` : ''}{customer.customerType === 'PHARMACY' ? ' (Sỉ)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'new' && (
          <div className="mb-3 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input className="input w-full" name="customerPhone" type="tel" placeholder="0901234567" value={form.customerPhone} onChange={change} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Tên khách</label>
              <input className="input w-full" name="customerName" placeholder="Nguyễn Văn A" value={form.customerName} onChange={change} />
            </div>
          </div>
        )}

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4">
          <Button type="submit" loading={loading}>Tạo hóa đơn →</Button>
        </div>
      </div>
    </form>
  );
}

function Step2({ invoice, items, onItemAdded, onNext }) {
  const [query, setQuery] = useState('');
  const [allMeds, setAllMeds] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedUnitCode, setSelectedUnitCode] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingQty, setEditingQty] = useState(1);
  const [rowActionErr, setRowActionErr] = useState(null);
  const debounceRef = useRef(null);

  const loadMedicines = useCallback(async (q = '') => {
    setLoading(true);
    setLoadErr(null);
    try {
      const [meds, stock] = await Promise.all([
        CatalogApi.searchMedicines(q),
        InventoryApi.getSummary().catch(() => []),
      ]);
      setAllMeds(Array.isArray(meds) ? meds : []);
      const nextStockMap = {};
      (Array.isArray(stock) ? stock : []).forEach((item) => {
        nextStockMap[item.medicineId] = item.availableQty ?? 0;
      });
      setStockMap(nextStockMap);
    } catch {
      setLoadErr('Không tải được danh sách thuốc.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines('');
  }, [loadMedicines]);

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allMeds;
    return allMeds.filter((medicine) =>
      (medicine.name || '').toLowerCase().includes(q)
      || (medicine.code || '').toLowerCase().includes(q)
      || String(medicine.id).includes(q)
    );
  }, [allMeds, query]);

  const selectedUnits = useMemo(() => normalizeUnits(selected), [selected]);

  useEffect(() => {
    if (!selected) {
      setSelectedUnitCode('');
      return;
    }
    const defaultUnit = resolveDefaultUnit(selectedUnits);
    setSelectedUnitCode(defaultUnit?.unitCode || '');
  }, [selected, selectedUnits]);

  const selectedUnit = useMemo(
    () => selectedUnits.find((unit) => unit.unitCode === selectedUnitCode) || resolveDefaultUnit(selectedUnits),
    [selectedUnits, selectedUnitCode]
  );

  const available = selected
    ? getSellableQty(stockMap[selected.id] ?? 0, selectedUnit)
    : 0;

  const pricing = useMemo(
    () => resolveUnitPricing(selectedUnit, selected?.salePrice, qty),
    [selectedUnit, selected?.salePrice, qty]
  );

  const handleSearch = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadMedicines(nextQuery), 300);
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditingQty(item.qty);
    setRowActionErr(null);
  };

  const saveEdit = async (item) => {
    if (editingQty < 1) return;
    setLoading(true);
    setRowActionErr(null);
    try {
      await SalesApi.updateInvoiceItemQty(invoice.id, item.id, Number(editingQty));
      setEditingItemId(null);
      await onItemAdded();
    } catch (err) {
      setRowActionErr(err?.message || 'Lỗi cập nhật số lượng');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm('Xóa sản phẩm này khỏi hóa đơn?')) return;
    setLoading(true);
    setRowActionErr(null);
    try {
      await SalesApi.removeInvoiceItem(invoice.id, itemId);
      await onItemAdded();
    } catch (err) {
      setRowActionErr(err?.message || 'Lỗi xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!selected || !selectedUnit || qty < 1) return;
    if (typeof available === 'number' && qty > available) {
      setAddErr(`Không đủ tồn kho. Tồn khả dụng: ${available} ${selectedUnit.unitLabel}`);
      return;
    }
    setAdding(true);
    setAddErr(null);
    try {
      await SalesApi.addInvoiceItem(invoice.id, {
        medicineId: selected.id,
        qty: Number(qty),
        unitCode: selectedUnit.unitCode,
        unitLabel: selectedUnit.unitLabel,
        conversionFactor: selectedUnit.conversionFactor || 1,
        saleMode: pricing.saleMode,
      });
      await onItemAdded();
      setSelected(null);
      setQty(1);
    } catch (err) {
      setAddErr(err?.message || 'Thêm sản phẩm thất bại');
    } finally {
      setAdding(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Chọn thuốc</h3>
        <input className="input mb-3 w-full" placeholder="Tìm theo tên, mã hoặc ID..." value={query} onChange={handleSearch} />

        {selected && selectedUnit && (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <div className="text-xs text-slate-500">Đã chọn</div>
                <div className="text-sm font-bold">{selected.name}</div>
                <div className="mt-1 text-[11px] text-slate-500">#{selected.id} · {selected.code || '—'}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700">
                    Đơn vị: {selectedUnit.unitLabel}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700">
                    Tồn khả dụng: {available} {selectedUnit.unitLabel}
                  </span>
                  <span className={`rounded-full px-2 py-1 font-semibold ${pricing.saleMode === 'WHOLESALE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {SALE_MODE_LABEL[pricing.saleMode]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Đơn vị bán</label>
                  <select className="select min-w-[150px]" value={selectedUnitCode} onChange={(e) => setSelectedUnitCode(e.target.value)}>
                    {selectedUnits.map((unit) => (
                      <option key={unit.unitCode} value={unit.unitCode}>
                        {unit.unitLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Số lượng</label>
                  <input type="number" min={1} className="input w-24" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div className="min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="text-[11px] text-slate-500">Đơn giá</div>
                  <div className="text-sm font-bold text-blue-600">{fmt(pricing.unitPrice)}</div>
                </div>
                <Button onClick={addItem} loading={adding} size="sm">+ Thêm vào hóa đơn</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Bỏ chọn</Button>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              1 {selectedUnit.unitLabel} = {selectedUnit.conversionFactor || 1} đơn vị gốc.
              {pricing.hasWholesale && pricing.wholesaleMinQty != null && (
                <span> Giá sỉ áp từ {pricing.wholesaleMinQty} {selectedUnit.unitLabel} trên dòng hàng này.</span>
              )}
            </div>

            {addErr && <div className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">{addErr}</div>}
          </div>
        )}

        {loading && !allMeds.length ? (
          <div className="py-6 text-center text-sm text-slate-500">Đang tải danh sách thuốc...</div>
        ) : loadErr ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadErr}</div>
        ) : visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">Không tìm thấy thuốc phù hợp.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500" style={{ gridTemplateColumns: '1fr 90px 120px 100px 90px' }}>
              <span>Tên thuốc</span>
              <span className="text-center">Mã</span>
              <span className="text-center">Đơn vị mặc định</span>
              <span className="text-right">Giá</span>
              <span className="text-right">Tồn</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {visible.map((medicine) => {
                const defaultUnit = resolveDefaultUnit(normalizeUnits(medicine));
                const defaultPrice = resolveUnitPricing(defaultUnit, medicine.salePrice, 1).unitPrice;
                const stock = getSellableQty(stockMap[medicine.id] ?? 0, defaultUnit);
                const isSelected = selected?.id === medicine.id;
                return (
                  <div
                    key={medicine.id}
                    onClick={() => { setSelected(medicine); setQty(1); setAddErr(null); }}
                    className={`grid cursor-pointer border-b border-slate-100 px-4 py-2.5 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    style={{ gridTemplateColumns: '1fr 90px 120px 100px 90px' }}
                  >
                    <div>
                      <div className="text-sm font-semibold">{medicine.name}</div>
                      <div className="text-[11px] text-slate-400">#{medicine.id}</div>
                    </div>
                    <div className="self-center text-center text-xs text-slate-500">{medicine.code || '—'}</div>
                    <div className="self-center text-center text-xs text-slate-500">{defaultUnit?.unitLabel || medicine.unit || '—'}</div>
                    <div className="self-center text-right text-xs font-semibold text-blue-600">{fmt(defaultPrice)}</div>
                    <div className={`self-center text-right text-xs font-bold ${stock <= 0 ? 'text-red-600' : stock < 10 ? 'text-amber-600' : 'text-blue-600'}`}>{stock}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Danh sách sản phẩm ({items.length})</h3>
        {rowActionErr && <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{rowActionErr}</div>}

        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">Chưa có sản phẩm nào trong hóa đơn.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Thuốc</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">SL</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Đơn giá</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Thành tiền</th>
                    <th className="w-24 px-3 py-2 text-right text-xs font-semibold text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <tr key={item.id ?? index} className="border-b border-slate-100">
                        <td className="px-3 py-2">
                          <div className="font-semibold">{item.medicineName || `ID: ${item.medicineId}`}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.unitLabel || 'đơn vị'} · {SALE_MODE_LABEL[item.saleMode] || item.saleMode || 'RETAIL'}
                          </div>
                          {item.conversionFactor > 1 && (
                            <div className="text-[11px] text-slate-400">
                              1 {item.unitLabel || item.unitCode} = {item.conversionFactor} đơn vị gốc
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isEditing ? (
                            <input type="number" min={1} value={editingQty} onChange={(e) => setEditingQty(e.target.value)} className="input w-16 py-1 text-center text-sm" />
                          ) : item.qty}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">{fmt(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(item.lineTotal)}</td>
                        <td className="px-3 py-2 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <button onClick={() => saveEdit(item)} className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">✓</button>
                              <button onClick={() => setEditingItemId(null)} className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">✕</button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <button onClick={() => startEdit(item)} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">Sửa</button>
                              <button onClick={() => removeItem(item.id)} className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-100">Xóa</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-3 py-2.5 font-bold">Tổng cộng</td>
                    <td className="px-3 py-2.5 text-right text-base font-bold text-blue-600">{fmt(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={onNext} disabled={items.length === 0}>Checkout →</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step3({ invoice, items, onDone, onBack }) {
  const total = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const [checkout, setCheckout] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState(null);
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(total);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState(null);
  const [paid, setPaid] = useState(false);

  const doCheckout = async () => {
    setChecking(true);
    setCheckErr(null);
    try {
      const res = await SalesApi.checkoutInvoice(invoice.id);
      setCheckout(res);
      const grandTotal = res?.totalAmount ?? res?.grandTotal ?? null;
      if (grandTotal != null) setAmount(grandTotal);
    } catch (err) {
      setCheckErr(err?.message || 'Checkout thất bại');
    } finally {
      setChecking(false);
    }
  };

  const doPay = async () => {
    if (!amount || paying) return;
    setPaying(true);
    setPayErr(null);
    try {
      await SalesApi.payInvoice(invoice.id, { paymentMethod: method, amount: Number(amount) });
      setPaid(true);
    } catch (err) {
      setPayErr(err?.message || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-3 flex justify-center"><CheckCircle2 className="h-12 w-12 text-emerald-500" /></div>
        <h3 className="mb-2 text-xl font-bold text-blue-600">Thanh toán thành công</h3>
        <p className="mb-5 text-slate-500">Hóa đơn #{invoice.id} đã được ghi nhận.</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => window.open(`/print/invoices/${invoice.id}`, '_blank')}>In phiếu</Button>
          <Button variant="secondary" onClick={onDone}>Tạo hóa đơn mới</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Tổng kết hóa đơn #{invoice.id}</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Thuốc</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">SL</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? index} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <div>{item.medicineName || `ID:${item.medicineId}`}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.unitLabel || 'đơn vị'} · {SALE_MODE_LABEL[item.saleMode] || item.saleMode || 'RETAIL'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{item.qty}</td>
                  <td className="px-3 py-2 text-right">{fmt(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex justify-end">
          <div className="w-[240px] text-sm">
            <div className="flex justify-between py-1"><span>Tạm tính:</span><span>{fmt(total)}</span></div>
            <div className="flex justify-between border-t-2 border-slate-200 py-2 text-base font-bold text-blue-600">
              <span>Tổng thanh toán:</span>
              <span>{fmt(checkout?.totalAmount ?? checkout?.grandTotal ?? total)}</span>
            </div>
          </div>
        </div>

        {!checkout && (
          <div className="mt-2">
            {checkErr && <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{checkErr}</div>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>← Sửa đơn</Button>
              <Button onClick={doCheckout} loading={checking}>Xác nhận tổng tiền</Button>
            </div>
          </div>
        )}
      </div>

      {checkout && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Thanh toán</h3>
          <div className="mb-3 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phương thức</label>
              <select className="select w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="CASH">Tiền mặt</option>
                <option value="CARD">Thẻ ngân hàng</option>
                <option value="MOMO">MoMo</option>
                <option value="INSURANCE">Bảo hiểm y tế</option>
                <option value="TRANSFER">Chuyển khoản</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền thanh toán</label>
              <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-base font-bold text-blue-700">{fmt(amount)}</div>
            </div>
          </div>
          {payErr && <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{payErr}</div>}
          <Button onClick={doPay} loading={paying} disabled={!amount}>Xác nhận thanh toán</Button>
        </div>
      )}
    </div>
  );
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);

  const onCreated = (inv) => {
    setInvoice(inv);
    setStep(2);
  };

  const reloadItems = useCallback(async () => {
    if (!invoice) return;
    try {
      const res = await SalesApi.getInvoiceItems(invoice.id);
      setItems(Array.isArray(res) ? res : []);
    } catch {
      setItems([]);
    }
  }, [invoice]);

  useEffect(() => {
    reloadItems();
  }, [reloadItems]);

  const reset = () => {
    setStep(1);
    setInvoice(null);
    setItems([]);
  };

  const steps = [
    { n: 1, label: 'Thông tin KH' },
    { n: 2, label: 'Thêm thuốc' },
    { n: 3, label: 'Thanh toán' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pharma/invoices')}>← Danh sách HĐ</Button>
        <h2 className="flex-1 text-xl font-bold">Tạo hóa đơn mới</h2>
        {invoice && <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">HĐ #{invoice.id}</span>}
      </div>

      <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
        {steps.map((stepItem, index) => (
          <div key={stepItem.n} className="flex items-center gap-3">
            <StepBadge n={stepItem.n} label={stepItem.label} active={step === stepItem.n} done={step > stepItem.n} />
            {index < steps.length - 1 && <div className={`h-0.5 w-8 ${step > stepItem.n ? 'bg-blue-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && <Step1 onCreated={onCreated} />}
      {step === 2 && invoice && <Step2 invoice={invoice} items={items} onItemAdded={reloadItems} onNext={() => setStep(3)} />}
      {step === 3 && invoice && <Step3 invoice={invoice} items={items} onDone={reset} onBack={() => setStep(2)} />}
    </div>
  );
}
