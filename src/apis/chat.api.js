import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.chat);

const sortMessagesAsc = (messages) => {
  if (!Array.isArray(messages)) return [];
  return [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt || a.sentAt || 0).getTime();
    const tb = new Date(b.createdAt || b.sentAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return Number(a.id || 0) - Number(b.id || 0);
  });
};

export const ChatApi = {
  getMyConversations: async () => { const r = await http.get('/chat/conversations'); return r.data; },
  getSupportInbox: async () => { const r = await http.get('/chat/support/inbox'); return r.data; },
  createOrGetConversation: async (data) => { const r = await http.post('/chat/conversations', data); return r.data; },
  getAllMessages: async (convId) => {
    const r = await http.get(`/chat/conversations/${convId}/messages/all`);
    return sortMessagesAsc(r.data);
  },
  sendMessage: async (data) => { const r = await http.post('/chat/messages', data); return r.data; },
  markAsRead: async (convId) => { const r = await http.post(`/chat/conversations/${convId}/read`); return r.data; },
  closeConversation: async (convId) => { const r = await http.post(`/chat/conversations/${convId}/close`); return r.data; },
};
