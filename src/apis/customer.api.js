// File: src/apis/customer.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.customer);

export const CustomerApi = {
  /* ── Customers ── */
  getCustomers: async () => { const r = await http.get('/customers'); return r.data; },
  getCustomer: async (id) => { const r = await http.get(`/customers/${id}`); return r.data; },
  createCustomer: async (data) => { const r = await http.post('/customers', data); return r.data; },
  updateCustomer: async (id, data) => { const r = await http.put(`/customers/${id}`, data); return r.data; },

  /* ── Self-lookup (Buyer) ── */
  getMyCustomer: async () => { const r = await http.get('/customers/me'); return r.data; },

  /* ── Debts (controller: /customers/debts) ── */
  getCustomerDebts: async (customerId) => { const r = await http.get(`/customers/debts/customer/${customerId}`); return r.data; },
  getTotalDebt: async (customerId) => { const r = await http.get(`/customers/debts/customer/${customerId}/total`); return r.data; },

  /* ── Loyalty (controller: /customers/loyalty) ── */
  getLoyaltyBalance: async (customerId) => { const r = await http.get(`/customers/loyalty/customer/${customerId}/balance`); return r.data; },
  getLoyaltyTransactions: async (customerId) => { const r = await http.get(`/customers/loyalty/customer/${customerId}`); return r.data; },
};
