import { createBrowserRouter, Navigate } from 'react-router-dom';

import { RequireAuth } from './providers/RequireAuth';
import { RequireRole } from './providers/RequireRole';

import { ShopLayout } from './layouts/ShopLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { PharmaLayout } from './layouts/PharmaLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

// ── SHOP / PUBLIC ────────────────────────────────────────────────────────────
import { FaqPage } from './pages/shop/FaqPage';
import { ChatbotPage } from './pages/shop/ChatbotPage';
import { SupportChatPage } from './pages/shop/SupportChatPage';

// ── SHOP / BUYER ─────────────────────────────────────────────────────────────
import { MedicinesPage } from './pages/shop/MedicineListPage';
import { MedicineDetailPage } from './pages/shop/MedicineDetailPage';
import { CartPage } from './pages/shop/CartPage';
import { OrdersPage } from './pages/shop/BuyerOrdersPage';
import { OrderDetailPage } from './pages/shop/BuyerOrderDetailPage';
import { ProfilePage } from './pages/shop/ProfilePage';
import NotificationsPage from './pages/shop/NotificationsPage';
import DebtLoyaltyPage from './pages/shop/DebtLoyaltyPage';
import WalletPage from './pages/shop/WalletPage';

// ── ADMIN (ADMIN only) ──────────────────────────────────────────────────────
import { DashboardPage } from './pages/admin/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { PoliciesPage } from './pages/admin/PoliciesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ChatbotFaqAdminPage } from './pages/admin/ChatbotFaqPage';

// ── PHARMA (PHARMACIST + ADMIN) ─────────────────────────────────────────────
import { OrdersManagePage } from './pages/pharma/PharmacistOrdersPage';
import { OrderProcessDetailPage } from './pages/pharma/PharmacistOrderDetailPage';
import { InvoicesPage } from './pages/pharma/InvoicesPage';
import { InvoiceDetailPage } from './pages/pharma/InvoiceDetailPage';
import { CreateInvoicePage } from './pages/pharma/CreateInvoicePage';
import { PrintInvoicePage } from './pages/pharma/PrintInvoicePage';
import { InventoryPage } from './pages/pharma/InventoryPage';
import { PrintPickingSlipPage } from './pages/pharma/PrintPickingSlipPage';
import { SupportInboxPage } from './pages/pharma/SupportInboxPage';
import { PurchasesPage } from './pages/pharma/PurchasesPage';
import { SuppliersPage } from './pages/pharma/SuppliersPage';

import { CustomersPage } from './pages/pharma/CustomersPage';
import { PharmaMedicinesPage } from './pages/pharma/PharmaMedicinesPage';

/** Admin index: redirect dựa theo role — ADMIN→dashboard, PHARMACIST→pharma/orders */
function AdminIndexRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = user?.roles || [];
  if (roles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />;
  if (roles.includes('PHARMACIST')) return <Navigate to="/pharma/orders" replace />;
  return <Navigate to="/pharma/orders" replace />;
}

export const router = createBrowserRouter([
  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC — no auth required
  // ──────────────────────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/403', element: <ForbiddenPage /> },

  // ──────────────────────────────────────────────────────────────────────────
  // SHOP LAYOUT — public + buyer
  // ──────────────────────────────────────────────────────────────────────────
  {
    path: '/shop',
    element: <ShopLayout />,
    children: [
      { index: true, element: <Navigate to="/shop/faq" replace /> },

      // Public (no auth)
      { path: 'faq', element: <FaqPage /> },
      { path: 'chatbot', element: <ChatbotPage /> },

      // BUYER — RequireAuth + RequireRole
      {
        path: 'medicines',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER', 'ADMIN']}>
              <MedicinesPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'medicines/:id',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER', 'ADMIN']}>
              <MedicineDetailPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'cart',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <CartPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'wallet',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <WalletPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <OrdersPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <OrderDetailPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'support-chat',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <SupportChatPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <NotificationsPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'debt-loyalty',
        element: (
          <RequireAuth>
            <RequireRole rolesAllowed={['BUYER']}>
              <DebtLoyaltyPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN LAYOUT — ADMIN only
  // ──────────────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminIndexRedirect />,
      },
      {
        path: 'dashboard',
        element: (
          <RequireRole rolesAllowed={['ADMIN']}>
            <DashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'users',
        element: (
          <RequireRole rolesAllowed={['ADMIN']}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: 'policies',
        element: (
          <RequireRole rolesAllowed={['ADMIN']}>
            <PoliciesPage />
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireRole rolesAllowed={['ADMIN']}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'chatbot-faq',
        element: (
          <RequireRole rolesAllowed={['ADMIN']}>
            <ChatbotFaqAdminPage />
          </RequireRole>
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHARMA LAYOUT — PHARMACIST + ADMIN
  // ──────────────────────────────────────────────────────────────────────────
  {
    path: '/pharma',
    element: (
      <RequireAuth>
        <PharmaLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/pharma/orders" replace />,
      },

      // Order management
      {
        path: 'orders',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <OrdersManagePage />
          </RequireRole>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <OrderProcessDetailPage />
          </RequireRole>
        ),
      },
      {
        path: 'orders/:id/picking-slip',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <PrintPickingSlipPage />
          </RequireRole>
        ),
      },

      // POS Invoices
      {
        path: 'invoices',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <InvoicesPage />
          </RequireRole>
        ),
      },
      {
        path: 'invoices/new',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <CreateInvoicePage />
          </RequireRole>
        ),
      },
      {
        path: 'invoices/:id',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <InvoiceDetailPage />
          </RequireRole>
        ),
      },

      // Inventory
      {
        path: 'inventory',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <InventoryPage />
          </RequireRole>
        ),
      },

      // Medicines management
      {
        path: 'medicines',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <PharmaMedicinesPage />
          </RequireRole>
        ),
      },

      // Purchase management (NEW)
      {
        path: 'purchases',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <PurchasesPage />
          </RequireRole>
        ),
      },

      // Supplier management (NEW)
      {
        path: 'suppliers',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <SuppliersPage />
          </RequireRole>
        ),
      },

      // Customer management
      {
        path: 'customers',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <CustomersPage />
          </RequireRole>
        ),
      },

      // Support inbox
      {
        path: 'support',
        element: (
          <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
            <SupportInboxPage />
          </RequireRole>
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PRINT — standalone, auth required
  // ──────────────────────────────────────────────────────────────────────────
  {
    path: '/print/invoices/:id',
    element: (
      <RequireAuth>
        <RequireRole rolesAllowed={['PHARMACIST', 'ADMIN']}>
          <PrintInvoicePage />
        </RequireRole>
      </RequireAuth>
    ),
  },

  // Root redirect
  { path: '/', element: <Navigate to="/shop/medicines" replace /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
