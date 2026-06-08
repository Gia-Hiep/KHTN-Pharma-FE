/**
 * CART — Checkout với QR VietQR và Stripe Elements
 * ---------------------------------------------------
 * COD          → bấm "Đặt hàng" → tạo đơn (UNPAID)
 * BANK_TRANSFER→ hiển thị QR → bấm "Tôi đã chuyển khoản" → tạo đơn (PAID)
 * STRIPE       → nhập thẻ qua Stripe Elements → thanh toán → tạo đơn (PAID)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrderApi } from '../../apis/order.api';
import { CartApi } from '../../apis/cart.api';
import { AuthApi } from '../../apis/auth.api';
import { WalletApi } from '../../apis/wallet.api';
import { SERVICE_URLS } from '../../apis/serviceUrls';

const CATALOG_BASE = SERVICE_URLS.catalog;
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const SALE_MODE_LABEL = {
  RETAIL: 'Giá lẻ',
  WHOLESALE: 'Giá sỉ',
};

function resolveSaleModeLabel(item) {
  return SALE_MODE_LABEL[item?.saleMode || item?.priceTier] || (item?.saleMode || item?.priceTier || 'RETAIL');
}

function buildOrderItemPayload(item) {
  const saleMode = item.saleMode || item.priceTier || 'RETAIL';
  return {
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    qty: item.qty,
    unitCode: item.unitCode,
    unitLabel: item.unitLabel,
    conversionFactor: item.conversionFactor,
    unitPrice: item.unitPrice,
    saleMode,
    priceTier: saleMode,
  };
}

const STRIPE_PK = 'pk_test_51RI4f2Q80QOpGXu04Y1Gc4MHIID8QYpWuQLT4EMSwdbpekWBmiFRNAuKSj9mDVBksbmPK8IbZyxkJ19wBgRmHUeu00ochwymQf';
const stripePromise = loadStripe(STRIPE_PK);

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/* ── VietQR config ── */
const VIETQR_BANK    = 'BIDV';
const VIETQR_ACCOUNT = '96247A5YJ2';
const VIETQR_NAME    = 'PHAM GIA HIEP';

function buildQrUrl(amount, orderId) {
  const addInfo = encodeURIComponent(`DH${orderId}`);
  const name    = encodeURIComponent(VIETQR_NAME);
  return `https://img.vietqr.io/image/${VIETQR_BANK}-${VIETQR_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${name}`;
}

/* ── SVG Icons ── */
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MinusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

/* ── Confirm Modal ── */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary" aria-label="Hủy" disabled={loading}>
            Hủy
          </button>
          <button onClick={onConfirm} className="btn-primary" aria-label="Xác nhận đặt hàng" disabled={loading}>
            {loading ? (
              <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang xử lý...</>
            ) : 'Xác nhận đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Method Radio ── */
const PAYMENT_METHODS_BASE = [
  { value: 'COD', label: '🚚 COD — Thanh toán khi nhận hàng', desc: 'Trả tiền mặt khi nhận hàng' },
  { value: 'BANK_TRANSFER', label: '🏦 Chuyển khoản / QR VietQR', desc: 'Quét mã QR để thanh toán trước' },
  { value: 'STRIPE', label: '💳 Thẻ quốc tế (Stripe)', desc: 'Visa, Mastercard, JCB...' },
];

// ─── Main CartPage ───────────────────────────────────────────────────────────
export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart]             = useState([]);
  const [loading, setLoading]      = useState(true);
  const [selected, setSelected]    = useState(new Set());
  const [address, setAddress]      = useState('');
  const [method, setMethod]        = useState('COD');
  const [notes, setNotes]          = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [placing, setPlacing]      = useState(false);
  const [err, setErr]              = useState(null);
  const [buyerName, setBuyerName]  = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState(null);

  // Bank Transfer: payment waiting
  const [waitingOrder, setWaitingOrder] = useState(null); // {id, total} — khi đang chờ thanh toán
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 phút
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(0);

  /* ── Load cart from API ── */
  const loadCart = useCallback(async () => {
    try {
      const data = await CartApi.getCart();
      const items = data?.items || [];
      setCart(items);
      setSelected(new Set(items.map((_, i) => i)));
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  useEffect(() => {
    AuthApi.getProfile().then(res => {
      const p = res?.data || res;
      setBuyerName(p?.fullName || '');
    }).catch(() => {});
    // Load wallet balance
    WalletApi.getBalance().then(res => {
      setWalletBalance(res?.balance || 0);
    }).catch(() => {});
  }, []);

  // Select helpers
  const toggleSelect = useCallback((idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected(prev =>
      prev.size === cart.length ? new Set() : new Set(cart.map((_, i) => i))
    );
  }, [cart.length]);

  const allSelected = selected.size === cart.length && cart.length > 0;

  // Cart operations — call API
  const update = useCallback(async (idx, qty) => {
    const item = cart[idx];
    if (!item || qty < 1) return;
    try {
      const data = await CartApi.updateQty(item.id, Math.max(1, qty));
      setCart(data?.items || []);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) {
      setErr(e?.message || 'Cập nhật số lượng thất bại');
    }
  }, [cart]);

  const remove = useCallback(async (idx) => {
    const item = cart[idx];
    if (!item) return;
    try {
      const data = await CartApi.removeItem(item.id);
      const items = data?.items || [];
      setCart(items);
      setSelected(prev => {
        const arr = [...prev].filter(i => i !== idx).map(i => i > idx ? i - 1 : i);
        return new Set(arr);
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) {
      setErr(e?.message || 'Xóa sản phẩm thất bại');
    }
  }, [cart]);

  // Calculations
  const subtotal = useMemo(
    () => cart.reduce((s, c, i) => selected.has(i) ? s + (c.unitPrice || 0) * c.qty : s, 0),
    [cart, selected]
  );

  const selectedItems = useMemo(
    () => cart.filter((_, i) => selected.has(i)),
    [cart, selected]
  );

  const isVietQR = method === 'BANK_TRANSFER';
  const isStripe = method === 'STRIPE';
  const isWallet = method === 'WALLET';

  // Build payment methods with wallet balance info
  const PAYMENT_METHODS = useMemo(() => [
    ...PAYMENT_METHODS_BASE,
    {
      value: 'WALLET',
      label: `💰 Ví — Số dư: ${fmt(walletBalance)}`,
      desc: walletBalance > 0 ? 'Thanh toán bằng số dư ví' : 'Chưa có số dư trong ví',
    },
  ], [walletBalance]);

  const qrUrl = useMemo(
    () => waitingOrder ? buildQrUrl(Math.round(waitingOrder.total || subtotal), waitingOrder.id) : null,
    [waitingOrder, subtotal]
  );

  /* Validation */
  const validate = useCallback(() => {
    if (!selectedItems.length) { setErr('Vui lòng chọn ít nhất 1 sản phẩm'); return false; }
    if (!address.trim()) { setErr('Vui lòng nhập địa chỉ giao hàng'); return false; }
    if (!method) { setErr('Vui lòng chọn phương thức thanh toán'); return false; }
    if (isWallet && walletBalance < subtotal) {
      setErr(`Số dư ví không đủ. Hiện có: ${fmt(walletBalance)}, cần: ${fmt(subtotal)}`);
      return false;
    }
    setErr(null);
    return true;
  }, [selectedItems.length, address, method, isWallet, walletBalance, subtotal]);

  /* Tạo đơn hàng */
  const placeOrder = useCallback(async (paymentStatus) => {
    setPlacing(true); setErr(null);
    try {
      const order = await OrderApi.createOrder({
        buyerName: buyerName || undefined,
        shippingAddress: address,
        paymentMethod: method,
        paymentStatus,
        notes,
        couponCode: couponCode.trim() || undefined,
        items: selectedItems.map(buildOrderItemPayload),
      });
      // Clear cart on server
      await CartApi.clearCart();
      window.dispatchEvent(new Event('cart-updated'));

      // BANK_TRANSFER: chuyển sang màn chờ thanh toán thay vì navigate
      if (method === 'BANK_TRANSFER') {
        setWaitingOrder({ id: order.id, total: order.total || subtotal });
        setPaymentConfirmed(false);
        setCountdown(600);
        setPlacing(false);
        setShowConfirm(false);
        return;
      }

      navigate(`/shop/orders/${order.id}`);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Đặt hàng thất bại');
      setPlacing(false);
      setShowConfirm(false);
    }
  }, [buyerName, address, method, notes, couponCode, selectedItems, navigate, subtotal]);

  const handlePlaceOrder = useCallback((paymentStatus) => {
    if (!validate()) return;
    setPendingPaymentStatus(paymentStatus);
    setShowConfirm(true);
  }, [validate]);

  const confirmOrder = useCallback(() => {
    if (pendingPaymentStatus) placeOrder(pendingPaymentStatus);
  }, [pendingPaymentStatus, placeOrder]);

  /* ── Polling payment status (SePay webhook) ── */
  useEffect(() => {
    if (!waitingOrder || paymentConfirmed) return;

    // Poll every 5 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const res = await OrderApi.pollPaymentStatus(waitingOrder.id);
        if (res.paymentStatus === 'PAID') {
          setPaymentConfirmed(true);
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          // Wait 2s to show success animation then redirect
          setTimeout(() => navigate(`/shop/orders/${waitingOrder.id}`), 2500);
        }
      } catch { /* ignore polling errors */ }
    }, 5000);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(countdownRef.current);
    };
  }, [waitingOrder, paymentConfirmed, navigate]);

  /* ── Simulate payment (dev/demo) ── */
  const simulatePayment = useCallback(async () => {
    if (!waitingOrder) return;
    try {
      await OrderApi.simulateSePayPayment(waitingOrder.id);
    } catch (e) {
      setErr(e?.message || 'Simulate failed');
    }
  }, [waitingOrder]);

  /* ── Loading State ── */
  if (loading) return (
    <div className="card">
      <div className="card-body py-20 text-center">
        <span className="spinner" /> Đang tải giỏ hàng...
      </div>
    </div>
  );

  /* ── Empty Cart ── */
  if (!cart.length && !waitingOrder) return (
    <div className="card">
      <div className="card-body py-20 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-5xl">
          🛒
        </div>
        <h3 className="text-xl font-bold text-slate-900">Giỏ hàng trống</h3>
        <p className="mt-2 text-sm text-slate-500">Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm.</p>
        <Link to="/shop/medicines" className="btn-primary mt-6 inline-flex" aria-label="Tìm thuốc để mua">
          → Tiếp tục mua hàng
        </Link>
      </div>
    </div>
  );

  /* ── Payment Waiting Screen (BANK_TRANSFER) ── */
  if (waitingOrder) {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-5 text-center ${paymentConfirmed ? 'bg-green-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            {paymentConfirmed ? (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-700">Thanh toán thành công!</h2>
                <p className="mt-1 text-sm text-green-600">Đang chuyển đến chi tiết đơn hàng...</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <span className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Đang chờ thanh toán...</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Đơn hàng <strong className="text-blue-600">#{waitingOrder.id}</strong> · {fmt(waitingOrder.total)}
                </p>
              </>
            )}
          </div>

          {/* QR Code */}
          {!paymentConfirmed && (
            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                <div className="mb-2 text-sm font-bold text-amber-800">Quét mã QR để chuyển khoản</div>
                <div className="mb-3 text-xs text-amber-700">
                  NH: <strong>{VIETQR_BANK}</strong> — TK: <strong>{VIETQR_ACCOUNT}</strong> — Nội dung: <strong>DH{waitingOrder.id}</strong>
                </div>
                {qrUrl && (
                  <img src={qrUrl} alt="QR VietQR" className="mx-auto h-56 w-56 rounded-xl border border-slate-200" />
                )}
              </div>

              {/* Countdown */}
              {countdown > 0 ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    Tự động kiểm tra · Còn {mins}:{secs.toString().padStart(2, '0')}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-center text-sm text-orange-700">
                  Hết thời gian chờ. Nếu bạn đã chuyển khoản, hệ thống sẽ tự xác nhận sau.
                  <button
                    onClick={() => navigate(`/shop/orders/${waitingOrder.id}`)}
                    className="mt-2 block w-full rounded-lg bg-orange-100 px-4 py-2 font-semibold text-orange-800 hover:bg-orange-200 transition-colors"
                  >
                    Xem đơn hàng →
                  </button>
                </div>
              )}

              {/* Simulate button (demo) */}
              <button
                onClick={simulatePayment}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-2.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-100 hover:border-slate-400"
              >
                🧪 Simulate thanh toán (Demo)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">🛒 Giỏ hàng</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── LEFT: Cart Items ── */}
        <div className="space-y-4">
          {/* Select All */}
          <div className="card">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                aria-label="Chọn tất cả sản phẩm"
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Chọn tất cả ({cart.length} sản phẩm)
              </label>
            </div>
          </div>

          {/* Items */}
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {cart.map((c, i) => (
              <div key={c.id || i} className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50/50 md:gap-4 md:p-6">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600"
                  aria-label={`Chọn ${c.medicineName}`}
                />

                {/* Product Thumbnail */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {resolveImageUrl(c.imageUrl) ? (
                    <img
                      src={resolveImageUrl(c.imageUrl)}
                      alt={c.medicineName}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className={`${resolveImageUrl(c.imageUrl) ? 'hidden' : 'flex'} h-full w-full items-center justify-center text-2xl`}>
                    💊
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">{c.medicineName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {fmt(c.unitPrice)} / {c.unitLabel || 'đơn vị'} · {resolveSaleModeLabel(c)}
                  </div>
                  {c.conversionFactor > 1 && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      1 {c.unitLabel || c.unitCode} = {c.conversionFactor} đơn vị gốc
                    </div>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => update(i, c.qty - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                    aria-label="Giảm số lượng"
                    disabled={c.qty <= 1}
                  >
                    <MinusIcon />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={c.qty}
                    onChange={e => update(i, Number(e.target.value))}
                    className="h-8 w-14 rounded-lg border border-slate-200 text-center text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                    aria-label={`Số lượng ${c.medicineName}`}
                  />
                  <button
                    onClick={() => update(i, c.qty + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                    aria-label="Tăng số lượng"
                  >
                    <PlusIcon />
                  </button>
                </div>

                {/* Line total */}
                <div className="w-24 text-right font-bold text-blue-600">
                  {fmt(c.unitPrice * c.qty)}
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(i)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-95"
                  aria-label={`Xóa ${c.medicineName}`}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          {/* ── Shipping & Payment ── */}
          <div className="card">
            <div className="card-body space-y-4">
              <h3 className="text-base font-bold text-slate-900">Thông tin giao hàng</h3>

              <div>
                <label htmlFor="cart-address" className="mb-1.5 block text-sm font-medium text-slate-700">Địa chỉ giao *</label>
                <input
                  id="cart-address"
                  className="input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường, quận..."
                  aria-label="Địa chỉ giao hàng"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phương thức thanh toán *</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => (
                    <label
                      key={pm.value}
                      className={[
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200',
                        method === pm.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={pm.value}
                        checked={method === pm.value}
                        onChange={() => setMethod(pm.value)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{pm.label}</div>
                        <div className="text-xs text-slate-500">{pm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="cart-coupon" className="mb-1.5 block text-sm font-medium text-slate-700">Mã giảm giá</label>
                <input
                  id="cart-coupon"
                  className="input"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Nhập mã coupon nếu có..."
                  aria-label="Mã giảm giá"
                />
              </div>

              <div>
                <label htmlFor="cart-notes" className="mb-1.5 block text-sm font-medium text-slate-700">Ghi chú</label>
                <textarea
                  id="cart-notes"
                  className="textarea"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  aria-label="Ghi chú đơn hàng"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Summary Sidebar ── */}
        <div className="lg:sticky lg:top-[80px] lg:self-start space-y-4">
          {/* Order Summary */}
          <div className="card">
            <div className="card-body space-y-4">
              <h3 className="text-base font-bold text-slate-900">Tóm tắt đơn hàng</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính ({selected.size} sản phẩm)</span>
                  <span className="font-semibold text-slate-900">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-green-600">Miễn phí</span>
                </div>
                {couponCode.trim() && (
                  <div className="flex justify-between text-slate-600">
                    <span>Coupon</span>
                    <span className="font-semibold text-blue-600">{couponCode}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-slate-900">Tổng tiền</span>
                  <span className="text-xl font-extrabold text-blue-600">{fmt(subtotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* VietQR Info (QR sẽ hiện sau khi đặt hàng) */}
          {isVietQR && subtotal > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center">
              <div className="mb-1 text-sm font-bold text-blue-800">🏦 Chuyển khoản tự động xác nhận</div>
              <div className="text-xs text-blue-600">
                Sau khi đặt hàng, hệ thống sẽ hiển thị mã QR và <strong>tự động xác nhận</strong> khi bạn chuyển khoản thành công.
              </div>
            </div>
          )}

          {/* Stripe Elements */}
          {isStripe && subtotal > 0 && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-1 text-base font-bold text-indigo-800">💳 Thanh toán bằng thẻ quốc tế</div>
              <div className="mb-4 text-xs text-slate-500">
                Số tiền: <strong>{fmt(subtotal)}</strong> — Bảo mật bởi Stripe.
              </div>
              <StripeCheckoutPanel
                subtotal={subtotal}
                orderPayload={{
                  buyerName: buyerName || undefined,
                  shippingAddress: address,
                  paymentMethod: 'STRIPE',
                  paymentStatus: 'PAID',
                  notes,
                  couponCode: couponCode.trim() || undefined,
                  items: selectedItems.map(buildOrderItemPayload),
                }}
                onValidate={() => {
                  if (!address.trim()) { setErr('Vui lòng nhập địa chỉ giao hàng'); return false; }
                  if (!selectedItems.length) { setErr('Vui lòng chọn sản phẩm'); return false; }
                  setErr(null);
                  return true;
                }}
                onSuccess={async (orderId) => {
                  await CartApi.clearCart();
                  window.dispatchEvent(new Event('cart-updated'));
                  navigate(`/shop/orders/${orderId}`);
                }}
                onError={(msg) => setErr(msg)}
              />
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="alert alert-error">⚠ {err}</div>
          )}

          {/* Action Buttons */}
          {!isStripe && (
            <button
              onClick={() => handlePlaceOrder(isWallet ? 'PAID' : 'UNPAID')}
              disabled={placing || !selectedItems.length || (isWallet && walletBalance < subtotal)}
              className={[
                'w-full py-3.5 text-base font-bold rounded-xl transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
                isWallet
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : isVietQR
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
              ].join(' ')}
              aria-label="Đặt hàng"
            >
              {placing
                ? '⏳ Đang đặt hàng...'
                : isWallet
                  ? `💰 Thanh toán bằng Ví • ${fmt(subtotal)}`
                  : isVietQR
                    ? `🏦 Đặt hàng & Chuyển khoản • ${fmt(subtotal)}`
                    : `✓ Đặt hàng (COD) • ${fmt(subtotal)}`}
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Xác nhận đặt hàng"
        message={`Bạn sẽ đặt ${selectedItems.length} sản phẩm với tổng ${fmt(subtotal)}. Phương thức: ${
          method === 'WALLET' ? `Ví (Số dư: ${fmt(walletBalance)})` :
          method === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' :
          method === 'COD' ? 'COD' : method
        }. Xác nhận?`}
        onConfirm={confirmOrder}
        onCancel={() => { setShowConfirm(false); setPendingPaymentStatus(null); }}
        loading={placing}
      />
    </div>
  );
}

// ─── Stripe Checkout Panel ───────────────────────────────────────────────────
function StripeCheckoutPanel({ subtotal, orderPayload, onValidate, onSuccess, onError }) {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loadErr, setLoadErr]           = useState(null);
  const [authExpired, setAuthExpired]   = useState(false);

  useEffect(() => {
    if (!subtotal || subtotal <= 0) return;
    OrderApi.createCartStripeIntent(Math.round(subtotal))
      .then(res => {
        setClientSecret(res.clientSecret);
        setPaymentIntentId(res.paymentIntentId);
      })
      .catch(e => {
        setAuthExpired(e?.status === 401);
        const message = e?.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : (e?.message || 'Không khởi tạo được Stripe');
        setLoadErr(message);
      })
      .catch(e  => setLoadErr(e?.response?.data?.message || e?.message || 'Không khởi tạo được Stripe'));
  }, [subtotal]);

  if (loadErr) return (
    <div className="alert alert-error text-xs">
      <div>? {loadErr}</div>
      {authExpired && (
        <button
          type="button"
          className="btn-secondary mt-2 px-3 py-1.5 text-xs"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('auth:logout'));
            navigate('/login');
          }}
        >
          ��ng nh?p l?i
        </button>
      )}
    </div>
  );
  if (!clientSecret) return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="spinner" /> Đang tải form thanh toán...
    </div>
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeForm
        orderPayload={orderPayload}
        paymentIntentId={paymentIntentId}
        onValidate={onValidate}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function StripeForm({ orderPayload, paymentIntentId, onValidate, onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (onValidate && !onValidate()) return;
    setPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
      setPaying(false);
      return;
    }

    try {
      const stripePaymentIntentId = paymentIntent?.id || paymentIntentId;
      if (!stripePaymentIntentId) {
        throw new Error('Không lấy được mã giao dịch Stripe sau thanh toán');
      }

      const order = await OrderApi.createOrder({
        ...orderPayload,
        stripePaymentIntentId,
      });
      onSuccess(order.id);
    } catch (e) {
      const stripeOrderMessage = `Thanh toán Stripe đã xử lý nhưng tạo đơn thất bại. ${e?.message || 'Tạo đơn thất bại sau thanh toán'}. Mã Stripe: ${paymentIntent?.id || paymentIntentId || 'unknown'}.`;
      if (e && typeof e === 'object') e.message = stripeOrderMessage;
      onError(e?.response?.data?.message || e?.message || 'Tạo đơn thất bại sau thanh toán');
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn-primary mt-4 w-full py-3"
        aria-label="Thanh toán bằng thẻ"
      >
        {paying ? '⏳ Đang xử lý...' : `💳 Thanh toán ngay`}
      </button>
    </form>
  );
}
