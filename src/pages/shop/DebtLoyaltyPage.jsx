import { useState, useEffect, useCallback, useMemo } from 'react';
import { CustomerApi } from '../../apis/customer.api';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';

export default function DebtLoyaltyPage() {
  const [tab, setTab] = useState('debt');
  const [customer, setCustomer] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loyaltyBal, setLoyaltyBal] = useState(null);
  const [loyaltyTxns, setLoyaltyTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalDebt, setTotalDebt] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const me = await CustomerApi.getMyCustomer();
      setCustomer(me);
      const [d, td, lb, lt] = await Promise.all([
        CustomerApi.getCustomerDebts(me.id).catch(() => []),
        CustomerApi.getTotalDebt(me.id).catch(() => null),
        CustomerApi.getLoyaltyBalance(me.id).catch(() => null),
        CustomerApi.getLoyaltyTransactions(me.id).catch(() => []),
      ]);
      setDebts(Array.isArray(d) ? d : []);
      setTotalDebt(td);
      setLoyaltyBal(lb);
      setLoyaltyTxns(Array.isArray(lt) ? lt : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fmt = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);

  // ─── Skeleton ───
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-5">
              <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <span className="text-5xl">⚠️</span>
        <p className="mt-3 text-lg font-semibold text-slate-700">Không thể tải dữ liệu</p>
        <button onClick={loadData} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="💰 Công nợ & Điểm tích lũy" />

      {/* ── Tabs ── */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('debt')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'debt' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          📋 Công nợ
        </button>
        <button
          onClick={() => setTab('loyalty')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'loyalty' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ⭐ Điểm tích lũy
        </button>
      </div>

      {/* ── Customer Info Card ── */}
      {customer && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            👤 {customer.fullName} {customer.tier && customer.tier !== 'REGULAR' && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                {customer.tier}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">ID: {customer.id} • Điểm: {customer.loyaltyPoints || 0}</p>
        </div>
      )}

      {/* ── Debt Tab ── */}
      {tab === 'debt' && (
        <div>
          {/* Total debt summary */}
          {totalDebt !== null && (
            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-center">
              <p className="text-sm text-orange-700">Tổng công nợ hiện tại</p>
              <p className="mt-1 text-2xl font-bold text-orange-800">{fmt.format(typeof totalDebt === 'object' ? totalDebt.total || 0 : totalDebt)}</p>
            </div>
          )}

          {debts.length === 0 ? (
            <EmptyState icon="✅" title="Không có công nợ" />
          ) : (
            <div className="space-y-2">
              {debts.map((d, idx) => (
                <div key={d.id || idx} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{d.description || 'Công nợ #' + (d.id || idx + 1)}</span>
                    <span className={`text-sm font-bold ${d.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt.format(d.amount || 0)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : ''} • {d.status || 'PENDING'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Loyalty Tab ── */}
      {tab === 'loyalty' && (
        <div>
          {/* Balance */}
          {loyaltyBal !== null && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm text-green-700">Điểm tích lũy hiện tại</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                ⭐ {typeof loyaltyBal === 'object' ? loyaltyBal.balance || loyaltyBal.points || 0 : loyaltyBal}
              </p>
            </div>
          )}

          {loyaltyTxns.length === 0 ? (
            <EmptyState icon="⭐" title="Chưa có giao dịch điểm tích lũy" />
          ) : (
            <div className="space-y-2">
              {loyaltyTxns.map((t, idx) => (
                <div key={t.id || idx} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-800">{t.description || t.type || 'Giao dịch'}</span>
                    <span className={`text-sm font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.points > 0 ? '+' : ''}{t.points}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
