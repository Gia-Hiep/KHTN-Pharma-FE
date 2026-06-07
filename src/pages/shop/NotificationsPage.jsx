import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationApi } from '../../apis/notification.api';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';

const TYPE_ICON = { ORDER_STATUS: '📦', CHAT_MESSAGE: '💬', SYSTEM: '🔔' };

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(false);
    try {
      const res = await NotificationApi.getNotifications(p, 15);
      const list = res.content || [];
      if (p === 0) setNotifications(list);
      else setNotifications(prev => [...prev, ...list]);
      setHasMore(!res.last);
      setPage(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const handleClick = useCallback(async (n) => {
    if (!n.readAt) {
      try {
        await NotificationApi.markAsRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      } catch { /* ignore */ }
    }
    if (n.type === 'ORDER_STATUS' && n.referenceId) navigate(`/shop/orders/${n.referenceId}`);
    else if (n.type === 'CHAT_MESSAGE') navigate('/shop/support-chat');
  }, [navigate]);

  const handleMarkAll = useCallback(async () => {
    setMarkingAll(true);
    try {
      await NotificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch { /* ignore */ }
    setMarkingAll(false);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="🔔 Thông báo"
        actions={
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
          >
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        }
      />

      {/* Loading Skeleton */}
      {loading && notifications.length === 0 && (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-3 animate-pulse rounded-xl border border-slate-100 p-4">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="mt-2 text-sm text-red-700">Không thể tải thông báo</p>
          <button onClick={() => load(0)} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Thử lại
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon="🔕"
            title="Chưa có thông báo"
            subtitle="Khi có đơn hàng hoặc tin nhắn mới, bạn sẽ nhận thông báo tại đây."
            action={
              <button onClick={() => navigate('/shop/medicines')} className="btn-primary">
                Tiếp tục mua hàng
              </button>
            }
          />
        </div>
      )}

      {/* List */}
      {!error && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:shadow-sm ${
                !n.readAt ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white'
              }`}
            >
              <span className="mt-0.5 text-2xl">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.readAt ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                  {n.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              {!n.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />}
            </button>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => load(page + 1)}
              disabled={loading}
              className="mt-4 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
