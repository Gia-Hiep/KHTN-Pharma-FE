import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pill, AlertTriangle, Minus, Plus } from 'lucide-react';
import { CatalogApi } from '../../apis/catalog.api';
import { CartApi } from '../../apis/cart.api';
import { InventoryApi } from '../../apis/inventory.api';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { PageShell, Tabs } from '../../components/ui';

const CATALOG_BASE = SERVICE_URLS.catalog;

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const SALE_MODE_LABEL = {
  RETAIL: 'Giá lẻ',
  WHOLESALE: 'Giá sỉ',
};

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function getStockMeta(qty) {
  if (qty == null || qty === '?') {
    return {
      label: 'Chưa có dữ liệu tồn kho',
      badgeClass: 'badge badge-warning',
      textClass: 'text-amber-700',
    };
  }
  if (qty <= 0) {
    return {
      label: 'Hết hàng',
      badgeClass: 'badge badge-danger',
      textClass: 'text-red-700',
    };
  }
  if (qty <= 20) {
    return {
      label: 'Sắp hết hàng',
      badgeClass: 'badge badge-warning',
      textClass: 'text-amber-700',
    };
  }
  return {
    label: 'Còn hàng',
    badgeClass: 'badge badge-success',
    textClass: 'text-green-700',
  };
}

function normalizeImages(med, galleryImages) {
  if (!med) return [];

  if (Array.isArray(galleryImages) && galleryImages.length > 0) {
    return galleryImages
      .map((img) => resolveImageUrl(typeof img === 'string' ? img : img?.imageUrl || img?.url))
      .filter(Boolean);
  }

  const fromImages = Array.isArray(med.images)
    ? med.images.map((img) => (typeof img === 'string' ? img : img?.imageUrl || img?.url)).filter(Boolean)
    : [];
  const fromImageUrls = Array.isArray(med.imageUrls) ? med.imageUrls.filter(Boolean) : [];
  const raw = [med.imageUrl, med.thumbnailUrl, ...fromImages, ...fromImageUrls].filter(Boolean);

  return [...new Set(raw)].map(resolveImageUrl).filter(Boolean);
}

function normalizeUnits(med) {
  if (!med) return [];

  const units = Array.isArray(med.units)
    ? med.units.filter((unit) => unit && unit.isActive !== false)
    : [];

  if (units.length > 0) return units;

  return [{
    id: `base-${med.id ?? 'legacy'}`,
    unitCode: 'BASE',
    unitLabel: med.unit || 'Đơn vị',
    conversionFactor: 1,
    retailPrice: med.salePrice ?? 0,
    wholesalePrice: null,
    wholesaleMinQty: null,
    isBaseUnit: true,
    isDefaultSaleUnit: true,
    isActive: true,
  }];
}

function resolveDefaultUnit(units) {
  return units.find((unit) => unit.isDefaultSaleUnit)
    || units.find((unit) => unit.isBaseUnit)
    || units[0]
    || null;
}

function resolveUnitPricing(unit, fallbackPrice, qty) {
  const retailPrice = Number(unit?.retailPrice ?? fallbackPrice ?? 0);
  const hasWholesale = unit?.wholesalePrice != null && unit?.wholesaleMinQty != null;
  const wholesalePrice = Number(unit?.wholesalePrice ?? retailPrice);
  const applyWholesale = hasWholesale && qty >= Number(unit.wholesaleMinQty);

  return {
    retailPrice,
    wholesalePrice,
    hasWholesale,
    applyWholesale,
    saleMode: applyWholesale ? 'WHOLESALE' : 'RETAIL',
    unitPrice: applyWholesale ? wholesalePrice : retailPrice,
  };
}

function getSellableQty(baseQty, unit) {
  if (typeof baseQty !== 'number') return baseQty;
  const factor = Math.max(1, Number(unit?.conversionFactor) || 1);
  return Math.floor(baseQty / factor);
}

function ProductImage({ src, alt }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div
        className="flex aspect-square items-center justify-center rounded-2xl"
        style={{ background: 'var(--color-primary-50)' }}
      >
        <Pill className="h-16 w-16" style={{ color: 'var(--color-primary-300)' }} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-50">
      <img
        src={src}
        alt={alt}
        className="aspect-square h-full w-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

function InfoRow({ label, value, valueClassName = 'text-slate-900' }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 md:grid-cols-[180px_minmax(0,1fr)]">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${valueClassName}`}>{value || '—'}</div>
    </div>
  );
}

function QuickInfoCard({ label, value }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-primary-600)' }}
      >
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function MedicineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [med, setMed] = useState(null);
  const [stock, setStock] = useState(null);
  const [diseaseGroups, setDiseaseGroups] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [nearestExpiry, setNearestExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedUnitCode, setSelectedUnitCode] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      CatalogApi.getMedicine(id).catch(() => null),
      InventoryApi.getSummary(id).catch(() => null),
      CatalogApi.getDiseaseGroupsByMedicine(id).catch(() => []),
      InventoryApi.getLots({ medicineId: id, onlyAvailable: true }).catch(() => []),
      CatalogApi.getMedicineImages(id).catch(() => []),
    ])
      .then(([medicine, stockSummary, groups, lots, images]) => {
        setMed(medicine);
        setStock(stockSummary);
        setDiseaseGroups(Array.isArray(groups) ? groups : []);
        setGalleryImages(Array.isArray(images) ? images : []);

        if (Array.isArray(lots) && lots.length) {
          const sorted = lots
            .filter((lot) => lot.expiryDate)
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          setNearestExpiry(sorted[0]?.expiryDate || null);
        } else {
          setNearestExpiry(null);
        }
      })
      .catch((e) => setErr(e?.message || 'Không tải được thông tin thuốc'))
      .finally(() => setLoading(false));
  }, [id]);

  const gallery = useMemo(() => normalizeImages(med, galleryImages), [med, galleryImages]);
  const units = useMemo(() => normalizeUnits(med), [med]);

  useEffect(() => {
    setSelectedImage(gallery[0] || null);
  }, [gallery]);

  useEffect(() => {
    const defaultUnit = resolveDefaultUnit(units);
    if (!defaultUnit) {
      setSelectedUnitCode('');
      return;
    }
    setSelectedUnitCode((current) => (
      units.some((unit) => unit.unitCode === current)
        ? current
        : defaultUnit.unitCode
    ));
  }, [units]);

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.unitCode === selectedUnitCode) || resolveDefaultUnit(units),
    [units, selectedUnitCode]
  );

  const stockArr = Array.isArray(stock) ? stock : [];
  const stockItem = stockArr.find((item) => String(item.medicineId) === String(id)) || stockArr[0];
  const baseAvailable = stockItem?.availableQty ?? stockItem?.available ?? '?';
  const available = getSellableQty(baseAvailable, selectedUnit);
  const stockMeta = getStockMeta(available);
  const pricing = useMemo(
    () => resolveUnitPricing(selectedUnit, med?.salePrice, qty),
    [selectedUnit, med?.salePrice, qty]
  );

  useEffect(() => {
    if (typeof available === 'number' && available > 0 && qty > available) {
      setQty(available);
    }
  }, [available, qty]);

  const handleQtyChange = (newQty) => {
    const normalizedQty = Math.max(1, Number(newQty) || 1);
    if (typeof available === 'number' && available >= 0) {
      setQty(Math.min(normalizedQty, Math.max(1, available)));
      return;
    }
    setQty(normalizedQty);
  };

  const addToCart = async () => {
    if (!med || !selectedUnit) return;

    try {
      await CartApi.addItem({
        medicineId: med.id,
        medicineName: med.name,
        imageUrl: med.imageUrl || null,
        qty,
        unitCode: selectedUnit.unitCode,
        unitLabel: selectedUnit.unitLabel,
        conversionFactor: selectedUnit.conversionFactor || 1,
        unitPrice: pricing.unitPrice,
        saleMode: pricing.saleMode,
        priceTier: pricing.saleMode,
      });
      window.dispatchEvent(new Event('cart-updated'));
      navigate('/shop/cart');
    } catch (error) {
      console.error('Thêm giỏ hàng thất bại', error);
    }
  };

  const unitPrice = pricing.unitPrice ?? 0;
  const subtotal = unitPrice * qty;
  const comparePrice = pricing.applyWholesale && pricing.retailPrice > unitPrice
    ? pricing.retailPrice
    : (med?.originalPrice && med.originalPrice > unitPrice ? med.originalPrice : null);
  const wholesaleHint = pricing.hasWholesale
    ? (pricing.applyWholesale
      ? `Đã áp dụng giá sỉ từ ${selectedUnit?.wholesaleMinQty} ${selectedUnit?.unitLabel}.`
      : `Mua từ ${selectedUnit?.wholesaleMinQty} ${selectedUnit?.unitLabel} để được giá sỉ.`)
    : 'Đơn vị này chỉ có giá lẻ.';
  const unitListLabel = units
    .map((unit) => `${unit.unitLabel}${unit.isBaseUnit ? ' (gốc)' : ''}`)
    .join(', ');

  const tabItems = [
    { key: 'description', label: 'Mô tả sản phẩm' },
    { key: 'usage', label: 'Cách dùng' },
    { key: 'sideEffects', label: 'Tác dụng phụ' },
    { key: 'info', label: 'Thông tin thêm' },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton-text h-4 w-40" />
        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="card">
            <div className="p-4">
              <div className="skeleton aspect-square rounded-xl" />
            </div>
          </div>
          <div className="card">
            <div className="space-y-3 p-4">
              <div className="skeleton-text h-5 w-3/4" />
              <div className="skeleton-text h-8 w-1/2" />
              <div className="skeleton-text w-full" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !med) {
    return (
      <div className="mx-auto max-w-lg card">
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy thuốc</h3>
          <p className="mt-1 text-sm text-slate-500">
            {err || 'Thuốc này không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link
            to="/shop/medicines"
            className="btn-primary mt-4 inline-flex text-sm"
            aria-label="Quay lại danh sách thuốc"
          >
            ← Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant="buyer"
      breadcrumbs={[
        { label: 'Thuốc', to: '/shop/medicines' },
        { label: med.name },
      ]}
      className="mx-auto max-w-5xl">


      <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="card overflow-hidden">
          <div className="p-3">
            <ProductImage src={selectedImage} alt={med.name} />
            {gallery.length > 1 && (
              <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, idx) => {
                  const active = img === selectedImage;
                  return (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={[
                        'h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition',
                        active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300',
                      ].join(' ')}
                    >
                      <img src={img} alt={`${med.name} ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {med.origin && <span className="badge badge-info text-[11px]">{med.origin}</span>}
              {med.manufacturer && (
                <span className="badge bg-slate-100 text-[11px] text-slate-600">{med.manufacturer}</span>
              )}
              <span className={`${stockMeta.badgeClass} text-[11px]`}>{stockMeta.label}</span>
              <span className={`badge text-[11px] ${pricing.saleMode === 'WHOLESALE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {SALE_MODE_LABEL[pricing.saleMode]}
              </span>
            </div>

            <h1 className="text-xl font-extrabold leading-snug text-slate-900 md:text-2xl">{med.name}</h1>

            <div className="text-xs leading-5 text-slate-500">
              Mã: <span className="font-semibold text-slate-700">{med.code || '—'}</span>
              {' · '}
              Hoạt chất: <span className="font-semibold text-slate-700">{med.activeIngredient || '—'}</span>
              {' · '}
              {med.dosageForm || '—'}
              {med.packageSize && <> · {med.packageSize}</>}
            </div>

            {diseaseGroups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {diseaseGroups.map((group) => (
                  <span key={group.id || group.code || group.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {group.name || group.code || 'Nhóm bệnh'}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--color-primary-50)' }}>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold" style={{ color: 'var(--color-primary-600)' }}>{fmt(unitPrice)}</span>
                <span className="text-sm text-slate-500">/ {selectedUnit?.unitLabel || med.unit || 'đơn vị'}</span>
              </div>
              {comparePrice && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-slate-400 line-through">{fmt(comparePrice)}</span>
                  <span className="rounded bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    -{Math.round(((comparePrice - unitPrice) / comparePrice) * 100)}%
                  </span>
                </div>
              )}
              <div className="mt-2 text-xs text-slate-600">{wholesaleHint}</div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600">Đơn vị bán</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {units.map((unit) => {
                  const active = unit.unitCode === selectedUnit?.unitCode;
                  const unitPricing = resolveUnitPricing(unit, med.salePrice, qty);
                  return (
                    <button
                      key={unit.id ?? unit.unitCode}
                      type="button"
                      onClick={() => setSelectedUnitCode(unit.unitCode)}
                      className={[
                        'rounded-xl border px-3 py-3 text-left transition',
                        active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{unit.unitLabel}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            1 {unit.unitLabel} = {unit.conversionFactor || 1} {med.unit || 'đơn vị gốc'}
                          </div>
                        </div>
                        {unit.isDefaultSaleUnit && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-bold" style={{ color: 'var(--color-primary-600)' }}>
                        {fmt(unitPricing.unitPrice)}
                      </div>
                      {unitPricing.hasWholesale && unit.wholesaleMinQty != null && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          Giá sỉ từ {unit.wholesaleMinQty} {unit.unitLabel}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600">Số lượng</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQtyChange(qty - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={typeof available === 'number' ? Math.max(1, available) : 9999}
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="input h-9 w-20 text-center text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => handleQtyChange(qty + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  +
                </button>

                <div className="ml-auto text-right">
                  <div className="text-xs text-slate-500">Tạm tính</div>
                  <div className="text-base font-extrabold text-slate-900">{fmt(subtotal)}</div>
                </div>
              </div>

              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Tồn khả dụng: <strong>{typeof available === 'number' ? `${available} ${selectedUnit?.unitLabel}` : stockMeta.label}</strong>
                {typeof baseAvailable === 'number' && selectedUnit?.conversionFactor > 1 && (
                  <span> · Kho gốc còn {baseAvailable} {med.unit || 'đơn vị gốc'}</span>
                )}
              </div>
            </div>

            {typeof available === 'number' && available > 0 && available <= 20 && (
              <div className="alert alert-warning flex items-center gap-1.5 py-2 text-xs" role="alert">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Chỉ còn <strong>{available} {selectedUnit?.unitLabel || 'đơn vị'}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={addToCart}
                disabled={available === 0}
                className="btn-primary py-2.5 text-sm"
                aria-label={available === 0 ? 'Hết hàng - không thể mua' : 'Thêm vào giỏ hàng'}
              >
                {available === 0 ? 'Hết hàng' : 'Chọn mua'}
              </button>
              <Link
                to="/shop/support-chat"
                className="btn-secondary py-2.5 text-center text-sm"
                aria-label="Liên hệ hỗ trợ nhanh"
              >
                Hỗ trợ nhanh
              </Link>
            </div>

            <p className="text-[11px] leading-4 text-slate-400">
              Giá sẽ tự chuyển sang giá sỉ khi số lượng của đúng dòng hàng đạt ngưỡng. Tồn kho luôn được trừ theo đơn vị gốc.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickInfoCard label="Đơn vị bán" value={unitListLabel || '—'} />
        <QuickInfoCard label="Nhà sản xuất" value={med.manufacturer || '—'} />
        <QuickInfoCard label="Xuất xứ" value={med.origin || '—'} />
        <QuickInfoCard
          label="Hạn dùng gần nhất"
          value={nearestExpiry ? new Date(nearestExpiry).toLocaleDateString('vi-VN') : '—'}
        />
      </section>

      <section className="card overflow-hidden">
        <Tabs
          tabs={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-4 md:p-5">
          {activeTab === 'description' && (
            <div>
              <h2 className="mb-2 text-base font-bold text-slate-900">Mô tả sản phẩm</h2>
              <div className="text-sm leading-7 text-slate-600">
                {med.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </div>
            </div>
          )}
          {activeTab === 'usage' && (
            <div>
              <h2 className="mb-2 text-base font-bold text-slate-900">Cách dùng</h2>
              <div className="text-sm leading-7 text-slate-600">
                {med.usageInstructions || 'Chưa có hướng dẫn sử dụng chi tiết.'}
              </div>
            </div>
          )}
          {activeTab === 'sideEffects' && (
            <div>
              <h2 className="mb-2 text-base font-bold text-slate-900">Tác dụng phụ / lưu ý</h2>
              <div className="text-sm leading-7 text-amber-700">
                {med.sideEffects || 'Chưa có thông tin tác dụng phụ hoặc lưu ý bổ sung.'}
              </div>
            </div>
          )}
          {activeTab === 'info' && (
            <div>
              <h2 className="mb-2 text-base font-bold text-slate-900">Thông tin thêm</h2>
              <div className="mt-2">
                <InfoRow label="Tên thuốc" value={med.name} />
                <InfoRow label="Mã thuốc" value={med.code} />
                <InfoRow label="Hoạt chất" value={med.activeIngredient || '—'} />
                <InfoRow label="Dạng bào chế" value={med.dosageForm || '—'} />
                <InfoRow label="Đơn vị gốc" value={med.unit || '—'} />
                <InfoRow label="Đơn vị bán" value={unitListLabel || '—'} />
                <InfoRow label="Quy cách" value={med.packageSize || '—'} />
                <InfoRow label="Nhà sản xuất" value={med.manufacturer || '—'} />
                <InfoRow label="Xuất xứ" value={med.origin || '—'} />
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
