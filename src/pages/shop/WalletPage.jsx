import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WalletApi } from '../../apis/wallet.api';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const TYPE_CONFIG = {
  REFUND:  { label: 'Hoàn tiền', color: 'text-green-600', bg: 'bg-green-50', icon: ArrowUpCircle, sign: '+' },
  PAYMENT: { label: 'Thanh toán', color: 'text-red-500', bg: 'bg-red-50', icon: ArrowDownCircle, sign: '-' },
  TOP_UP:  { label: 'Nạp tiền', color: 'text-blue-600', bg: 'bg-blue-50', icon: ArrowUpCircle, sign: '+' },
};

export default function WalletPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WalletApi.getWallet()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card">
      <div className="card-body py-20 text-center">
        <span className="spinner" /> Đang tải ví...
      </div>
    </div>
  );

  const balance = data?.balance || 0;
  const transactions = data?.transactions || [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Balance Card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/80">Ví PharmaCare</div>
            <div className="text-3xl font-extrabold tracking-tight">{fmt(balance)}</div>
          </div>
        </div>
        <div className="text-xs text-white/60">
          Số dư ví có thể dùng để thanh toán đơn hàng. Khi đơn bị hủy, tiền sẽ hoàn vào ví tự động.
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-body">
          <h2 className="mb-4 text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Lịch sử giao dịch
          </h2>

          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto h-12 w-12 text-slate-200" />
              <p className="mt-3 text-sm text-slate-500">Chưa có giao dịch nào</p>
              <Link to="/shop/medicines" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
                Tiếp tục mua sắm →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.TOP_UP;
                const Icon = config.icon;
                return (
                  <div key={tx.id} className={`flex items-center gap-3 rounded-xl ${config.bg} p-3.5 transition-all hover:shadow-sm`}>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{config.label}</span>
                        <span className={`text-sm font-bold ${config.color}`}>
                          {config.sign}{fmt(tx.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">{tx.description}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          Số dư: {fmt(tx.balanceAfter)}
                        </span>
                      </div>
                      {tx.orderId > 0 && (
                        <Link to={`/shop/orders/${tx.orderId}`} className="text-xs text-blue-600 hover:underline">
                          Đơn #{tx.orderId}
                        </Link>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
