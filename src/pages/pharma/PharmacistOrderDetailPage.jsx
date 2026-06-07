// File: src/pages/pharma/PharmacistOrderDetailPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, Package, PackageCheck, Truck, PartyPopper, XCircle, Ban, RotateCcw, Pill, Printer, Save, ArrowLeft } from 'lucide-react';
import { OrderApi } from '../../apis/order.api';
import { InventoryApi } from '../../apis/inventory.api';
import { CatalogApi } from '../../apis';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { StatusBadge, PAYMENT_STATUS_MAP } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';

const CATALOG_BASE = SERVICE_URLS.catalog;
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/* ──────── CONSTANTS ──────── */
const STEPS = [
  { key: 'PENDING_APPROVAL', label: 'Chờ duyệt',   Icon: ClipboardCheck, color: 'amber' },
  { key: 'CONFIRMED',        label: 'Xác nhận',     Icon: CheckCircle2, color: 'blue' },
  { key: 'PICKING',          label: 'Soạn hàng',    Icon: Package, color: 'violet' },
  { key: 'PACKING',          label: 'Đóng gói',     Icon: PackageCheck, color: 'indigo' },
  { key: 'SHIPPING',         label: 'Đang giao',    Icon: Truck, color: 'cyan' },
  { key: 'DELIVERED',        label: 'Đã giao',      Icon: PartyPopper, color: 'green' },
];

const TERMINAL = {
  REJECTED:  { label: 'Từ chối / Hủy', Icon: XCircle, cls: 'border-red-200 bg-red-50 text-red-700' },
  CANCELLED: { label: 'Đã hủy',        Icon: Ban, cls: 'border-red-200 bg-red-50 text-red-700' },
  RETURNED:  { label: 'Hoàn trả',      Icon: RotateCcw, cls: 'border-orange-200 bg-orange-50 text-orange-700' },
};

const PAYMENT_METHOD = {
  COD: 'COD (thanh toán khi nhận)', CASH: 'COD (tiền mặt)',
  ONLINE: 'Online (đã thanh toán)', BANK_TRANSFER: 'Chuyển khoản',
};

const STEP_COLORS = {
  amber: { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600', line: 'bg-amber-500' },
  blue: { bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-600', line: 'bg-blue-500' },
  violet: { bg: 'bg-violet-500', ring: 'ring-violet-200', text: 'text-violet-600', line: 'bg-violet-500' },
  indigo: { bg: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-600', line: 'bg-indigo-500' },
  cyan: { bg: 'bg-cyan-600', ring: 'ring-cyan-200', text: 'text-cyan-600', line: 'bg-cyan-600' },
  green: { bg: 'bg-blue-600', ring: 'ring-blue-200', text: 'text-blue-600', line: 'bg-blue-600' },
};

/* ──────── MAIN COMPONENT ──────── */
export function OrderProcessDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [acting, setActing] = useState(false);
  const [actErr, setActErr] = useState(null);
  const [stockInfo, setStockInfo] = useState({});
  const [medicines, setMedicines] = useState([]);

  const medImageMap = useMemo(() => {
    const map = {};
    medicines.forEach(m => { if (m.id) map[m.id] = m.imageUrl || null; });
    return map;
  }, [medicines]);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustItems, setAdjustItems] = useState([]);
  const [adjustNote, setAdjustNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [pickItems, setPickItems] = useState([]);
  const [showShipForm, setShowShipForm] = useState(false);
  const [carrier, setCarrier] = useState('GIAO_HANG_NHANH');
  const [trackingCode, setTrackingCode] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [shipperPhone, setShipperPhone] = useState('');
  const [shipNotes, setShipNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadStock = (items) => {
    if (!items?.length) return;
    const ids = [...new Set(items.map(it => it.medicineId))];
    Promise.all(ids.map(mid => InventoryApi.getSummary(mid).catch(() => []))).then(results => {
      const map = {};
      results.forEach((list, i) => {
        const arr = Array.isArray(list) ? list : [];
        const sum = arr.find(s => s.medicineId === ids[i]);
        map[ids[i]] = sum?.availableQty ?? sum?.available ?? '?';
      });
      setStockInfo(map);
    });
  };

  const reload = () => {
    setLoading(true);
    Promise.all([OrderApi.pharmacistOrderDetail(id), CatalogApi.getMedicines().catch(() => [])])
      .then(([o, meds]) => { setOrder(o); loadStock(o.items); setMedicines(Array.isArray(meds) ? meds : []); })
      .catch(e => setErr(e?.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, [id]);

  const act = async (fn) => {
    setActing(true); setActErr(null);
    try { const result = await fn(); setOrder(result); loadStock(result?.items); }
    catch (e) { setActErr(e?.response?.data?.message || e?.message || 'Thao tác thất bại'); }
    finally { setActing(false); }
  };

  if (loading) return <div className="py-16 text-center text-slate-400">Đang tải...</div>;
  if (err || !order) return <div className="py-16 text-red-600">⚠ {err} <Link to="/pharma/orders" className="text-blue-600 underline">← Quay lại</Link></div>;

  const stepIdx = STEPS.findIndex(s => s.key === order.status);
  const isTerminal = !!TERMINAL[order.status];
  const termInfo = TERMINAL[order.status];

  return (
    <div className="mx-auto max-w-[960px] space-y-4">
      <Link to="/pharma/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">← Danh sách đơn</Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* ── HEADER ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Đơn #{order.id} — {order.buyerName || `KH #${order.buyerId}`}</h2>
          <div className="flex gap-2">
            {order.paymentStatus && <StatusBadge status={order.paymentStatus} map={PAYMENT_STATUS_MAP} />}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod || '—'}
            </span>
          </div>
        </div>

        {/* ── TIMELINE/STEPPER ── */}
        {isTerminal ? (
          <div className={`mb-5 flex items-center gap-3 rounded-xl border p-4 ${termInfo.cls}`}>
            <termInfo.Icon className="h-6 w-6" />
            <div>
              <div className="font-bold">{termInfo.label}</div>
              {order.rejectionReason && <div className="text-xs opacity-75">Lý do: {order.rejectionReason}</div>}
              {order.returnReason && <div className="text-xs opacity-75">Lý do: {order.returnReason}</div>}
              {order.returnedAt && <div className="text-xs opacity-75">Lúc: {new Date(order.returnedAt).toLocaleString('vi-VN')}</div>}
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-center overflow-x-auto pb-2">
            {STEPS.map((step, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const sc = STEP_COLORS[step.color];
              return (
                <div key={step.key} className="flex flex-1 items-center min-w-[100px]">
                  <div className="flex-1 text-center">
                    <div className={[
                      'mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                      done || active ? `${sc.bg} text-white` : 'bg-slate-200 text-slate-400',
                      active ? `ring-4 ${sc.ring}` : '',
                    ].join(' ')}>
                      {done ? '✓' : <step.Icon className="h-4 w-4" />}
                    </div>
                    <div className={`text-[11px] ${active ? `${sc.text} font-bold` : done ? 'text-slate-600' : 'text-slate-400'}`}>
                      {step.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 min-w-4 flex-[0.5] ${done ? sc.line : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── COUPON ── */}
        {order.couponCode && (
          <div className="mb-4 rounded-xl bg-blue-50 px-4 py-2.5 text-sm">
            🎫 Mã coupon: <strong>{order.couponCode}</strong>
            {order.discount > 0 && <span> • Giảm: <strong>{fmt(order.discount)}</strong></span>}
          </div>
        )}

        {/* ── ITEMS TABLE ── */}
        <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-600"><Package className="h-4 w-4" /> Sản phẩm</h3>
        <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Thuốc</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">SL</th>
                {order.status === 'PICKING' && <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">SL gốc</th>}
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Đơn giá</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Thành tiền</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">Tồn</th>
                {order.status === 'PICKING' && <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500">✔</th>}
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it, i) => {
                const stock = stockInfo[it.medicineId];
                const lowStock = typeof stock === 'number' && stock < it.qty;
                const imgSrc = resolveImageUrl(medImageMap[it.medicineId]);
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                          {imgSrc ? <img src={imgSrc} alt={it.medicineName} className="h-full w-full object-cover" onError={e => { e.target.style.display = 'none'; }} /> : null}
                          {!imgSrc && <Pill className="h-4 w-4 text-slate-400" />}
                        </div>
                        <div>
                          {it.medicineName}
                          {it.priceTier && <span className="ml-1.5 text-[10px] text-slate-400">{it.priceTier}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold">{it.qty}</td>
                    {order.status === 'PICKING' && (
                      <td className="px-3 py-2.5 text-center text-xs text-slate-400">
                        {it.originalQty && it.originalQty !== it.qty ? it.originalQty : '—'}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right">{fmt(it.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(it.lineTotal)}</td>
                    <td className={`px-3 py-2.5 text-center ${lowStock ? 'font-bold text-red-600' : 'text-blue-600'}`}>
                      {stock ?? '...'}{lowStock && ' ⚠'}
                    </td>
                    {order.status === 'PICKING' && (
                      <td className="px-3 py-2.5 text-center">
                        {it.fulfilled ? <span className="font-bold text-blue-600">✔</span> : <span className="text-slate-400">○</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <div className="mb-5 text-right">
          <div className="text-sm text-slate-500">Tạm tính: {fmt(order.subtotal)}</div>
          {order.discount > 0 && <div className="text-sm text-blue-600">Giảm: -{fmt(order.discount)}</div>}
          <div className="text-lg font-bold">Tổng: <span className="text-blue-600">{fmt(order.total)}</span></div>
        </div>

        {/* ── INFO BLOCK ── */}
        <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div><b>Địa chỉ giao:</b> {order.shippingAddress || '—'}</div>
          <div><b>Thanh toán:</b> {PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod || '—'}</div>
          {order.notes && <div><b>Ghi chú:</b> <span className="whitespace-pre-line">{order.notes}</span></div>}
          {order.carrier && (
            <div className="mt-2 border-t border-slate-200 pt-2">
              <b>🚚 Vận chuyển:</b> {order.carrier}
              {order.trackingCode && <span> • Mã vận đơn: <strong>{order.trackingCode}</strong></span>}
              {order.shipperName && <span> • Shipper: <strong>{order.shipperName}</strong></span>}
              {order.shipperPhone && <span> ({order.shipperPhone})</span>}
              {order.shippedAt && <span> • Giao lúc: {new Date(order.shippedAt).toLocaleString('vi-VN')}</span>}
            </div>
          )}
          {order.deliveredAt && <div className="mt-2 text-blue-600"><b>Đã giao thành công:</b> {new Date(order.deliveredAt).toLocaleString('vi-VN')}</div>}
        </div>

        {/* ── ERROR ── */}
        {actErr && (
          <div className="mb-3 overflow-hidden rounded-xl">
            {actErr.includes('INSUFFICIENT_STOCK') ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 font-bold text-red-700">⚠ Không đủ tồn kho</div>
                <div className="text-sm text-red-800">
                  {actErr.split('|').slice(1).join('').split(';').filter(Boolean).map((item, i) => (
                    <div key={i} className="mb-1">• {item.trim()}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠ {actErr}</div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            STEP-SPECIFIC ACTION PANELS
           ════════════════════════════════════ */}

        {/* ── STEP 1: PENDING_APPROVAL ── */}
        {order.status === 'PENDING_APPROVAL' && (
          <StepPanel title="Bước 1 — Xét duyệt đơn hàng" color="amber">
            {showAdjust ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-2.5 text-sm font-semibold">Điều chỉnh đơn</h4>
                {adjustItems.map((adj, i) => {
                  const orig = order.items.find(it => it.id === adj.itemId);
                  return (
                    <div key={i} className="mb-2 grid grid-cols-[1fr_80px_120px] items-center gap-2">
                      <div className="text-sm">{orig?.medicineName}</div>
                      <input type="number" min={1} value={adj.newQty}
                        onChange={e => { const n = [...adjustItems]; n[i] = { ...adj, newQty: Number(e.target.value) }; setAdjustItems(n); }}
                        className="input py-1.5 text-center text-sm" />
                      <input type="number" step="0.01" value={adj.newPrice}
                        onChange={e => { const n = [...adjustItems]; n[i] = { ...adj, newPrice: Number(e.target.value) }; setAdjustItems(n); }}
                        className="input py-1.5 text-right text-sm" />
                    </div>
                  );
                })}
                <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Lý do điều chỉnh..."
                  className="input mb-2 w-full text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => act(async () => { const r = await OrderApi.adjustOrder(id, { items: adjustItems, adjustNote }); setShowAdjust(false); return r; })} disabled={acting}>Lưu</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdjust(false)}>Hủy</Button>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={() => act(() => OrderApi.approve(id))} disabled={acting}>Duyệt đơn</Button>
              <Button variant="secondary" onClick={() => { setAdjustItems(order.items.map(it => ({ itemId: it.id, newQty: it.qty, newPrice: it.unitPrice }))); setShowAdjust(true); }} disabled={acting}>Điều chỉnh</Button>
              <div className="flex flex-1 gap-2">
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Lý do từ chối..." className="input flex-1 text-sm" />
                <Button variant="ghost" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => act(() => OrderApi.reject(id, rejectReason))} disabled={acting || !rejectReason.trim()}>Từ chối</Button>
              </div>
            </div>
          </StepPanel>
        )}

        {/* ── STEP 2: CONFIRMED ── */}
        {order.status === 'CONFIRMED' && (
          <StepPanel title="Bước 2 — Bắt đầu soạn hàng" color="blue">
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={() => act(() => OrderApi.updateStatus(id, 'PICKING'))} disabled={acting}>Bắt đầu soạn hàng</Button>
              <CancelBtn orderId={id} reason={cancelReason} setReason={setCancelReason} acting={acting} act={act} />
            </div>
          </StepPanel>
        )}

        {/* ── STEP 3: PICKING ── */}
        {order.status === 'PICKING' && (
          <StepPanel title="Bước 3 — Soạn hàng (Picking)" color="violet">
            <div className="mb-3">
              <Button variant="secondary" onClick={() => {
                const w = window.open('', '_blank', 'width=800,height=600');
                w.document.write(`<html><head><title>Phiếu soạn hàng - Đơn #${order.id}</title>
                  <style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px}
                  h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:16px 0}
                  th,td{border:1px solid #ccc;padding:8px;text-align:left}
                  th{background:#f0f0f0;font-weight:700}.right{text-align:right}
                  .center{text-align:center}.check{width:40px}.header{display:flex;justify-content:space-between}
                  @media print{button{display:none!important}}</style></head><body>
                  <div class="header"><div><h2>📋 PHIẾU SOẠN HÀNG</h2>
                  <div>Đơn #${order.id} — ${order.buyerName || 'KH #' + order.buyerId}</div>
                  <div style="color:#666">Ngày: ${new Date().toLocaleString('vi-VN')}</div></div>
                  <div style="text-align:right"><div><b>Địa chỉ:</b> ${order.shippingAddress || '—'}</div>
                  <div><b>Thanh toán:</b> ${PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod || '—'}</div>
                  ${order.notes ? '<div><b>Ghi chú:</b> ' + order.notes + '</div>' : ''}</div></div>
                  <table><thead><tr><th>STT</th><th>Tên thuốc</th><th class="center">SL cần lấy</th>
                  <th class="right">Đơn giá</th><th class="right">Thành tiền</th><th class="check">✔</th></tr></thead><tbody>
                  ${(order.items || []).map((it, i) => '<tr><td>' + (i + 1) + '</td><td>' + it.medicineName + '</td><td class="center"><b>' + it.qty + '</b></td><td class="right">' + (it.unitPrice?.toLocaleString?.('vi-VN') || '') + '</td><td class="right">' + (it.lineTotal?.toLocaleString?.('vi-VN') || '') + '</td><td class="check">☐</td></tr>').join('')}
                  </tbody></table>
                  <div style="text-align:right;font-size:16px"><b>Tổng: ${order.total?.toLocaleString?.('vi-VN')} VND</b></div>
                  <div style="margin-top:32px;display:flex;justify-content:space-between">
                  <div>Người soạn: _____________</div><div>Ký xác nhận: _____________</div></div>
                  <br/><button onclick="window.print()" style="padding:10px 24px;cursor:pointer;font-size:14px">🖨 In phiếu</button>
                  </body></html>`);
                w.document.close();
              }}><Printer className="mr-1.5 inline h-4 w-4" /> In phiếu soạn hàng</Button>
            </div>

            {/* Picking checklist */}
            <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <h4 className="mb-2 text-sm font-semibold">Checklist soạn hàng</h4>
              <div className="mb-3 text-xs text-violet-700">Tick ✔ khi đã lấy đủ. Giảm SL nếu thiếu hàng. Bấm "Lưu" khi hoàn tất.</div>
              {(() => {
                if (pickItems.length === 0 && order.items?.length > 0) {
                  const initial = order.items.map(it => ({ itemId: it.id, actualQty: it.qty, fulfilled: it.fulfilled || false, medicineName: it.medicineName, originalQty: it.originalQty || it.qty }));
                  setTimeout(() => setPickItems(initial), 0);
                }
                return pickItems.map((pi, i) => (
                  <div key={i} className="mb-1.5 grid grid-cols-[1fr_80px_60px] items-center gap-2">
                    <div className={`text-sm ${pi.fulfilled ? 'text-blue-600' : 'text-slate-800'}`}>{pi.fulfilled && '✔ '}{pi.medicineName}</div>
                    <input type="number" min={0} max={pi.originalQty} value={pi.actualQty}
                      onChange={e => { const n = [...pickItems]; n[i] = { ...pi, actualQty: Math.max(0, Number(e.target.value)) }; setPickItems(n); }}
                      className="input py-1 text-center text-sm" />
                    <label className="flex cursor-pointer items-center gap-1 text-xs">
                      <input type="checkbox" checked={pi.fulfilled}
                        onChange={e => { const n = [...pickItems]; n[i] = { ...pi, fulfilled: e.target.checked }; setPickItems(n); }} />
                      Lấy
                    </label>
                  </div>
                ));
              })()}
              <div className="mt-3">
                <Button onClick={() => act(async () => {
                  const items = pickItems.map(pi => ({ itemId: pi.itemId, actualQty: pi.actualQty, fulfilled: pi.fulfilled }));
                  const r = await OrderApi.partialFulfill(id, { items }); setPickItems([]); return r;
                })} disabled={acting}><Save className="mr-1.5 inline h-4 w-4" /> Lưu thay đổi</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button onClick={() => act(() => OrderApi.updateStatus(id, 'PACKING'))} disabled={acting}>Chuyển sang Đóng gói</Button>
              <CancelBtn orderId={id} reason={cancelReason} setReason={setCancelReason} acting={acting} act={act} />
            </div>
          </StepPanel>
        )}

        {/* ── STEP 4: PACKING ── */}
        {order.status === 'PACKING' && (
          <StepPanel title="Bước 4 — Đóng gói & Giao shipper" color="indigo">
            {showShipForm ? (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4" /> Tạo vận đơn</h4>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Đơn vị vận chuyển</label>
                    <select value={carrier} onChange={e => setCarrier(e.target.value)} className="select w-full text-sm">
                      <option value="GIAO_HANG_NHANH">GHN (nội thành)</option>
                      <option value="LIEN_TINH">Liên tỉnh</option>
                      <option value="NOI_BO">Nội bộ</option>
                      <option value="GRAB">Grab Express</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Mã vận đơn</label>
                    <input value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="VD: GHN123456..." className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Tên shipper</label>
                    <input value={shipperName} onChange={e => setShipperName(e.target.value)} placeholder="Tên người giao..." className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">SĐT shipper</label>
                    <input value={shipperPhone} onChange={e => setShipperPhone(e.target.value)} placeholder="09xx..." className="input w-full text-sm" />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="mb-1 block text-xs text-slate-600">Ghi chú vận chuyển</label>
                  <input value={shipNotes} onChange={e => setShipNotes(e.target.value)} placeholder="Ghi chú (tùy chọn)..." className="input w-full text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => act(async () => { const r = await OrderApi.shipOrder(id, { carrier, trackingCode, shipperName, shipperPhone, notes: shipNotes }); setShowShipForm(false); return r; })} disabled={acting}>Giao hàng</Button>
                  <Button variant="ghost" onClick={() => setShowShipForm(false)}>Hủy</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                <Button onClick={() => setShowShipForm(true)} disabled={acting}><Truck className="mr-1.5 inline h-4 w-4" /> Tạo vận đơn</Button>
                <CancelBtn orderId={id} reason={cancelReason} setReason={setCancelReason} acting={acting} act={act} />
              </div>
            )}
          </StepPanel>
        )}

        {/* ── STEP 5: SHIPPING ── */}
        {order.status === 'SHIPPING' && (
          <StepPanel title="Bước 5 — Kết quả giao hàng" color="cyan">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button onClick={() => act(() => OrderApi.deliveryResult(id, { success: true }))} disabled={acting}>Giao thành công</Button>
              <div className="flex flex-1 gap-2">
                <input value={failureReason} onChange={e => setFailureReason(e.target.value)} placeholder="Lý do giao thất bại..." className="input flex-1 text-sm" />
                <Button variant="ghost" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => { if (!confirm('Xác nhận giao THẤT BẠI? Tồn kho sẽ được hoàn lại.')) return; act(() => OrderApi.deliveryResult(id, { success: false, failureReason })); }} disabled={acting || !failureReason.trim()}>Giao thất bại</Button>
              </div>
            </div>
          </StepPanel>
        )}

        {/* ── STEP 6: DELIVERED ── */}
        {order.status === 'DELIVERED' && (
          <StepPanel title="Bước 6 — Đã giao thành công" color="green">
            <div className="mb-3 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
              Đã giao thành công<strong></strong> — {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('vi-VN') : ''}
            </div>

            {(order.paymentMethod === 'COD' || order.paymentMethod === 'CASH') && order.paymentStatus === 'UNPAID' && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 font-bold text-amber-800">Xác nhận thanh toán COD</div>
                <div className="mb-2.5 text-sm text-amber-700">Đơn hàng COD — shipper đã thu <strong>{fmt(order.total)}</strong> chưa?</div>
                <Button size="sm" onClick={() => { if (!confirm('Xác nhận đã nhận đủ tiền COD cho đơn #' + order.id + '?')) return; act(() => OrderApi.confirmPayment(id)); }} disabled={acting}>Xác nhận đã thu tiền</Button>
              </div>
            )}

            {order.paymentStatus === 'PAID' && (
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <strong>Đã thanh toán</strong> — {PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Lý do hoàn trả..." className="input flex-1 text-sm" />
              <Button variant="ghost" className="!border-orange-200 !text-orange-600 hover:!bg-orange-50" onClick={() => { if (!confirm('Xác nhận HOÀN TRẢ đơn này? Tồn kho sẽ được hoàn lại, thanh toán chuyển sang REFUNDED.')) return; act(() => OrderApi.returnOrder(id, returnReason)); }} disabled={acting || !returnReason.trim()}><RotateCcw className="mr-1.5 inline h-4 w-4" /> Hoàn trả</Button>
            </div>
          </StepPanel>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════ */
const PANEL_COLORS = {
  amber: 'border-amber-200 bg-amber-50/50',
  blue: 'border-blue-200 bg-blue-50/50',
  violet: 'border-violet-200 bg-violet-50/50',
  indigo: 'border-indigo-200 bg-indigo-50/50',
  cyan: 'border-cyan-200 bg-cyan-50/50',
  green: 'border-blue-200 bg-blue-50/50',
};

const PANEL_TITLE_COLORS = {
  amber: 'text-amber-700 border-amber-200',
  blue: 'text-blue-700 border-blue-200',
  violet: 'text-violet-700 border-violet-200',
  indigo: 'text-indigo-700 border-indigo-200',
  cyan: 'text-cyan-700 border-cyan-200',
  green: 'text-blue-700 border-blue-200',
};

function StepPanel({ title, color, children }) {
  return (
    <div className={`mb-3 rounded-xl border-2 p-4 ${PANEL_COLORS[color] || ''}`}>
      <h4 className={`mb-3 border-b pb-2 text-sm font-semibold ${PANEL_TITLE_COLORS[color] || ''}`}>{title}</h4>
      {children}
    </div>
  );
}

/* Btn removed — replaced with design-system Button */

function CancelBtn({ orderId, reason, setReason, acting, act }) {
  return (
    <div className="flex flex-1 gap-2">
      <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do hủy đơn..." className="input flex-1 text-sm" />
      <Button variant="ghost" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => { if (!confirm('Bạn chắc chắn muốn HỦY đơn này?')) return; act(() => OrderApi.pharmacistCancel(orderId, reason)); }} disabled={acting || !reason.trim()}>Hủy đơn</Button>
    </div>
  );
}
