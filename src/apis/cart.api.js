import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.sales);

export const CartApi = {
  /** Lấy giỏ hàng */
  getCart: async () => {
    const res = await http.get('/cart');
    return res.data;
  },

  /** Thêm sản phẩm vào giỏ (cộng dồn nếu trùng medicineId + priceTier) */
  addItem: async (item) => {
    const res = await http.post('/cart/items', item);
    return res.data;
  },

  /** Cập nhật số lượng 1 item */
  updateQty: async (itemId, qty) => {
    const res = await http.put(`/cart/items/${itemId}`, { qty });
    return res.data;
  },

  /** Xóa 1 item */
  removeItem: async (itemId) => {
    const res = await http.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  /** Xóa toàn bộ giỏ hàng */
  clearCart: async () => {
    await http.delete('/cart');
  },
};
