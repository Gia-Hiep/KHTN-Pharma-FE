import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Search, Bell, ShoppingCart, User, Cross, Package, HeadphonesIcon, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationApi } from '../../apis/notification.api';
import { ChatApi } from '../../apis/chat.api';
import { CartApi } from '../../apis/cart.api';
import { WalletApi } from '../../apis/wallet.api';

const TYPE_ICON = { ORDER_STATUS: '📦', CHAT_MESSAGE: '💬', SYSTEM: '🔔' };

/* ═══════════════════════════════════════════════════════════════════════════ */
export function ShopHeader() {
  const { auth, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const isBuyer = hasRole('BUYER');

  // ── Notification state ──
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(false);
  const dropRef = useRef(null);

  // ── Unread chat count ──
  const [unreadChat, setUnreadChat] = useState(0);

  // ── User dropdown ──
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userRef = useRef(null);
  const searchTimer = useRef(null);

  // ── Cart sync via API ──
  const fetchCartCount = useCallback(async () => {
    if (!isBuyer) return;
    try {
      const data = await CartApi.getCart();
      setCartCount(data?.totalQty || 0);
    } catch { setCartCount(0); }
  }, [isBuyer]);

  useEffect(() => {
    fetchCartCount();
    const handler = () => fetchCartCount();
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, [fetchCartCount]);

  // ── Wallet balance ──
  useEffect(() => {
    if (!isBuyer) return;
    WalletApi.getBalance().then(r => setWalletBalance(r?.balance || 0)).catch(() => {});
    const handler = () => WalletApi.getBalance().then(r => setWalletBalance(r?.balance || 0)).catch(() => {});
    window.addEventListener('wallet-updated', handler);
    return () => window.removeEventListener('wallet-updated', handler);
  }, [isBuyer]);

  // ── Polling: unread notifications + unread chat (every 15s) ──
  const pollCounts = useCallback(async () => {
    if (!isBuyer) return;
    try {
      const res = await NotificationApi.getUnreadCount();
      setUnreadNotif(res.count || 0);
    } catch { /* notification service may be down */ }
    try {
      const convos = await ChatApi.getMyConversations();
      const unread = Array.isArray(convos) ? convos.filter(c => c.unreadCount > 0).length : 0;
      setUnreadChat(unread);
    } catch { /* ignore */ }
  }, [isBuyer]);

  useEffect(() => {
    pollCounts();
    const interval = setInterval(pollCounts, 15000);
    return () => clearInterval(interval);
  }, [pollCounts]);

  // ── Load dropdown notifications ──
  const loadDropdown = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(false);
    try {
      const page = await NotificationApi.getNotifications(0, 5);
      setNotifications(page.content || []);
    } catch {
      setNotifError(true);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setShowNotifDrop(prev => {
      if (!prev) loadDropdown();
      return !prev;
    });
  }, [loadDropdown]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowNotifDrop(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Click notification → mark read + navigate ──
  const handleNotifClick = useCallback(async (n) => {
    if (!n.readAt) {
      try { await NotificationApi.markAsRead(n.id); } catch { /* ignore */ }
      setUnreadNotif(prev => Math.max(0, prev - 1));
    }
    setShowNotifDrop(false);
    if (n.type === 'ORDER_STATUS' && n.referenceId) {
      navigate(`/shop/orders/${n.referenceId}`);
    } else if (n.type === 'CHAT_MESSAGE') {
      navigate('/shop/support-chat');
    }
  }, [navigate]);

  const displayName = useMemo(
    () => auth?.user?.fullName || auth?.user?.username || 'Tài khoản',
    [auth]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="shop-header">
      <div className="shop-header-inner">
        {/* ── Logo ── */}
        <Link to="/shop/medicines" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <Cross className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-extrabold tracking-tight text-white">PharmaCare</span>
            <span className="ml-1.5 hidden text-[10px] font-medium text-white/60 md:inline">Online</span>
          </div>
        </Link>

        {/* ── Search (live — debounced, updates URL ?q= as you type) ── */}
        <div className="shop-search mx-4 flex-1 max-w-lg">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            placeholder="Tìm thuốc, hoạt chất, nhóm bệnh..."
            className="cursor-text"
            aria-label="Tìm kiếm thuốc"
            autoComplete="off"
            onChange={(e) => {
              const q = e.target.value;
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => {
                navigate(q.trim() ? `/shop/medicines?q=${encodeURIComponent(q.trim())}` : '/shop/medicines', { replace: true });
              }, 300);
            }}
          />
        </div>

        {/* ── Nav Links (Chatbot removed — now floating widget) ── */}
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/shop/medicines" className={shopNavClass}>
            <Package className="h-4 w-4" aria-hidden="true" />
            <span>Thuốc</span>
          </NavLink>
          <NavLink to="/shop/faq" className={shopNavClass}>FAQ</NavLink>

          {isBuyer && (
            <NavLink to="/shop/support-chat" className={shopNavClass}>
              <HeadphonesIcon className="h-4 w-4" aria-hidden="true" />
              <span>Hỗ trợ</span>
              {unreadChat > 0 && <span className="shop-badge-count" style={{ position: 'static', marginLeft: 4 }}>{unreadChat}</span>}
            </NavLink>
          )}

          {isBuyer && <NavLink to="/shop/orders" className={shopNavClass}>Đơn hàng</NavLink>}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-2 hidden h-6 w-px bg-white/20 lg:block" aria-hidden="true" />

        {/* ── Icon Buttons ── */}
        <div className="flex items-center gap-0.5">
          {/* Notification Bell */}
          {isBuyer && (
            <div className="relative" ref={dropRef}>
              <button type="button" onClick={toggleDropdown} className="shop-icon-btn" aria-label="Thông báo">
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotif > 0 && (
                  <span className="shop-badge-count">{unreadNotif > 99 ? '99+' : unreadNotif}</span>
                )}
              </button>

              {/* ── Notification Dropdown ── */}
              {showNotifDrop && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-bold text-slate-900">Thông báo</span>
                    <button onClick={() => navigate('/shop/notifications')} className="text-xs font-medium text-blue-600 hover:underline">
                      Xem tất cả →
                    </button>
                  </div>

                  {notifLoading && (
                    <div className="space-y-3 p-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3">
                          <div className="skeleton h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <div className="skeleton-text w-3/4" />
                            <div className="skeleton-text w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifError && !notifLoading && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-slate-500">Không thể tải thông báo</p>
                      <button onClick={loadDropdown} className="mt-2 text-xs font-medium text-blue-600 hover:underline">Thử lại</button>
                    </div>
                  )}

                  {!notifLoading && !notifError && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">Không có thông báo mới</p>
                    </div>
                  )}

                  {!notifLoading && !notifError && notifications.length > 0 && (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map(n => (
                        <li key={n.id}>
                          <button
                            onClick={() => handleNotifClick(n)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                              !n.readAt ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <span className="mt-0.5 text-xl">{TYPE_ICON[n.type] || '🔔'}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!n.readAt ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                              </p>
                            </div>
                            {!n.readAt && (
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wallet */}
          {isBuyer && (
            <Link to="/shop/wallet" className="shop-icon-btn" aria-label="Ví">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}

          {/* Cart */}
          {isBuyer && (
            <Link to="/shop/cart" className="shop-icon-btn" aria-label="Giỏ hàng">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 && <span className="shop-badge-count">{cartCount}</span>}
            </Link>
          )}

          {/* User Menu */}
          {isBuyer && (
            <div className="relative" ref={userRef}>
              <button type="button" onClick={() => setShowUserMenu(v => !v)} className="shop-icon-btn" aria-label="Menu người dùng">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-bold text-slate-900 truncate">{displayName}</div>
                    <div className="text-xs text-slate-500">Buyer</div>
                  </div>
                  <div className="py-1">
                    <Link to="/shop/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="h-4 w-4 text-slate-400" /> Tài khoản
                    </Link>
                    <Link to="/shop/orders" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Package className="h-4 w-4 text-slate-400" /> Đơn hàng
                    </Link>
                    <Link to="/shop/debt-loyalty" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <ShoppingCart className="h-4 w-4 text-slate-400" /> Công nợ & tích điểm
                    </Link>
                    <Link to="/shop/wallet" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Wallet className="h-4 w-4 text-slate-400" /> Ví · {Number(walletBalance).toLocaleString('vi-VN')}đ
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest: login button */}
          {!isBuyer && (
            <Link to="/login" className="ml-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function shopNavClass({ isActive }) {
  return [
    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 transition-all duration-150',
    isActive
      ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm'
      : 'hover:bg-white/10 hover:text-white',
  ].join(' ');
}