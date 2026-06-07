// File: src/apis/chatbot.api.js
import { createHttp } from './createHttp';
import { SERVICE_URLS } from './serviceUrls';
const http = createHttp(SERVICE_URLS.chatbot);

export const ChatbotApi = {
  // Legacy FAQ-based chatbot
  sendMessage: async (data) => { const r = await http.post('/chatbot/message', data); return r.data; },
  // New AI chatbot (RAG + Gemini)
  queryAI: async (data) => { const r = await http.post('/chatbot/query', data); return r.data; },
  // Admin: RAG management
  importDocument: async (data) => { const r = await http.post('/chatbot/documents/import', data); return r.data; },
  reindex: async () => { const r = await http.post('/chatbot/reindex'); return r.data; },
  // FAQs
  getFaqs: async () => { const r = await http.get('/chatbot/faq'); return r.data; },
  searchFaqs: async (q) => { const r = await http.get('/chatbot/faq/search', { params: { q } }); return r.data; },
  createFaq: async (data) => { const r = await http.post('/chatbot/faq', data); return r.data; },
  updateFaq: async (id, data) => { const r = await http.put(`/chatbot/faq/${id}`, data); return r.data; },
  deleteFaq: async (id) => { const r = await http.delete(`/chatbot/faq/${id}`); return r.data; },
};
