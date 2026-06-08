import axios from 'axios';
import { tokenStorage } from './storage.js';
import { unwrapResponse } from './unwrap.js';

/**
 * Factory: tạo axios instance riêng cho từng service.
 * Interceptors attach JWT và handle 401 giống http.js gốc.
 */
export function createHttp(baseURL) {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request: gắn JWT token
  instance.interceptors.request.use(
    (config) => {
      const token = tokenStorage.get();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response: unwrap + handle 401
  instance.interceptors.response.use(
    (response) => ({ ...response, data: unwrapResponse(response.data) }),
    (error) => {
      if (error.response?.status === 401 && !error.config?.skipAuthLogout) {
        tokenStorage.remove();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Phân biệt Network Error (service down) vs HTTP Error (4xx/5xx)
      const isNetworkError = !error.response;
      const apiError = {
        status:  isNetworkError ? 0 : error.response.status,
        message: isNetworkError
          ? `Không thể kết nối đến service. Kiểm tra backend đang chạy (${error.config?.baseURL}).`
          : (error.response?.data?.message || error.response?.statusText || error.message),
        data:    error.response?.data?.data ?? error.response?.data,
        path:    error.config?.url,
        method:  error.config?.method?.toUpperCase(),
      };
      return Promise.reject(apiError);
    }
  );

  return instance;
}
