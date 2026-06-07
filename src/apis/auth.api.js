// File: src/apis/auth.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.auth);

export const AuthApi = {
  /* ── Auth ── */
  login: async (data) => { const r = await http.post('/auth/login', data); return r.data; },
  register: async (data) => { const r = await http.post('/auth/register', data); return r.data; },

  /* ── Profile (current user) ── */
  getProfile: async () => { const r = await http.get('/auth/me'); return r.data; },
  updateProfile: async (data) => { const r = await http.put('/auth/me', data); return r.data; },
  changeMyPassword: async (data) => { const r = await http.post('/auth/me/password', data); return r.data; },

  /* ── Admin: User management ── */
  getUsers: async (params) => { const r = await http.get('/auth/users', { params }); return r.data; },
  createUser: async (data) => { const r = await http.post('/auth/users', data); return r.data; },
  updateUser: async (id, data) => { const r = await http.put(`/auth/users/${id}`, data); return r.data; },
  changePassword: async (id, data) => { const r = await http.post(`/auth/users/${id}/password`, data); return r.data; },
  setUserRoles: async (id, data) => { const r = await http.put(`/auth/users/${id}/roles`, data); return r.data; },
  setUserStatus: async (id, data) => { const r = await http.put(`/auth/users/${id}/status`, data); return r.data; },
  updateUserRole: async (id, role) => { const r = await http.put(`/auth/users/${id}/role`, { role }); return r.data; },
};
