// File: src/apis/wallet.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';

const http = createHttp(SERVICE_URLS.sales);

export const WalletApi = {
  /** Lấy số dư ví */
  getBalance: async () => {
    const res = await http.get('/wallet/balance');
    return res.data;
  },

  /** Lấy số dư + lịch sử giao dịch */
  getWallet: async () => {
    const res = await http.get('/wallet');
    return res.data;
  },
};
