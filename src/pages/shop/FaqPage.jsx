// File: src/pages/shop/FaqPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { ChatbotApi } from '../../apis';
import { useAsync } from '../../hooks/useAsync';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';

/* Search Icon */
const SearchIcon = () => (
  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

/* Skeleton */
function FaqSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4 md:p-6 space-y-2">
          <div className="skeleton-text w-3/4 h-5" />
          <div className="skeleton-text w-full" />
          <div className="skeleton-text w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function FaqPage() {
  const [query, setQuery] = useState('');
  const faqs    = useAsync(ChatbotApi.getFaqs);
  const results = useAsync(ChatbotApi.searchFaqs);

  useEffect(() => { faqs.run(); }, [faqs.run]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = useCallback(async () => {
    if (!query.trim()) { faqs.run(); return; }
    await results.run(query);
  }, [query, faqs, results]);

  const displayList = query.trim() && results.data ? results.data : (faqs.data || []);
  const loading = faqs.loading || results.loading;
  const error   = faqs.error || results.error;

  return (
    <div className="space-y-6">
      <PageHeader title="💊 Câu hỏi thường gặp (FAQ)" />

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="faq-search" className="mb-1.5 block text-sm font-semibold text-slate-700">Tìm kiếm FAQ</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <input
                  id="faq-search"
                  className="input pl-10"
                  placeholder="Nhập từ khóa..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                  aria-label="Tìm kiếm câu hỏi thường gặp"
                />
              </div>
            </div>
            <button onClick={doSearch} className="btn-primary" disabled={loading} aria-label="Tìm kiếm">
              {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Tìm'}
            </button>
            {query && (
              <button onClick={() => setQuery('')} className="btn-secondary" aria-label="Xóa tìm kiếm">
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error flex items-center justify-between">
          <span>⚠ Lỗi: {error}</span>
          <button onClick={doSearch} className="btn-secondary px-3 py-1.5 text-xs" aria-label="Thử lại">🔄 Thử lại</button>
        </div>
      )}

      {/* Loading */}
      {loading && <FaqSkeleton />}

      {/* FAQ List */}
      {!loading && (
        <div className="space-y-3">
          {displayList.map((faq, i) => (
            <div key={faq.id ?? i} className="card transition-all duration-200 hover:-translate-y-0.5">
              <div className="card-body">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="badge badge-info shrink-0">{faq.intent || 'FAQ'}</span>
                  <h3 className="text-base font-bold text-slate-900">{faq.question}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                {faq.keywords && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {faq.keywords.split(',').map((kw) => (
                      <span key={kw} className="badge badge-gray text-[11px]">{kw.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {displayList.length === 0 && (
            <div className="card">
              <div className="card-body">
                <EmptyState icon="🔍" title="Không có kết quả" subtitle="Hãy thử đổi từ khóa tìm kiếm." />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
