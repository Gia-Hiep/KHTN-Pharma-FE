// File: src/pages/admin/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, TrendingUp, AlertTriangle, XCircle, Trophy, BarChart3, Settings, Users, MessageCircle, ChevronRight } from 'lucide-react';
import { ReportApi } from '../../apis';
import { PageShell, StatCard } from '../../components/ui';

const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const num = (n) => n == null ? '—' : Number(n).toLocaleString('vi-VN');

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ReportApi.getDashboard()
      .then(setData)
      .catch(e => setError(e?.message || 'Không tải được dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <PageShell variant="admin" title="Dashboard">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ border: '1px solid var(--color-border)' }}>
            <div className="skeleton h-6 w-6 rounded-full mb-2" />
            <div className="skeleton-text w-2/3 h-6 mb-1" />
            <div className="skeleton-text w-full h-3" />
          </div>
        ))}
      </div>
    </PageShell>
  );

  if (error) return (
    <PageShell variant="admin" title="Dashboard">
      <div className="alert alert-error flex items-center gap-2" role="alert">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {error}
      </div>
    </PageShell>
  );

  const kpis = [
    { icon: <DollarSign className="h-6 w-6" />, label: 'Doanh thu hôm nay',  value: fmt(data?.revenueToday),        color: 'indigo' },
    { icon: <Package className="h-6 w-6" />,    label: 'Đơn hàng hôm nay',   value: num(data?.invoicesToday),        color: 'green' },
    { icon: <TrendingUp className="h-6 w-6" />, label: 'Doanh thu tháng',     value: fmt(data?.revenueThisMonth),     color: 'blue' },
    { icon: <AlertTriangle className="h-6 w-6" />, label: 'Tồn kho thấp',     value: num(data?.lowStockAlerts),       color: 'amber' },
    { icon: <XCircle className="h-6 w-6" />,    label: 'Hết hàng',            value: num(data?.outOfStockAlerts),     color: 'red' },
    { icon: <Trophy className="h-6 w-6" />,     label: 'Top thuốc tháng',     value: data?.topMedicineThisMonth || '—', color: 'cyan' },
  ];

  const growth = data?.revenueGrowthRate;
  const growthStr = growth == null ? '—' : (growth >= 0 ? `+${growth}%` : `${growth}%`);
  const growthColor = growth == null ? '#64748b' : growth >= 0 ? '#059669' : '#dc2626';

  const quickLinks = [
    { to: '/admin/reports',     label: 'Báo cáo',       desc: 'Doanh thu, thống kê',  icon: <BarChart3 className="h-5 w-5 text-indigo-500" /> },
    { to: '/admin/policies',    label: 'Chính sách',    desc: 'Giá & coupon',          icon: <Settings className="h-5 w-5 text-indigo-500" /> },
    { to: '/admin/users',       label: 'Người dùng',    desc: 'Quản lý tài khoản',     icon: <Users className="h-5 w-5 text-indigo-500" /> },
    { to: '/admin/chatbot-faq', label: 'FAQ Chatbot',   desc: 'Quản lý câu hỏi',       icon: <MessageCircle className="h-5 w-5 text-indigo-500" /> },
  ];

  return (
    <PageShell variant="admin" title="Dashboard">
      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(k => (
          <StatCard
            key={k.label}
            icon={k.icon}
            label={k.label}
            value={k.value}
            color={k.color}
          />
        ))}
      </div>

      {/* Month summary + Quick links */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Monthly summary */}
        <div className="page-section" style={{ marginBottom: 0 }}>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Tổng quan tháng này</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Doanh thu tháng</div>
              <div className="font-bold text-slate-900 mt-0.5">{fmt(data?.revenueThisMonth)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Tháng trước</div>
              <div className="font-bold text-slate-900 mt-0.5">{fmt(data?.revenueLastMonth)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Tăng trưởng</div>
              <div className="font-bold mt-0.5" style={{ color: growthColor }}>{growthStr}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Đơn hàng tháng</div>
              <div className="font-bold text-slate-900 mt-0.5">{num(data?.invoicesThisMonth)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Giá trị nhập kho</div>
              <div className="font-bold text-slate-900 mt-0.5">{fmt(data?.purchaseValueThisMonth)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Đơn nhập chờ</div>
              <div className="font-bold mt-0.5" style={{ color: 'var(--color-warning-600)' }}>{num(data?.pendingPurchaseOrders)}</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="page-section" style={{ marginBottom: 0 }}>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Truy cập nhanh</h3>
          <div className="space-y-2">
            {quickLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm hover-elevate"
                style={{ border: '1px solid var(--color-border)' }}
                aria-label={`${link.label} — ${link.desc}`}
              >
                <span className="flex items-center gap-3">
                  {link.icon}
                  <span>
                    <span className="font-semibold text-slate-900">{link.label}</span>
                    <span className="text-slate-500"> — {link.desc}</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!data?.revenueToday && data?.revenueToday !== 0 && (
        <div className="alert alert-warning flex items-center gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Dashboard đang hiển thị dữ liệu từ snapshot. Nếu thấy toàn bộ giá trị là 0, hãy chạy seed SQL hoặc nhập snapshot vào <code className="font-mono text-xs">reporting_db</code>.
        </div>
      )}
    </PageShell>
  );
}
