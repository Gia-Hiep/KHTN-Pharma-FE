/**
 * PHARMACIST/ADMIN: Inbox hỗ trợ khách hàng.
 * Dùng API /chat/support/inbox (backend: ChatController.getPharmacistInbox).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatApi } from '../../apis';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { RefreshCw } from 'lucide-react';

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export function SupportInboxPage() {
  const { auth } = useAuth();
  const myUserId = auth?.user?.id ?? auth?.user?.userId;
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConvs = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await ChatApi.getSupportInbox();
      setConvs(Array.isArray(res) ? res : []);
    } catch (e) { setErr(e?.message || 'Không tải được inbox'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const loadMessages = useCallback(async (convId) => {
    setMsgLoading(true);
    try {
      const res = await ChatApi.getAllMessages(convId);
      setMessages(Array.isArray(res) ? res : []);
      ChatApi.markAsRead(convId).catch(() => {});
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  }, []);

  const selectConv = (conv) => { setSelected(conv); loadMessages(conv.id); };

  useEffect(() => {
    if (messages.length) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages]);

  const sendMsg = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      await ChatApi.sendMessage({ conversationId: selected.id, content: text });
      setInput('');
      await loadMessages(selected.id);
    } catch (e) { alert('Gửi thất bại: ' + (e?.message || '')); }
    finally { setSending(false); }
  };

  const closeConv = async () => {
    if (!selected) return;
    try {
      await ChatApi.closeConversation(selected.id);
      setSelected(s => ({ ...s, status: 'CLOSED' }));
      loadConvs();
    } catch (e) { alert('Đóng thất bại: ' + (e?.message || '')); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Hỗ trợ khách hàng" subtitle={`${convs.length} hội thoại`} />

      <div className="grid grid-cols-[280px_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>

        {/* LEFT: conversations */}
        <div className="flex flex-col border-r border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-700">Hội thoại ({convs.length})</span>
            <button onClick={loadConvs} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Làm mới"><RefreshCw className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <div className="p-5 text-center text-sm text-slate-400">Đang tải...</div>}
            {err && <div className="p-3 text-xs text-red-600">⚠ {err}</div>}
            {!loading && !convs.length && <div className="px-6 py-10 text-center text-sm text-slate-400">Không có hội thoại</div>}
            {convs.map(c => {
              const isActive = c.status === 'ACTIVE';
              const isSel = selected?.id === c.id;
              return (
                <div key={c.id} onClick={() => selectConv(c)}
                  className={[
                    'cursor-pointer border-b border-slate-100 px-4 py-3 transition',
                    isSel ? 'border-l-[3px] border-l-blue-500 bg-blue-50' : 'border-l-[3px] border-l-transparent hover:bg-slate-50',
                  ].join(' ')}>
                  <div className="text-sm font-semibold text-slate-800">{c.title || `Khách #${c.userId || c.id}`}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-400'}`} />
                    <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{isActive ? 'Đang mở' : 'Đã đóng'}</span>
                    {c.createdAt && <span className="ml-auto text-[10px] text-slate-400">{fmtTime(c.createdAt)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: messages */}
        <div className="flex flex-col bg-slate-50/50">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
              <div className="mb-3 text-5xl">💬</div>
              <div className="text-base font-semibold">Chọn một hội thoại</div>
              <div className="text-sm">để xem và trả lời khách hàng</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {(selected.title || 'K')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900">{selected.title || `Khách #${selected.userId || selected.id}`}</div>
                  <div className={`text-xs ${selected.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-400'}`}>
                    {selected.status === 'ACTIVE' ? '● Đang mở' : '● Đã đóng'}
                    {selected.userId && <span> • User #{selected.userId}</span>}
                  </div>
                </div>
                {selected.status === 'ACTIVE' && (
                  <Button size="sm" variant="ghost" onClick={closeConv} className="!text-red-600 !border-red-200 hover:!bg-red-50">Đóng</Button>
                )}
                <button onClick={() => loadMessages(selected.id)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Làm mới"><RefreshCw className="h-4 w-4" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {msgLoading && <div className="text-center text-sm text-slate-400">Đang tải...</div>}
                {!msgLoading && !messages.length && <div className="pt-10 text-center text-sm text-slate-400">Chưa có tin nhắn</div>}
                {messages.map((m, i) => {
                  const isMe = m.senderId === myUserId;
                  return (
                    <div key={m.id ?? i} className={`mb-2.5 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={[
                        'max-w-[70%] px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isMe
                          ? 'rounded-2xl rounded-br-sm bg-blue-600 text-white'
                          : 'rounded-2xl rounded-bl-sm border border-slate-200 bg-white text-slate-800',
                      ].join(' ')}>
                        {!isMe && <div className="mb-0.5 text-[10px] opacity-60">Khách #{m.senderId}</div>}
                        <div>{m.content}</div>
                        <div className={`mt-1 text-right text-[10px] ${isMe ? 'opacity-60' : 'text-slate-400'}`}>{fmtTime(m.sentAt || m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selected.status === 'ACTIVE' ? (
                <div className="flex gap-2 border-t border-slate-200 bg-white px-4 py-3">
                  <textarea rows={2}
                    className="input flex-1 resize-none"
                    placeholder="Nhập tin nhắn trả lời..."
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} />
                  <Button onClick={sendMsg} disabled={sending} className="self-end">
                    {sending ? '...' : 'Gửi ➤'}
                  </Button>
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
