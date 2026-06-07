import { useCallback, useRef, useState } from 'react';
import { ChatbotApi } from '../../apis';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { PageHeader } from '../../components/ui/PageHeader';

const QUICK_ACTIONS = [
  { id: 'VIEW_ORDERS', label: 'Xem đơn hàng' },
  { id: 'TRACK_ORDER_BY_CODE', label: 'Tra đơn theo mã' },
  { id: 'SEARCH_BY_ACTIVE_INGREDIENT', label: 'Tìm theo hoạt chất' },
  { id: 'SEARCH_BY_DISEASE_GROUP', label: 'Tìm theo nhóm bệnh' },
  { id: 'POLICY_RETURN', label: 'Chính sách đổi trả' },
];

const CONFIDENCE_BADGES = {
  HIGH: { label: 'Cao', cls: 'bg-emerald-100 text-emerald-700' },
  MEDIUM: { label: 'Trung bình', cls: 'bg-amber-100 text-amber-700' },
  LOW: { label: 'Thấp', cls: 'bg-slate-100 text-slate-500' },
};

const STATUS_COLORS = {
  PENDING_APPROVAL: 'text-amber-600',
  CONFIRMED: 'text-blue-600',
  PICKING: 'text-indigo-600',
  PACKING: 'text-indigo-600',
  SHIPPING: 'text-cyan-600',
  DELIVERED: 'text-emerald-600',
  REJECTED: 'text-red-600',
};

const SOURCE_TYPE_LABELS = {
  POLICY: 'Chính sách',
  GUIDE: 'Hướng dẫn',
  FAQ: 'FAQ',
};

const PRODUCT_MATCH_BADGES = {
  NAME: { label: 'Tên thuốc', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  GENERIC_NAME: { label: 'Generic', cls: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  ACTIVE_INGREDIENT: { label: 'Hoạt chất', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  DISEASE_GROUP: { label: 'Nhóm bệnh', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  CATEGORY: { label: 'Danh mục', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  CATALOG_RAG: { label: 'RAG catalog', cls: 'bg-violet-50 text-violet-700 border-violet-100' },
  DESCRIPTION: { label: 'Mô tả', cls: 'bg-slate-50 text-slate-700 border-slate-100' },
  DOSAGE_FORM: { label: 'Dạng bào chế', cls: 'bg-slate-50 text-slate-700 border-slate-100' },
  PACKAGE_SIZE: { label: 'Quy cách', cls: 'bg-slate-50 text-slate-700 border-slate-100' },
  MANUFACTURER: { label: 'Nhà sản xuất', cls: 'bg-slate-50 text-slate-700 border-slate-100' },
};

const CATALOG_BASE = SERVICE_URLS.catalog;

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function sanitizeProductAnswer(answer) {
  if (!answer) return '';

  return answer
    .split('\n')
    .filter((line) => !/^\s*[*-]\s+/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const doQuery = useCallback(async ({ message, actionId }) => {
    if (loading || (!message && !actionId)) return;

    if (message) {
      setMessages((prev) => [...prev, { role: 'user', content: message }]);
    }

    setInput('');
    setLoading(true);

    try {
      const res = await ChatbotApi.queryAI({
        message: message || null,
        actionId: actionId || null,
        sessionId,
      });
      if (res?.sessionId) {
        setSessionId(res.sessionId);
      }
      setMessages((prev) => [...prev, { role: 'bot', data: res }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          data: {
            type: 'OUT_OF_SCOPE',
            answer: `Lỗi: ${err?.message || 'Không kết nối được server'}`,
            sources: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [loading, sessionId]);

  const sendMessage = () => doQuery({ message: input.trim() });
  const handleAction = (actionId) => doQuery({ actionId });
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Chatbot AI hỗ trợ" />

      <div className="alert alert-warning text-xs leading-relaxed">
        <strong>Lưu ý:</strong> Chatbot hỗ trợ tra cứu đơn hàng, tìm sản phẩm và giải đáp chính sách.
        Chatbot <strong>không tư vấn liều dùng</strong>, <strong>không kê đơn</strong>,
        và <strong>không thay thế dược sĩ</strong>. Cần tư vấn chuyên môn?{' '}
        <a href="/shop/support-chat" className="font-semibold text-blue-600 hover:text-blue-700">
          Chat với dược sĩ
        </a>
        .
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 overflow-y-auto p-4" style={{ height: 480 }}>
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <div className="mb-3 text-5xl">🤖</div>
              <div className="text-sm font-medium text-slate-500">
                Xin chào! Tôi là trợ lý AI của nhà thuốc.
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Hãy hỏi về đơn hàng, sản phẩm hoặc chính sách.
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'user' ? (
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white shadow-sm">
                  {message.content}
                </div>
              ) : (
                <BotMessage data={message.data} onAction={handleAction} />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400">Đang xử lý...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <input
            className="input flex-1"
            placeholder="Nhập câu hỏi... (VD: chính sách giao hàng, tìm thuốc cảm cúm)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary shrink-0">
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Gửi'
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
        <span className="text-lg">💊</span>
        <span className="text-sm text-blue-800">Cần tư vấn chuyên môn?</span>
        <a
          href="/shop/support-chat"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 hover:scale-105 active:scale-95"
        >
          Chat với dược sĩ
        </a>
      </div>
    </div>
  );
}

function BotMessage({ data, onAction }) {
  if (!data) return null;

  const {
    type,
    title,
    answer,
    confidenceLevel,
    safe,
    orders,
    products,
    sources,
    suggestedActions,
  } = data;
  const badge = CONFIDENCE_BADGES[confidenceLevel];
  const displayAnswer = type === 'PRODUCT_LIST' ? sanitizeProductAnswer(answer) : answer;

  return (
    <div className="max-w-[88%] space-y-2">
      <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm">
        {title && <div className="mb-1 text-xs font-semibold text-slate-500">{title}</div>}
        <div style={{ whiteSpace: 'pre-wrap' }}>{displayAnswer}</div>

        {type === 'ORDER_LIST' && orders?.length > 0 && (
          <div className="mt-3 space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold">Đơn #{order.id}</span>
                    <span className={`ml-2 ${STATUS_COLORS[order.status] || 'text-slate-600'}`}>
                      {order.statusLabel}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700">{order.formattedTotal}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {order.paymentStatusLabel && <span>Thanh toán: {order.paymentStatusLabel}</span>}
                  {order.createdAtLabel && <span>Tạo lúc: {order.createdAtLabel}</span>}
                  {order.trackingCode && <span>Vận đơn: {order.trackingCode}</span>}
                </div>
                {order.items?.length > 0 && (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sản phẩm trong đơn</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="text-slate-700">
                          {item.medicineName}
                          <span className="ml-1 text-slate-400">x{item.quantity}{item.unitLabel ? ` ${item.unitLabel}` : ''}</span>
                        </span>
                        {item.formattedPrice && (
                          <span className="shrink-0 text-slate-500">{item.formattedPrice}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {type === 'PRODUCT_LIST' && products?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {products.map((product) => (
              <ProductResultCard key={product.id} product={product} />
            ))}
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
              Chatbot chỉ hỗ trợ tìm sản phẩm trong hệ thống. Nếu bạn cần hỏi cách dùng, liều dùng,
              đối tượng sử dụng hoặc tính phù hợp cá nhân, hãy chat với dược sĩ.
              <div className="mt-2">
                <a
                  href="/shop/support-chat"
                  className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                >
                  Chat với dược sĩ
                </a>
              </div>
            </div>
          </div>
        )}

        {type === 'MEDICAL_REFUSAL' && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Chatbot không tư vấn y tế cá nhân. Vui lòng liên hệ dược sĩ.
          </div>
        )}

        {sources?.length > 0 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Nguồn tham khảo
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source, index) => (
                <span
                  key={`${source.sourceType}-${source.title}-${index}`}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                >
                  {SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType}: {source.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-1">
        {badge && confidenceLevel !== 'HIGH' && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        {safe === false && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
            Y tế
          </span>
        )}
      </div>

      {suggestedActions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {suggestedActions.map((action) => (
            action.id === 'CHAT_PHARMACIST' ? (
              <a
                key={action.id}
                href="/shop/support-chat"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
              >
                {action.label}
              </a>
            ) : (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600 active:scale-95"
              >
                {action.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function ProductResultCard({ product }) {
  const match = PRODUCT_MATCH_BADGES[product.matchType] || {
    label: product.matchType || 'Kết quả',
    cls: 'bg-slate-50 text-slate-700 border-slate-100',
  };
  const imageSrc = resolveImageUrl(product.imageUrl);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-slate-900">{product.name}</div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
              {product.activeIngredient && <span>Hoạt chất: {product.activeIngredient}</span>}
              {product.categoryName && <span>Danh mục: {product.categoryName}</span>}
            </div>
          </div>
        </div>
        {product.formattedPrice && (
          <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700">
            {product.formattedPrice}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${match.cls}`}>
          {match.label}
        </span>
        {product.matchLabel && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            {product.matchLabel}
          </span>
        )}
      </div>

      {(product.description || product.usageInstructions || product.sideEffects) && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
          {product.description && (
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-700">Mô tả:</span> {product.description}
            </div>
          )}
          {product.usageInstructions && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2 leading-relaxed">
              <span className="font-semibold text-slate-700">Cách dùng:</span> {product.usageInstructions}
            </div>
          )}
          {product.sideEffects && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 leading-relaxed text-amber-900">
              <span className="font-semibold text-amber-800">Tác dụng phụ:</span> {product.sideEffects}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
