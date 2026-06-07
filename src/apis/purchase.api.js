// File: src/apis/purchase.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.purchase);

export const PurchaseApi = {
  /* ── Suppliers (controller: /purchase/suppliers) ── */
  getSuppliers: async () => { const r = await http.get('/purchase/suppliers'); return r.data; },
  createSupplier: async (data) => { const r = await http.post('/purchase/suppliers', data); return r.data; },
  updateSupplier: async (id, data) => { const r = await http.put(`/purchase/suppliers/${id}`, data); return r.data; },
  deactivateSupplier: async (id) => { const r = await http.delete(`/purchase/suppliers/${id}`); return r.data; },

  /* ── Purchases (controller: /purchase/purchases) ── */
  getPurchases: async () => { const r = await http.get('/purchase/purchases'); return r.data; },
  getPurchase: async (id) => { const r = await http.get(`/purchase/purchases/${id}`); return r.data; },
  createPurchase: async (data) => { const r = await http.post('/purchase/purchases', data); return r.data; },
  updatePurchase: async (id, data) => { const r = await http.put(`/purchase/purchases/${id}`, data); return r.data; },
  cancelPurchase: async (poId, reason) => { const r = await http.post(`/purchase/purchases/${poId}/cancel`, { reason }); return r.data; },

  /* ── Purchase Items ── */
  getPurchaseItems: async (poId) => { const r = await http.get(`/purchase/purchases/${poId}/items`); return r.data; },
  addPurchaseItem: async (poId, data) => { const r = await http.post(`/purchase/purchases/${poId}/items`, data); return r.data; },
  updatePurchaseItem: async (poId, itemId, data) => { const r = await http.put(`/purchase/purchases/${poId}/items/${itemId}`, data); return r.data; },
  deletePurchaseItem: async (poId, itemId) => { const r = await http.delete(`/purchase/purchases/${poId}/items/${itemId}`); return r.data; },

  /* ── Receive (DRAFT → RECEIVED + inventory inbound) ── */
  receivePurchase: async (poId) => { const r = await http.post(`/purchase/purchases/${poId}/receive`); return r.data; },
};
