import { useState, useCallback, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Cross, Phone, Mail, MapPin } from 'lucide-react';
import { ShopHeader } from './components/ShopHeader';
import { ChatbotApi } from '../apis';
import { SERVICE_URLS } from '../apis/serviceUrls';

const CATALOG_BASE = SERVICE_URLS.catalog;

const QUICK_ACTIONS = [
  { id: 'VIEW_ORDERS', label: '📦 Xem đơn hàng' },
  { id: 'TRACK_ORDER_BY_CODE', label: '🔍 Tra đơn theo mã' },
  { id: 'SEARCH_BY_ACTIVE_INGREDIENT', label: '💊 Tìm theo hoạt chất' },
  { id: 'SEARCH_BY_DISEASE_GROUP', label: '🩺 Tìm theo nhóm bệnh' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING CHATBOT WIDGET
   ═══════════════════════════════════════════════════════════════════════════ */
function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const doQuery = useCallback(async ({ message, actionId }) => {
    if (loading || (!message && !actionId)) return;
    if (message) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }
    setInput('');
    setLoading(true);
    try {
      const res = await ChatbotApi.queryAI({
        message: message || null,
        actionId: actionId || null,
        sessionId,
      });
      if (res?.sessionId) setSessionId(res.sessionId);
      setMessages(prev => [...prev, { role: 'bot', data: res }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', data: { answer: `Lỗi: ${err?.message || 'Không kết nối được server'}` } },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [loading, sessionId]);

  const sendMessage = () => doQuery({ message: input.trim() });
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
          boxShadow: '0 4px 20px rgba(21, 87, 176, 0.35)',
        }}
        aria-label={open ? 'Đóng chatbot' : 'Mở chatbot AI'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* ── Chat Modal ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            height: 520,
            maxHeight: 'calc(100vh - 140px)',
            animation: 'chatbot-enter 0.3s ease-out',
          }}
          role="dialog"
          aria-label="Chatbot AI hỗ trợ"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">Trợ lý AI PharmaCare</div>
              <div className="text-[10px] text-white/70">Hỗ trợ 24/7 • Tra cứu nhanh</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/70 transition hover:bg-white/20 hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-sm font-medium text-slate-700">Xin chào! 👋</div>
                <div className="mt-1 text-xs text-slate-500">
                  Tôi là trợ lý AI, hỏi tôi về đơn hàng, sản phẩm hoặc chính sách.
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      onClick={() => doQuery({ actionId: action.id })}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-white shadow-sm"
                       style={{ background: 'var(--color-primary-500)' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm border border-slate-100">
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.data?.answer || 'Không có phản hồi.'}</div>
                    {msg.data?.products?.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.data.products.slice(0, 3).map(p => (
                          <Link
                            key={p.id}
                            to={`/shop/medicines/${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs hover:bg-blue-50 transition"
                          >
                            {p.imageUrl && (
                              <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${CATALOG_BASE}${p.imageUrl}`}
                                   alt={p.name} className="h-8 w-8 rounded object-cover" onError={e => { e.target.style.display = 'none'; }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 truncate">{p.name}</div>
                              {p.formattedPrice && <div className="text-blue-600 font-semibold">{p.formattedPrice}</div>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {msg.data?.suggestedActions?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.data.suggestedActions.map(a => (
                          <button key={a.id} onClick={() => doQuery({ actionId: a.id })}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:text-blue-600 hover:border-blue-200 transition">
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5 shrink-0">
            <input
              className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-200 transition"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-40"
              style={{ background: 'var(--color-primary-500)' }}
              aria-label="Gửi"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatbot-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROFESSIONAL FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
function ShopFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}
              >
                <Cross className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">PharmaCare</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Nhà thuốc trực tuyến uy tín. Cam kết thuốc chính hãng, giao hàng nhanh, tư vấn dược sĩ 24/7.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Liên kết nhanh</h4>
            <ul className="mt-3 space-y-2">
              {[
                { to: '/shop/medicines', label: 'Danh mục thuốc' },
                { to: '/shop/orders', label: 'Đơn hàng của tôi' },
                { to: '/shop/faq', label: 'Câu hỏi thường gặp' },
                { to: '/shop/support-chat', label: 'Chat với dược sĩ' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chính sách</h4>
            <ul className="mt-3 space-y-2">
              {[
                'Chính sách vận chuyển',
                'Chính sách đổi trả',
                'Chính sách bảo mật',
                'Điều khoản sử dụng',
              ].map(label => (
                <li key={label}>
                  <span className="text-sm text-slate-600 cursor-default">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Liên hệ</h4>
            <ul className="mt-3 space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                1800-1234 (miễn phí)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                support@pharmacare.vn
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                TP. Hồ Chí Minh, Việt Nam
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PharmaCare — Pharmacy SOA. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Được phát triển bởi <span className="font-semibold text-slate-500">Pharmacy SOA Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOP LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
export function ShopLayout() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      <ShopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:px-8">
        <Outlet />
      </main>
      <ShopFooter />
      <ChatbotWidget />
    </div>
  );
}