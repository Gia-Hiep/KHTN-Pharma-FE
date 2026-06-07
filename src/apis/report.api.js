// File: src/apis/report.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.report);

export const ReportApi = {
  getDashboard: async () => {
    const r = await http.get('/reports/dashboard');
    return r.data;
  },

  getAdminSummary: async (params) => {
    const r = await http.get('/reports/summary', { params });
    return r.data;
  },

  getReportOrders: async (params) => {
    const r = await http.get('/reports/orders', { params });
    return r.data;
  },

  getReportOrderDetail: async (source, id) => {
    const r = await http.get(`/reports/orders/${source}/${id}`);
    return r.data;
  },

  getAdminTopProducts: async (params) => {
    const r = await http.get('/reports/top-products', { params });
    return r.data;
  },

  getDailyRevenue: async (date) => {
    const r = await http.get('/reports/revenue/daily', { params: { date } });
    return r.data;
  },

  getMonthlyRevenue: async (month) => {
    const r = await http.get('/reports/revenue/monthly', { params: { month } });
    return r.data;
  },

  getSalesReport: async (params) => {
    const r = await http.get('/reports/sales', { params });
    return r.data;
  },

  getTopSellingProducts: async (month, limit) => {
    const r = await http.get('/reports/products/top-selling', { params: { month, limit } });
    return r.data;
  },

  getInventoryReport: async (params) => {
    const r = await http.get('/reports/inventory', { params });
    return r.data;
  },

  getExpiringInventory: async (days) => {
    const r = await http.get('/reports/inventory/expiring', { params: { days } });
    return r.data;
  },

  getAuditLogs: async (params) => {
    const r = await http.get('/reports/audit-logs', { params });
    return r.data;
  },

  getCustomersByRegion: async (month) => {
    const r = await http.get('/reports/customers/by-region', { params: { month } });
    return r.data;
  },
};
