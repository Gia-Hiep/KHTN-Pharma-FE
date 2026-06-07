// File: src/apis/notification.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.notification);

export const NotificationApi = {
  /** Paginated notifications for the current user */
  getNotifications: async (page = 0, size = 10) => {
    const r = await http.get('/notifications', { params: { page, size } });
    return r.data;
  },

  /** Count of unread notifications */
  getUnreadCount: async () => {
    const r = await http.get('/notifications/unread-count');
    return r.data;
  },

  /** Mark a single notification as read */
  markAsRead: async (id) => {
    const r = await http.put(`/notifications/${id}/read`);
    return r.data;
  },

  /** Mark all notifications as read */
  markAllAsRead: async () => {
    const r = await http.put('/notifications/read-all');
    return r.data;
  },
};
