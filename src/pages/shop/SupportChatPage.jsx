import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatApi } from '../../apis';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components/ui/PageHeader';

/* ─── helpers ─────────────────────────────────────────────── */
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Conversation Item ─── */
function ConvItem({ conv, active, onClick }) {
  const isActive = conv.status === 'ACTIVE';
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 border-b border-slate-100 transition-all duration-200',
        active ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-transparent hover:bg-slate-50',
      ].join(' ')}
      aria-label={`Mở hội thoại ${conv.title || conv.id}`}
    >
      <div className="text-sm font-semibold text-slate-900 truncate">
        {conv.title || `Hội thoại #${conv.id}`}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs">
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
        <span className={isActive ? 'text-green-600' : 'text-slate-400'}>
          {isActive ? 'Đang mở' : 'Đã đóng'}
        </span>
      </div>
    </button>
  );
}

/* ─── Message Bubble ─── */
function Message({ msg, myUserId }) {
  const isMe = msg.senderId === myUserId;
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={[
        'max-w-[70%] px-4 py-2.5 text-sm leading-relaxed shadow-sm',
        isMe
          ? 'rounded-2xl rounded-br-sm bg-blue-500 text-white'
          : 'rounded-2xl rounded-bl-sm bg-slate-100 text-slate-900',
      ].join(' ')}>
        {!isMe && (
          <div className="mb-1 text-[10px] font-medium opacity-60">
            Nhân viên #{msg.senderId}
          </div>
        )}
        <div>{msg.content}</div>
        <div className={`mt-1 text-[10px] text-right ${isMe ? 'opacity-70' : 'text-slate-400'}`}>
          {fmtTime(msg.sentAt || msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ─── Send Icon ─── */
const SendIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

/* ─── Main Component ─────────────────────────────────────── */
export function SupportChatPage() {
  const { auth } = useAuth();
  const myUserId = auth?.user?.id ?? auth?.user?.userId;

  const [convs, setConvs]           = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError]   = useState(null);

  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [msgLoading, setMsgLoading]     = useState(false);

  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending]   = useState(false);

  const [creating, setCreating]       = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* Load conversations */
  const loadConvs = useCallback(async () => {
    setConvLoading(true);
    setConvError(null);
    try {
      const res = await ChatApi.getMyConversations();
      setConvs(Array.isArray(res) ? res : []);
    } catch (err) {
      setConvError(err?.message || 'Không tải được hội thoại');
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  /* Load messages */
  const loadMessages = useCallback(async (convId) => {
    setMsgLoading(true);
    try {
      const res = await ChatApi.getAllMessages(convId);
      setMessages(Array.isArray(res) ? res : []);
      ChatApi.markAsRead(convId).catch(() => {});
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectConv = useCallback((conv) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
    inputRef.current?.focus();
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages]);

  /* Create conversation */
  const createConv = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const conv = await ChatApi.createOrGetConversation({
        title: newTitle.trim() || 'Yêu cầu hỗ trợ',
        type: 'SUPPORT',
      });
      setNewTitle('');
      setShowNewForm(false);
      await loadConvs();
      selectConv(conv);
    } catch (err) {
      toast.error('Tạo hội thoại thất bại: ' + (err?.message || ''));
    } finally {
      setCreating(false);
    }
  }, [creating, newTitle, loadConvs, selectConv]);

  /* Send message */
  const sendMsg = useCallback(async () => {
    const text = msgInput.trim();
    if (!text || !selectedConv || sending) return;
    setSending(true);
    try {
      await ChatApi.sendMessage({ conversationId: selectedConv.id, content: text });
      setMsgInput('');
      await loadMessages(selectedConv.id);
    } catch (err) {
      toast.error('Gửi thất bại: ' + (err?.message || ''));
    } finally {
      setSending(false);
    }
  }, [msgInput, selectedConv, sending, loadMessages]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  }, [sendMsg]);

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      <PageHeader title="💬 Hỗ trợ trực tiếp" />

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[280px_1fr]"
        style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}
      >
        {/* ── LEFT: Conversation list ── */}
        <div className="flex flex-col border-r border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">
              Hội thoại ({convs.length})
            </span>
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
              aria-label="Tạo hội thoại mới"
            >
              + Tạo mới
            </button>
          </div>

          {/* New form */}
          {showNewForm && (
            <div className="border-b border-slate-200 bg-blue-50 p-3 space-y-2">
              <input
                autoFocus
                className="input text-sm"
                placeholder="Tiêu đề (tùy chọn)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createConv()}
                aria-label="Tiêu đề hội thoại mới"
              />
              <div className="flex gap-2">
                <button onClick={createConv} className="btn-primary flex-1 py-1.5 text-xs" disabled={creating} aria-label="Bắt đầu hội thoại">
                  {creating ? '⏳' : 'Bắt đầu'}
                </button>
                <button onClick={() => { setShowNewForm(false); setNewTitle(''); }} className="btn-secondary py-1.5 text-xs" aria-label="Hủy tạo hội thoại">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {convLoading && (
              <div className="flex items-center justify-center py-12">
                <span className="spinner" />
              </div>
            )}
            {convError && <div className="alert alert-error m-3 text-xs">{convError}</div>}
            {!convLoading && convs.length === 0 && (
              <div className="px-4 py-12 text-center text-slate-400">
                <div className="mb-2 text-3xl">💬</div>
                <div className="text-sm">Chưa có hội thoại nào</div>
                <div className="mt-1 text-xs">Nhấn "+ Tạo mới" để bắt đầu</div>
              </div>
            )}
            {convs.map((c) => (
              <ConvItem
                key={c.id}
                conv={c}
                active={selectedConv?.id === c.id}
                onClick={() => selectConv(c)}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Messages panel ── */}
        <div className="flex flex-col bg-slate-50/50">
          {!selectedConv ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
              <div className="mb-3 text-5xl">💬</div>
              <div className="text-base font-semibold">Chọn một hội thoại</div>
              <div className="mt-1 text-sm">hoặc tạo mới để bắt đầu hỗ trợ</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shrink-0">
                  {(selectedConv.title || 'H')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {selectedConv.title || `Hội thoại #${selectedConv.id}`}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${selectedConv.status === 'ACTIVE' ? 'text-green-500' : 'text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedConv.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {selectedConv.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}
                  </div>
                </div>
                <button
                  onClick={() => loadMessages(selectedConv.id)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Làm mới tin nhắn"
                >
                  🔄
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {msgLoading && (
                  <div className="flex items-center justify-center py-12">
                    <span className="spinner" />
                  </div>
                )}
                {!msgLoading && messages.length === 0 && (
                  <div className="pt-12 text-center text-sm text-slate-400">
                    Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên!
                  </div>
                )}
                {messages.map((m, i) => (
                  <Message key={m.id ?? i} msg={m} myUserId={myUserId} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selectedConv.status === 'ACTIVE' ? (
                <div className="sticky bottom-0 flex items-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
                  <textarea
                    ref={inputRef}
                    className="input flex-1 resize-none"
                    rows={2}
                    placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={handleKey}
                    aria-label="Nhập tin nhắn"
                  />
                  <button
                    onClick={sendMsg}
                    disabled={sending || !msgInput.trim()}
                    className="btn-primary shrink-0 p-3"
                    aria-label="Gửi tin nhắn"
                  >
                    {sending ? (
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <SendIcon />
                    )}
                  </button>
                </div>
              ) : (
                <div className="border-t border-slate-200 bg-slate-50 py-3 text-center text-sm text-slate-400">
                  Hội thoại này đã đóng
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
