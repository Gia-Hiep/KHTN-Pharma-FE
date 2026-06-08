import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.inventory);

export const InventoryApi = {
  /* ── View Stock ── */
  getSummary: async (medicineId) => {
    const res = await http.get('/inventory/summary', { params: medicineId ? { medicineId } : {} });
    return res.data;
  },
  getLots: async (params) => {
    const res = await http.get('/inventory/lots', { params });
    return res.data;
  },

  /* ── Alerts ── */
  getLowStockAlerts: async () => {
    const res = await http.get('/inventory/alerts/low-stock');
    return res.data;
  },
  getExpiryAlerts: async (before) => {
    const res = await http.get('/inventory/alerts/expiry', { params: before ? { before } : {} });
    return res.data;
  },

  /* ── Transactions ── */
  getTransactions: async (params) => {
    const res = await http.get('/inventory/transactions', { params });
    return res.data;
  },

  /* ── Admin Actions ── */
  adjust: async (data) => { const r = await http.post('/inventory/adjust', data); return r.data; },
  markDamaged: async (data) => { const r = await http.post('/inventory/mark-damaged', data); return r.data; },
  markExpired: async (data) => { const r = await http.post('/inventory/mark-expired', data); return r.data; },
  backfillNames: async () => { const r = await http.post('/inventory/admin/backfill-names'); return r.data; },
};
