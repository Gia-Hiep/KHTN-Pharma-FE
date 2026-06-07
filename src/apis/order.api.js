// File: src/apis/order.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.sales);

export const OrderApi = {
  /** BUYER: tạo đơn hàng online */
  createOrder: async (data) => {
    const res = await http.post('/orders', data);
    return res.data;
  },

  /** BUYER: danh sách đơn của mình */
  myOrders: async () => {
    const res = await http.get('/orders');
    return res.data;
  },

  /** BUYER: chi tiết đơn của mình */
  myOrderDetail: async (id) => {
    const res = await http.get(`/orders/${id}`);
    return res.data;
  },

  /** PHARMACIST: inbox đơn cần xử lý */
  pharmacistInbox: async () => {
    const res = await http.get('/pharmacist/orders');
    return res.data;
  },

  /** PHARMACIST: tất cả đơn hàng */
  pharmacistAllOrders: async () => {
    const res = await http.get('/pharmacist/orders/all');
    return res.data;
  },

  /** PHARMACIST: chi tiết đơn */
  pharmacistOrderDetail: async (id) => {
    const res = await http.get(`/pharmacist/orders/${id}`);
    return res.data;
  },

  /** PHARMACIST: approve đơn (bước 1) */
  approve: async (id) => {
    const res = await http.post(`/pharmacist/orders/${id}/approve`);
    return res.data;
  },

  /** PHARMACIST: reject đơn (bước 1) */
  reject: async (id, reason) => {
    const res = await http.post(`/pharmacist/orders/${id}/reject`, { reason });
    return res.data;
  },

  /** PHARMACIST: adjust SL/giá (bước 1) */
  adjustOrder: async (id, adjustData) => {
    const res = await http.post(`/pharmacist/orders/${id}/adjust`, adjustData);
    return res.data;
  },

  /** PHARMACIST: chuyển trạng thái */
  updateStatus: async (id, status) => {
    const res = await http.post(`/pharmacist/orders/${id}/status`, { status });
    return res.data;
  },

  /** PHARMACIST: partial fulfillment — báo thiếu hàng (bước 3) */
  partialFulfill: async (id, data) => {
    const res = await http.post(`/pharmacist/orders/${id}/partial-fulfill`, data);
    return res.data;
  },

  /** PHARMACIST: tạo vận đơn (bước 4→5) */
  shipOrder: async (id, shipData) => {
    const res = await http.post(`/pharmacist/orders/${id}/ship`, shipData);
    return res.data;
  },

  /** PHARMACIST: kết quả giao hàng (bước 5→6) */
  deliveryResult: async (id, data) => {
    const res = await http.post(`/pharmacist/orders/${id}/delivery-result`, data);
    return res.data;
  },

  /** PHARMACIST: hoàn trả đơn (bước 6) */
  returnOrder: async (id, reason) => {
    const res = await http.post(`/pharmacist/orders/${id}/return`, { reason });
    return res.data;
  },

  /** PHARMACIST: xác nhận đã thu tiền COD */
  confirmPayment: async (id) => {
    const res = await http.post(`/pharmacist/orders/${id}/confirm-payment`);
    return res.data;
  },

  /** BUYER: xác nhận đã nhận hàng */
  buyerConfirmReceived: async (id) => {
    const res = await http.post(`/orders/${id}/confirm-received`);
    return res.data;
  },

  /** BUYER: hủy đơn */
  cancelOrder: async (id) => {
    const res = await http.post(`/orders/${id}/cancel`);
    return res.data;
  },

  /** PHARMACIST: hủy đơn + hoàn kho */
  pharmacistCancel: async (id, reason) => {
    const res = await http.post(`/pharmacist/orders/${id}/cancel`, { reason });
    return res.data;
  },

  /** BUYER: tạo Stripe PaymentIntent cho đơn hàng cụ thể (sau khi tạo đơn) */
  createStripeIntent: async (orderId) => {
    const res = await http.post(`/payment/stripe/create-intent/${orderId}`);
    return res.data;
  },

  /** BUYER: tạo Stripe PaymentIntent từ giỏ hàng (trước khi tạo đơn) — amount tính bằng VND */
  createCartStripeIntent: async (amountVnd) => {
    const res = await http.post('/payment/stripe/create-cart-intent', { amountVnd }, { skipAuthLogout: true });
    return res.data;
  },

  /** BUYER: polling trạng thái thanh toán (chuyển khoản / SePay) */
  pollPaymentStatus: async (orderId) => {
    const res = await http.get(`/payment/status/${orderId}`);
    return res.data;
  },

  /** DEV: simulate SePay webhook (cho demo thesis) */
  simulateSePayPayment: async (orderId) => {
    const res = await http.post(`/payment/webhook/sepay/simulate/${orderId}`);
    return res.data;
  },
};
