// File: src/apis/sales.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.sales);

export const SalesApi = {
  getInvoices: async (params) => { const r = await http.get('/sales/invoices', { params }); return r.data; },
  getInvoice: async (id) => { const r = await http.get(`/sales/invoices/${id}`); return r.data; },
  createInvoice: async (data) => { const r = await http.post('/sales/invoices', data); return r.data; },
  getInvoiceItems: async (id) => { const r = await http.get(`/sales/invoices/${id}/items`); return r.data; },
  getInvoicePayments: async (id) => { const r = await http.get(`/sales/invoices/${id}/payments`); return r.data; },
  addInvoiceItem: async (id, data) => { const r = await http.post(`/sales/invoices/${id}/items`, data); return r.data; },
  updateInvoiceItemQty: async (invId, itemId, qty) => { const r = await http.put(`/sales/invoices/${invId}/items/${itemId}`, { qty }); return r.data; },
  removeInvoiceItem: async (invId, itemId) => { const r = await http.delete(`/sales/invoices/${invId}/items/${itemId}`); return r.data; },
  addPayment: async (id, data) => { const r = await http.post(`/sales/invoices/${id}/payments`, data); return r.data; },
  completeInvoice: async (id) => { const r = await http.post(`/sales/invoices/${id}/complete`); return r.data; },
  cancelInvoice: async (id) => { const r = await http.post(`/sales/invoices/${id}/cancel`); return r.data; },
  checkoutInvoice: async (id) => { const r = await http.post(`/sales/invoices/${id}/checkout`); return r.data; },
  payInvoice: async (id, data) => { const r = await http.post(`/sales/invoices/${id}/payments`, data); return r.data; },
};
