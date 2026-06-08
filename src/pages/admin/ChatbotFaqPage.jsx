import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Bot, Tag, Hash } from 'lucide-react';
import { ChatbotApi } from '../../apis';
import { PageShell } from '../../components/ui';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const EMPTY_FORM = {
  intent: '',
  keywords: '',
  question: '',
  answer: '',
  priority: 5,
};

function getErrorMessage(error) {
  return (
    error?.data?.message ||
    error?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Có lỗi xảy ra'
  );
}

export function ChatbotFaqAdminPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState(null);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = searchQ.trim()
        ? await ChatbotApi.searchFaqs(searchQ)
        : await ChatbotApi.getFaqs();
      setFaqs(Array.isArray(res) ? res : []);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQ]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const startCreate = () => {
    setEditingId('new');
    setForm(EMPTY_FORM);
    setMsg(null);
  };

  const startEdit = (faq) => {
    setEditingId(faq.id);
    setForm({
      intent: faq.intent || '',
      keywords: faq.keywords || '',
      question: faq.question || '',
      answer: faq.answer || '',
      priority: faq.priority ?? 5,
    });
    setMsg(null);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);

    const payload = {
      intent: form.intent.trim(),
      keywords: form.keywords.trim(),
      question: form.question.trim(),
      answer: form.answer.trim(),
      priority: Number(form.priority) || 5,
    };

    try {
      if (editingId === 'new') {
        await ChatbotApi.createFaq(payload);
        setMsg({ type: 'success', text: 'Tạo FAQ thành công' });
      } else {
        await ChatbotApi.updateFaq(editingId, payload);
        setMsg({ type: 'success', text: 'Cập nhật FAQ thành công' });
      }
      cancel();
      loadFaqs();
    } catch (error) {
      setMsg({ type: 'error', text: getErrorMessage(error) });
    }
  };

  const deleteFaq = async (id) => {
    if (!window.confirm('Xóa FAQ này?')) return;
    try {
      await ChatbotApi.deleteFaq(id);
      setMsg({ type: 'success', text: 'Đã xóa FAQ' });
      loadFaqs();
    } catch (error) {
      setMsg({ type: 'error', text: getErrorMessage(error) });
    }
  };

  return (
    <PageShell variant="admin" title="Quản lý FAQ Chatbot">
      {/* Search + Add */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Tìm câu hỏi..."
            className="input w-full pl-9 py-2 text-sm"
          />
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4 mr-1" /> Thêm FAQ
        </Button>
      </div>

      {msg && (
        <div className={`alert text-sm mb-4 ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.text}
        </div>
      )}

      {/* Edit / Create Form */}
      {editingId && (
        <form onSubmit={save} className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">
              {editingId === 'new' ? 'Tạo mới FAQ' : `Sửa FAQ #${editingId}`}
            </h3>
            <button type="button" onClick={cancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Intent *</label>
              <input
                required
                value={form.intent}
                onChange={(e) => setForm((prev) => ({ ...prev, intent: e.target.value }))}
                placeholder="VD: ORDER_STATUS, POLICY_SHIPPING"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Keywords *</label>
              <input
                required
                value={form.keywords}
                onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="VD: giao hàng, ship, vận chuyển"
                className="input w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Câu hỏi *</label>
            <input
              required
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              className="input w-full text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Câu trả lời *</label>
            <textarea
              required
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              rows={4}
              className="input w-full text-sm resize-y"
            />
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Priority</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                className="input w-24 text-sm"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button type="submit" size="sm">Lưu</Button>
              <Button type="button" variant="ghost" size="sm" onClick={cancel}>Hủy</Button>
            </div>
          </div>
        </form>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Chưa có FAQ nào</div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{faq.question}</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{faq.answer}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="info">
                      <Tag className="h-3 w-3 mr-1 inline" />{faq.intent}
                    </Badge>
                    {faq.keywords && (
                      <Badge variant="gray">{faq.keywords}</Badge>
                    )}
                    <Badge variant="gray">
                      <Hash className="h-3 w-3 mr-0.5 inline" />P{faq.priority ?? 5}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => startEdit(faq)} title="Sửa"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteFaq(faq.id)} title="Xóa"
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
