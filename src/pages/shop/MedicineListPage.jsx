import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ShoppingCart, Plus, Check, AlertTriangle, Pill } from 'lucide-react';
import { CatalogApi } from '../../apis/catalog.api';
import { CartApi } from '../../apis/cart.api';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { PageShell } from '../../components/ui';

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const CATALOG_BASE = SERVICE_URLS.catalog;

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function normalizeUnits(medicine) {
  const units = Array.isArray(medicine?.units)
    ? medicine.units.filter((unit) => unit && unit.isActive !== false)
    : [];

  if (units.length > 0) return units;

  return [{
    unitCode: 'BASE',
    unitLabel: medicine?.unit || 'Đơn vị',
    conversionFactor: 1,
    retailPrice: medicine?.salePrice ?? 0,
    wholesalePrice: null,
    wholesaleMinQty: null,
    isBaseUnit: true,
    isDefaultSaleUnit: true,
  }];
}

function resolveDefaultUnit(medicine) {
  const units = normalizeUnits(medicine);
  return units.find((unit) => unit.isDefaultSaleUnit)
    || units.find((unit) => unit.isBaseUnit)
    || units[0];
}

/* ── Sort options ── */
const SORT_OPTIONS = [
  { key: 'default', label: 'Mặc định' },
  { key: 'price_asc', label: 'Giá tăng dần' },
  { key: 'price_desc', label: 'Giá giảm dần' },
  { key: 'name_asc', label: 'Tên A → Z' },
];

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-3" style={{ border: '1px solid var(--color-border)' }}>
      <div className="skeleton mb-3 aspect-square rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton-text w-4/5" />
        <div className="skeleton-text w-1/2" />
        <div className="skeleton h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

/* ── Product Card ── */
function MedicineCard({ medicine, index }) {
  const imgSrc = resolveImageUrl(medicine.imageUrl);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const defaultUnit = useMemo(() => resolveDefaultUnit(medicine), [medicine]);
  const displayPrice = Number(defaultUnit?.retailPrice ?? medicine.salePrice ?? 0);

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await CartApi.addItem({
        medicineId: medicine.id,
        medicineName: medicine.name,
        imageUrl: medicine.imageUrl || null,
        qty: 1,
        unitCode: defaultUnit?.unitCode,
        unitLabel: defaultUnit?.unitLabel || medicine.unit || 'Đơn vị',
        conversionFactor: defaultUnit?.conversionFactor || 1,
        unitPrice: displayPrice,
        saleMode: 'RETAIL',
        priceTier: 'RETAIL',
      });
      window.dispatchEvent(new Event('cart-updated'));
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error('Thêm giỏ hàng thất bại', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/shop/medicines/${medicine.id}`}
        className="group block overflow-hidden rounded-2xl bg-white shadow-sm hover-elevate"
        style={{ border: '1px solid var(--color-border)' }}
        aria-label={`${medicine.name} — ${fmt(displayPrice)}`}
      >
        <div className="p-3">
          {/* Image */}
          <div className="mb-3 overflow-hidden rounded-xl bg-slate-50">
            <div className="flex aspect-square items-center justify-center">
              {imgSrc && !imgError ? (
                <img
                  src={imgSrc}
                  alt={medicine.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
              ) : (
                <Pill className="h-12 w-12 text-slate-300" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-900 transition-colors group-hover:text-blue-600">
              {medicine.name}
            </h3>

            <div className="text-lg font-extrabold" style={{ color: 'var(--color-primary-600)' }}>
              {fmt(displayPrice)}
            </div>

            <div className="text-xs text-slate-500">
              / {defaultUnit?.unitLabel || medicine.unit || 'đơn vị'}
            </div>

            {medicine.packageSize && (
              <div className="text-xs text-slate-500">{medicine.packageSize}</div>
            )}

            <button
              type="button"
              onClick={addToCart}
              disabled={adding}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-all focus-ring disabled:opacity-60"
              style={{
                background: added
                  ? 'var(--color-success-500)'
                  : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
              aria-label={`Thêm ${medicine.name} vào giỏ hàng`}
            >
              {adding ? (
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : added ? (
                <><Check className="h-3.5 w-3.5" aria-hidden="true" /> Đã thêm</>
              ) : (
                <><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Thêm giỏ hàng</>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export function MedicinesPage() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const debounce = useRef(null);

  const [categories, setCategories] = useState([]);
  const [diseaseGroups, setDiseaseGroups] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDiseaseGroup, setFilterDiseaseGroup] = useState('');
  const [sortKey, setSortKey] = useState('default');

  useEffect(() => {
    CatalogApi.getCategories().then(setCategories).catch(() => {});
    CatalogApi.getDiseaseGroups().then(setDiseaseGroups).catch(() => {});
  }, []);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setErr(null);
    try {
      const res = await CatalogApi.searchMedicines(q);
      setMedicines(Array.isArray(res) ? res : []);
    } catch (e) {
      setErr(e?.message || 'Không tải được danh sách thuốc');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with URL ?q= param (from header search)
  useEffect(() => {
    setQuery(urlQuery);
    load(urlQuery);
  }, [urlQuery, load]);

  useEffect(() => { return () => clearTimeout(debounce.current); }, []);

  const handleSearch = useCallback((e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(q), 400);
  }, [load]);

  const visible = useMemo(() => {
    const ql = query.toLowerCase().trim();

    let list = ql
      ? medicines.filter(
          (m) =>
            (m.name || '').toLowerCase().includes(ql) ||
            (m.code || '').toLowerCase().includes(ql) ||
            (m.activeIngredient || '').toLowerCase().includes(ql)
        )
      : medicines;

    if (filterCategory) {
      list = list.filter((m) => String(m.categoryId) === filterCategory);
    }

    // Sort
    if (sortKey === 'price_asc') {
      list = [...list].sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    } else if (sortKey === 'price_desc') {
      list = [...list].sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    } else if (sortKey === 'name_asc') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }

    return list;
  }, [medicines, query, filterCategory, sortKey]);

  const clearFilters = () => {
    setQuery('');
    setFilterCategory('');
    setFilterDiseaseGroup('');
    setSortKey('default');
    load('');
  };

  const hasActiveFilter = filterCategory || sortKey !== 'default' || query;

  return (
    <PageShell variant="buyer">
      <div className="space-y-5">
        {/* ── Category Chips ── */}
        {categories.length > 0 && (
          <section className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo danh mục">
            <button
              type="button"
              onClick={() => setFilterCategory('')}
              className={`chip ${!filterCategory ? 'active' : ''}`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCategory(filterCategory === String(c.id) ? '' : String(c.id))}
                className={`chip ${filterCategory === String(c.id) ? 'active' : ''}`}
              >
                {c.name}
              </button>
            ))}
          </section>
        )}

        {/* ── Sort Pills + Result Count ── */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Sắp xếp">
            <span className="text-sm font-medium text-slate-500">Sắp xếp:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortKey(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  sortKey === opt.key
                    ? 'text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                style={sortKey === opt.key
                  ? { background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }
                  : { border: '1px solid var(--color-border)' }
                }
                aria-pressed={sortKey === opt.key}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            {!loading && <span aria-live="polite">{visible.length} sản phẩm</span>}
            {hasActiveFilter && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-blue-600 hover:underline">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </section>

        {/* ── Error State ── */}
        {err && (
          <div className="alert alert-error flex items-center justify-between" role="alert">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {err}
            </span>
            <button
              onClick={() => load(query)}
              className="btn-secondary px-3 py-1.5 text-xs"
              aria-label="Thử lại tải danh sách thuốc"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : visible.length ? (
          /* ── Product Grid ── */
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((m, i) => (
              <MedicineCard key={m.id} medicine={m} index={i} />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="card">
            <div className="card-body py-20 text-center">
              <div
                className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: 'var(--color-primary-50)' }}
              >
                <Pill className="h-10 w-10" style={{ color: 'var(--color-primary-500)' }} aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Không tìm thấy thuốc phù hợp</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Hãy thử đổi từ khóa tìm kiếm, chọn danh mục khác hoặc bỏ bớt bộ lọc.
              </p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-primary mt-6"
                  aria-label="Xóa bộ lọc và xem tất cả thuốc"
                >
                  Xem tất cả thuốc
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
