import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import {
  FlaskConical, ShoppingCart, Package, MessageCircle, User, HelpCircle, Bot,
  ClipboardList, Archive, FileText, Download, Building2, Users,
  BarChart3, UserCog, Settings, FileBarChart,
  Menu, X, Cross, ChevronLeft, ChevronRight, Wallet,
} from 'lucide-react';

/* ─── Menu Definitions ────────────────────────────────────────────────── */

const BUYER_MENU = [
  { section: null, items: [
    { label: 'Thuốc',      to: '/shop/medicines',    icon: FlaskConical },
    { label: 'Giỏ hàng',   to: '/shop/cart',         icon: ShoppingCart },
    { label: 'Đơn hàng',   to: '/shop/orders',       icon: Package },
  ]},
  { section: 'Hỗ trợ', items: [
    { label: 'Hỗ trợ',     to: '/shop/support-chat', icon: MessageCircle },
    { label: 'FAQ',         to: '/shop/faq',          icon: HelpCircle },
    { label: 'Chatbot',     to: '/shop/chatbot',      icon: Bot },
  ]},
  { section: 'Tài khoản', items: [
    { label: 'Ví',         to: '/shop/wallet',       icon: Wallet },
    { label: 'Tài khoản',  to: '/shop/profile',      icon: User },
  ]},
];

const PUBLIC_MENU = [
  { section: null, items: [
    { label: 'FAQ',      to: '/shop/faq',     icon: HelpCircle },
    { label: 'Chatbot',  to: '/shop/chatbot', icon: Bot },
  ]},
];

const PHARMACIST_MENU = [
  { section: 'Vận hành', items: [
    { label: 'Đơn hàng online', to: '/pharma/orders',    icon: ClipboardList },
    { label: 'Thuốc',           to: '/pharma/medicines',  icon: FlaskConical },
    { label: 'Kho',             to: '/pharma/inventory',  icon: Archive },
    { label: 'Hóa đơn nội bộ', to: '/pharma/invoices',   icon: FileText },
    { label: 'Nhập hàng',       to: '/pharma/purchases',  icon: Download },
    { label: 'Nhà cung cấp',   to: '/pharma/suppliers',   icon: Building2 },
  ]},
  { section: 'Khách hàng', items: [
    { label: 'Khách hàng',     to: '/pharma/customers',  icon: Users },
    { label: 'Hỗ trợ chat',   to: '/pharma/support',     icon: MessageCircle },
  ]},
];

const ADMIN_MENU = [
  { section: 'Quản trị', items: [
    { label: 'Dashboard',    to: '/admin/dashboard',   icon: BarChart3 },
    { label: 'Người dùng',  to: '/admin/users',        icon: UserCog },
    { label: 'Chính sách',  to: '/admin/policies',     icon: Settings },
    { label: 'Báo cáo',     to: '/admin/reports',      icon: FileBarChart },
    { label: 'FAQ chatbot', to: '/admin/chatbot-faq',  icon: Bot },
  ]},
];

/* ─── Role accent config ─────────────────────────────────────────────── */
const ROLE_THEME = {
  shop:   { activeBg: 'bg-blue-50/70',  activeText: 'text-blue-700',  activeBar: 'bg-blue-600' },
  pharma: { activeBg: 'bg-teal-50/70',  activeText: 'text-teal-700',  activeBar: 'bg-teal-600' },
  admin:  { activeBg: 'bg-violet-50/70', activeText: 'text-violet-700', activeBar: 'bg-violet-600' },
};

const ROLE_LOGO_GRADIENT = {
  shop:   'linear-gradient(135deg, #3b82f6, #2563eb)',
  pharma: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  admin:  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
};

const ROLE_LOGO_COLOR = {
  shop:   '#2563eb',
  pharma: '#0d9488',
  admin:  '#6d28d9',
};

/* ─── Components ──────────────────────────────────────────────────────── */

function MenuSection({ section, items, theme, collapsed, onNavigate }) {
  return (
    <div>
      {section && !collapsed && (
        <div className="px-4 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {section}
        </div>
      )}
      {collapsed && section && (
        <div className="mx-3 my-2 h-px bg-slate-200" />
      )}
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'group relative flex items-center mx-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? `${theme.activeBg} ${theme.activeText} font-semibold`
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left bar indicator */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${theme.activeBar}`} />
                )}
                <IconComponent className={`shrink-0 opacity-70 group-hover:opacity-100 transition-opacity ${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

export function SideNav({ variant = 'admin' }) {
  const { hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const theme = ROLE_THEME[variant] || ROLE_THEME.admin;

  const closeMobile = () => setMobileOpen(false);

  const getMenuSections = () => {
    if (variant === 'shop' || variant === 'public') {
      return hasRole('BUYER') ? BUYER_MENU : PUBLIC_MENU;
    }
    if (variant === 'pharma') {
      return PHARMACIST_MENU;
    }
    const sections = [];
    if (hasRole('ADMIN')) {
      sections.push(...ADMIN_MENU);
    } else if (hasRole('PHARMACIST')) {
      sections.push(...PHARMACIST_MENU);
    }
    return sections;
  };

  const menuSections = getMenuSections();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`flex items-center shrink-0 border-b border-slate-200 ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'}`}
        style={{ height: 'var(--topbar-height)' }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0"
          style={{ background: ROLE_LOGO_GRADIENT[variant] || ROLE_LOGO_GRADIENT.admin }}
        >
          <Cross className="w-4 h-4" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight" style={{ color: ROLE_LOGO_COLOR[variant] || ROLE_LOGO_COLOR.admin }}>
            PharmaCare
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1">
        {menuSections.map((group, i) => (
          <MenuSection
            key={group.section || i}
            section={group.section}
            items={group.items}
            theme={theme}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block shrink-0 border-t border-slate-200 px-2 py-2">
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          <p className="text-[10px] text-slate-400 text-center">© 2026 Pharmacy SOA</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile toggle button ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 lg:hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: collapsed ? 64 : 'var(--sidebar-width)' }}
      >
        {/* Mobile close */}
        {mobileOpen && (
          <button
            type="button"
            onClick={closeMobile}
            className="absolute right-2 top-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
