import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CatalogApi } from '../../apis/catalog.api';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pill } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';

const CATALOG_BASE = SERVICE_URLS.catalog;

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const EMPTY_FORM = {
  code: '',
  name: '',
  genericName: '',
  unit: 'Viên',
  manufacturer: '',
  activeIngredient: '',
  dosageForm: '',
  packageSize: '',
  origin: '',
  categoryId: '',
  defaultSupplierId: '',
  salePrice: '',
  barcode: '',
  imageUrl: '',
  description: '',
  usageInstructions: '',
  sideEffects: '',
  status: 'ACTIVE',
};

const EMPTY_UNIT_FORM = {
  unitCode: '',
  unitLabel: '',
  conversionFactor: '1',
  retailPrice: '',
  wholesalePrice: '',
  wholesaleMinQty: '',
  isBaseUnit: false,
  isDefaultSaleUnit: false,
  isActive: true,
};

const COMMON_UNIT_OPTIONS = [
  { unitCode: 'VIEN', unitLabel: 'Viên' },
  { unitCode: 'VI', unitLabel: 'Vỉ' },
  { unitCode: 'HOP', unitLabel: 'Hộp' },
  { unitCode: 'CHAI', unitLabel: 'Chai' },
  { unitCode: 'LO', unitLabel: 'Lọ' },
  { unitCode: 'GOI', unitLabel: 'Gói' },
  { unitCode: 'ONG', unitLabel: 'Ống' },
  { unitCode: 'TUYP', unitLabel: 'Tuýp' },
  { unitCode: 'BI', unitLabel: 'Bịch' },
  { unitCode: 'THUNG', unitLabel: 'Thùng' },
];

const normalizeUnitText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '');

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function mapMedicineToForm(med) {
  return {
    code: med.code || '',
    name: med.name || '',
    genericName: med.genericName || '',
    unit: med.unit || 'Viên',
    manufacturer: med.manufacturer || '',
    activeIngredient: med.activeIngredient || '',
    dosageForm: med.dosageForm || '',
    packageSize: med.packageSize || '',
    origin: med.origin || '',
    categoryId: med.categoryId || '',
    defaultSupplierId: med.defaultSupplierId || '',
    salePrice: med.salePrice || '',
    barcode: med.barcode || '',
    imageUrl: med.imageUrl || '',
    description: med.description || '',
    usageInstructions: med.usageInstructions || '',
    sideEffects: med.sideEffects || '',
    status: med.status || 'ACTIVE',
  };
}

function GalleryManager({ medicineId, onPrimaryChange }, ref) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [draftPrimaryId, setDraftPrimaryId] = useState(null);
  const fileRef = useRef(null);

  const loadImages = useCallback(async () => {
    if (!medicineId) return;
    setLoading(true);
    try {
      const data = await CatalogApi.getMedicineImages(medicineId);
      setImages(Array.isArray(data) ? data : []);
      setDraftPrimaryId(null);
    } catch (e) {
      setErr(e?.message || 'Lỗi tải gallery');
    } finally {
      setLoading(false);
    }
  }, [medicineId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useImperativeHandle(ref, () => ({
    saveDraftPrimary: async () => {
      if (draftPrimaryId == null) return;
      await CatalogApi.setPrimaryMedicineImage(medicineId, draftPrimaryId);
      setDraftPrimaryId(null);
      await loadImages();
      onPrimaryChange?.();
    },
    resetDraft: () => setDraftPrimaryId(null),
  }));

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setErr(null);
    setMsg(null);
    try {
      await CatalogApi.uploadMedicineImages(medicineId, Array.from(files));
      setMsg(`Đã upload ${files.length} ảnh`);
      await loadImages();
      onPrimaryChange?.();
    } catch (error) {
      setErr(error?.message || 'Lỗi upload ảnh');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      await CatalogApi.deleteMedicineImage(medicineId, imageId);
      setMsg('Đã xóa ảnh');
      if (draftPrimaryId === imageId) setDraftPrimaryId(null);
      await loadImages();
      onPrimaryChange?.();
    } catch (error) {
      setErr(error?.message || 'Lỗi xóa ảnh');
    }
  };

  const handleMove = async (index, direction) => {
    const reordered = [...images];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= reordered.length) return;
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    try {
      await CatalogApi.reorderMedicineImages(medicineId, reordered.map((img) => img.id));
      await loadImages();
    } catch (error) {
      setErr(error?.message || 'Lỗi sắp xếp ảnh');
    }
  };

  const effectivePrimaryId = draftPrimaryId ?? images.find((img) => img.isPrimary)?.id;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">Gallery ảnh</div>
          <div className="text-xs text-slate-500">Upload, sắp xếp và chọn ảnh đại diện cho thuốc.</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Đang upload...' : 'Upload ảnh'}
          </Button>
        </div>
      </div>

      {msg && <div className="mb-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">{msg}</div>}
      {err && <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">⚠ {err}</div>}

      {loading ? (
        <div className="py-5 text-center text-xs text-slate-400">Đang tải ảnh...</div>
      ) : images.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400">Chưa có ảnh nào cho thuốc này.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {images.map((img, idx) => {
            const isPrimary = img.id === effectivePrimaryId;
            return (
              <div
                key={img.id}
                className={`relative overflow-hidden rounded-xl bg-white ${isPrimary ? 'ring-2 ring-blue-500' : 'border border-slate-200'
                  }`}
              >
                <img
                  src={resolveImageUrl(img.imageUrl)}
                  alt={`Ảnh ${idx + 1}`}
                  className="aspect-square w-full object-cover"
                />
                {isPrimary && (
                  <div className="absolute left-1 top-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Ảnh đại diện
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-1 bg-black/60 px-1.5 py-1">
                  <button type="button" onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="rounded bg-slate-600 px-1.5 py-0.5 text-[11px] font-semibold text-white disabled:opacity-50">▲</button>
                  <button type="button" onClick={() => handleMove(idx, 1)} disabled={idx === images.length - 1} className="rounded bg-slate-600 px-1.5 py-0.5 text-[11px] font-semibold text-white disabled:opacity-50">▼</button>
                  {!isPrimary && (
                    <button type="button" onClick={() => setDraftPrimaryId(img.id)} className="rounded bg-amber-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">Đặt đại diện</button>
                  )}
                  <button type="button" onClick={() => handleDelete(img.id)} className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">Xóa</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const GalleryManagerRef = forwardRef(GalleryManager);

function MedicineUnitsManager({ medicineId, onChanged }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingOriginalBase, setEditingOriginalBase] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_UNIT_FORM });
  const [saving, setSaving] = useState(false);
  const selectedUnitPreset = useMemo(
    () => {
      const unitCode = String(form.unitCode || '').trim().toUpperCase();
      const byCode = COMMON_UNIT_OPTIONS.find((option) => option.unitCode === unitCode);
      if (byCode) return byCode.unitCode;
      if (unitCode === 'BASE') {
        const unitLabel = normalizeUnitText(form.unitLabel);
        return COMMON_UNIT_OPTIONS.find((option) => normalizeUnitText(option.unitLabel) === unitLabel)?.unitCode || '';
      }
      return '';
    },
    [form.unitCode, form.unitLabel]
  );

  const loadUnits = useCallback(async () => {
    if (!medicineId) return;
    setLoading(true);
    try {
      const data = await CatalogApi.getMedicineUnits(medicineId, true);
      setUnits(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || 'Không tải được danh sách đơn vị bán');
    } finally {
      setLoading(false);
    }
  }, [medicineId]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const resetDraft = () => {
    setShowDraftForm(false);
    setEditingUnitId(null);
    setEditingOriginalBase(false);
    setForm({ ...EMPTY_UNIT_FORM });
    setErr(null);
  };

  const openCreate = () => {
    setShowDraftForm(true);
    setEditingUnitId(null);
    setEditingOriginalBase(false);
    setForm({ ...EMPTY_UNIT_FORM, isActive: true });
    setErr(null);
    setMsg(null);
  };

  const openEdit = (unit) => {
    setShowDraftForm(true);
    setEditingUnitId(unit.id);
    setEditingOriginalBase(!!unit.isBaseUnit);
    setForm({
      unitCode: unit.unitCode || '',
      unitLabel: unit.unitLabel || '',
      conversionFactor: String(unit.conversionFactor || 1),
      retailPrice: unit.retailPrice ?? '',
      wholesalePrice: unit.wholesalePrice ?? '',
      wholesaleMinQty: unit.wholesaleMinQty ?? '',
      isBaseUnit: !!unit.isBaseUnit,
      isDefaultSaleUnit: !!unit.isDefaultSaleUnit,
      isActive: unit.isActive !== false,
    });
    setErr(null);
    setMsg(null);
  };

  const save = async () => {
    if (!form.unitCode.trim()) return setErr('Mã đơn vị không được để trống');
    if (!form.unitLabel.trim()) return setErr('Tên đơn vị không được để trống');
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        unitCode: form.unitCode.trim().toUpperCase(),
        unitLabel: form.unitLabel.trim(),
        conversionFactor: Math.max(1, Number(form.conversionFactor) || 1),
        retailPrice: Number(form.retailPrice || 0),
        wholesalePrice: form.wholesalePrice === '' ? null : Number(form.wholesalePrice),
        wholesaleMinQty: form.wholesaleMinQty === '' ? null : Math.max(1, Number(form.wholesaleMinQty)),
        isBaseUnit: !!form.isBaseUnit,
        isDefaultSaleUnit: !!form.isDefaultSaleUnit,
        isActive: !!form.isActive,
      };

      if (editingUnitId) {
        await CatalogApi.updateMedicineUnit(medicineId, editingUnitId, payload);
        setMsg(`Đã cập nhật đơn vị ${payload.unitLabel}`);
      } else {
        await CatalogApi.createMedicineUnit(medicineId, payload);
        setMsg(`Đã thêm đơn vị ${payload.unitLabel}`);
      }

      await loadUnits();
      await onChanged?.();
      resetDraft();
    } catch (e) {
      setErr(e?.message || 'Không lưu được đơn vị');
    } finally {
      setSaving(false);
    }
  };

  const promoteToBase = async (unit) => {
    try {
      setErr(null);
      setMsg(null);
      await CatalogApi.updateMedicineUnit(medicineId, unit.id, {
        isBaseUnit: true,
        isDefaultSaleUnit: true,
        isActive: true,
      });
      setMsg(`Đã chuyển đơn vị gốc sang ${unit.unitLabel}`);
      await loadUnits();
      await onChanged?.();
      if (editingUnitId === unit.id) {
        setEditingOriginalBase(true);
        setForm((current) => ({
          ...current,
          isBaseUnit: true,
          isDefaultSaleUnit: true,
          isActive: true,
          conversionFactor: '1',
        }));
      }
    } catch (e) {
      setErr(e?.message || 'Không chuyển được đơn vị gốc');
    }
  };

  const deactivate = async (unit) => {
    if (!window.confirm(`Ngừng sử dụng đơn vị ${unit.unitLabel}?`)) return;
    try {
      await CatalogApi.deleteMedicineUnit(medicineId, unit.id);
      setMsg(`Đã ngừng sử dụng ${unit.unitLabel}`);
      await loadUnits();
      await onChanged?.();
    } catch (e) {
      setErr(e?.message || 'Không cập nhật được trạng thái đơn vị');
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">Đơn vị bán</div>
          <div className="text-xs text-slate-500">Quản lý viên, vỉ, hộp, giá lẻ, giá sỉ và ngưỡng áp giá sỉ.</div>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>+ Thêm đơn vị</Button>
      </div>

      {msg && <div className="mb-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">{msg}</div>}
      {err && <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">⚠ {err}</div>}

      {showDraftForm && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-blue-700">
            {editingUnitId ? 'Sửa đơn vị bán' : 'Đơn vị bán mới'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Chọn nhanh đơn vị thường dùng</label>
              <select
                value={selectedUnitPreset}
                onChange={(e) => {
                  const selected = COMMON_UNIT_OPTIONS.find((option) => option.unitCode === e.target.value);
                  if (!selected) {
                    return setForm((current) => ({
                      ...current,
                      unitCode: current.unitCode === 'BASE' ? '' : current.unitCode,
                    }));
                  }
                  setForm((current) => ({
                    ...current,
                    unitCode: selected.unitCode,
                    unitLabel: selected.unitLabel,
                  }));
                }}
                className="select w-full"
              >
                <option value="">-- Chọn nhanh --</option>
                {COMMON_UNIT_OPTIONS.map((option) => (
                  <option key={option.unitCode} value={option.unitCode}>
                    {option.unitLabel} ({option.unitCode})
                  </option>
                ))}
              </select>
              {String(form.unitCode || '').trim().toUpperCase() === 'BASE' && (
                <div className="mt-1 text-[11px] text-amber-700">
                  `BASE` là mã tạm từ migration. Hãy chọn đơn vị thật như `VIEN`, `VI`, `HOP` để chuẩn hóa dữ liệu.
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Mã đơn vị *</label>
              <input
                value={form.unitCode}
                onChange={(e) => setForm((current) => ({ ...current, unitCode: e.target.value.toUpperCase() }))}
                className="input w-full"
                placeholder="Ví dụ: VIEN, VI, HOP"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tên đơn vị *</label>
              <input
                value={form.unitLabel}
                onChange={(e) => setForm((current) => ({ ...current, unitLabel: e.target.value }))}
                className="input w-full"
                placeholder="Ví dụ: Viên, Vỉ, Hộp"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Hệ số quy đổi *</label>
              <input
                type="number"
                min="1"
                value={form.conversionFactor}
                onChange={(e) => setForm((current) => ({ ...current, conversionFactor: e.target.value }))}
                className="input w-full"
                disabled={form.isBaseUnit}
              />
              <div className="mt-1 text-[11px] text-slate-500">
                {form.isBaseUnit
                  ? 'Đơn vị gốc luôn có hệ số quy đổi bằng 1.'
                  : 'Ví dụ: 1 vỉ = 10 viên, 1 hộp = 100 viên.'}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Giá bán lẻ *</label>
              <input type="number" min="0" value={form.retailPrice} onChange={(e) => setForm((current) => ({ ...current, retailPrice: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Giá bán sỉ</label>
              <input type="number" min="0" value={form.wholesalePrice} onChange={(e) => setForm((current) => ({ ...current, wholesalePrice: e.target.value }))} className="input w-full" placeholder="Để trống nếu không có" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Số lượng tối thiểu áp giá sỉ</label>
              <input type="number" min="1" value={form.wholesaleMinQty} onChange={(e) => setForm((current) => ({ ...current, wholesaleMinQty: e.target.value }))} className="input w-full" placeholder="Ví dụ: 10" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isBaseUnit}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    isBaseUnit: e.target.checked,
                    isDefaultSaleUnit: e.target.checked ? true : current.isDefaultSaleUnit,
                    conversionFactor: e.target.checked ? '1' : current.conversionFactor || '1',
                  }))
                }
                disabled={editingOriginalBase && form.isBaseUnit}
              />
              Đơn vị gốc
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefaultSaleUnit}
                onChange={(e) => setForm((current) => ({ ...current, isDefaultSaleUnit: e.target.checked }))}
                disabled={form.isBaseUnit}
              />
              Đơn vị bán mặc định
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
              Đang hoạt động
            </label>
          </div>

          {editingOriginalBase && form.isBaseUnit && (
            <div className="mt-2 text-[11px] text-amber-700">
              Không thể bỏ trực tiếp cờ đơn vị gốc ở dòng này. Muốn chuyển đơn vị gốc, hãy dùng nút "Đặt làm gốc" ở đơn vị khác.
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={resetDraft}>Hủy</Button>
            <Button size="sm" onClick={save} loading={saving}>{saving ? 'Đang lưu...' : 'Lưu đơn vị'}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-5 text-center text-xs text-slate-400">Đang tải đơn vị...</div>
      ) : units.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
          Chưa có đơn vị nào. Hệ thống sẽ luôn có ít nhất một base unit sau khi lưu thuốc.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">Đơn vị</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Quy đổi</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Giá lẻ</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Giá sỉ</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Ngưỡng</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500">Trạng thái</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-900">{unit.unitLabel}</div>
                    <div className="text-xs text-slate-400">{unit.unitCode}</div>
                  </td>
                  <td className="px-3 py-2 text-right">{unit.conversionFactor || 1}</td>
                  <td className="px-3 py-2 text-right font-semibold text-blue-600">{fmt(unit.retailPrice)}</td>
                  <td className="px-3 py-2 text-right">{unit.wholesalePrice != null ? fmt(unit.wholesalePrice) : '—'}</td>
                  <td className="px-3 py-2 text-right">{unit.wholesaleMinQty ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {unit.isBaseUnit && <Badge variant="info">Gốc</Badge>}
                      {unit.isDefaultSaleUnit && <Badge variant="success">Mặc định</Badge>}
                      <Badge variant={unit.isActive ? 'success' : 'danger'}>{unit.isActive ? 'Đang dùng' : 'Ngừng dùng'}</Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {!unit.isBaseUnit && unit.isActive && (
                        <button
                          type="button"
                          onClick={() => promoteToBase(unit)}
                          className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Đặt làm gốc
                        </button>
                      )}
                      <button type="button" onClick={() => openEdit(unit)} className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-amber-600">Sửa</button>
                      {!unit.isBaseUnit && unit.isActive && (
                        <button type="button" onClick={() => deactivate(unit)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100">Ngừng dùng</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PharmaMedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const galleryRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      CatalogApi.getMedicines().catch(() => []),
      CatalogApi.getCategories().catch(() => []),
    ])
      .then(([medList, categoryList]) => {
        setMedicines(Array.isArray(medList) ? medList : []);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      })
      .catch((e) => setErr(e?.message || 'Lỗi tải dữ liệu thuốc'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshEditingMedicine = useCallback(async (medicineId) => {
    const fresh = await CatalogApi.getMedicine(medicineId);
    setEditing(fresh);
    setForm(mapMedicineToForm(fresh));
    setMedicines((current) => current.map((item) => (item.id === fresh.id ? fresh : item)));
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return medicines;
    return medicines.filter((medicine) =>
      (medicine.name || '').toLowerCase().includes(query)
      || (medicine.code || '').toLowerCase().includes(query)
      || (medicine.activeIngredient || '').toLowerCase().includes(query)
    );
  }, [medicines, search]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setShowForm(true);
    setMsg(null);
    setErr(null);
  };

  const openEdit = (medicine) => {
    setForm(mapMedicineToForm(medicine));
    setEditing(medicine);
    setShowForm(true);
    setMsg(null);
    setErr(null);
  };

  const closeModal = () => {
    galleryRef.current?.resetDraft?.();
    setShowForm(false);
    setEditing(null);
    setErr(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return setErr('Tên thuốc không được trống');
    if (!form.code.trim()) return setErr('Mã thuốc không được trống');

    setSubmitting(true);
    setErr(null);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        defaultSupplierId: form.defaultSupplierId ? Number(form.defaultSupplierId) : null,
        salePrice: form.salePrice ? Number(form.salePrice) : 0,
      };

      if (editing) {
        await CatalogApi.updateMedicine(editing.id, payload);
        await galleryRef.current?.saveDraftPrimary?.();
        await refreshEditingMedicine(editing.id);
        setMsg(`Đã cập nhật thuốc "${form.name}"`);
      } else {
        await CatalogApi.createMedicine(payload);
        setMsg(`Đã tạo thuốc "${form.name}"`);
      }

      closeModal();
      load();
    } catch (error) {
      setErr(error?.message || 'Lỗi khi lưu thuốc');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'imageUrl',
      label: 'Ảnh',
      className: 'w-14',
      render: (medicine) => {
        const src = resolveImageUrl(medicine.imageUrl);
        return (
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
            {src ? <img src={src} alt={medicine.name} className="h-full w-full object-cover" /> : <Pill className="h-5 w-5 text-slate-400" />}
          </div>
        );
      },
    },
    { key: 'code', label: 'Mã', className: 'font-mono text-slate-500' },
    { key: 'name', label: 'Tên thuốc', className: 'font-semibold' },
    { key: 'activeIngredient', label: 'Hoạt chất', className: 'text-slate-500', render: (medicine) => medicine.activeIngredient || '—' },
    { key: 'dosageForm', label: 'Dạng', className: 'text-slate-500', render: (medicine) => medicine.dosageForm || '—' },
    { key: 'unit', label: 'ĐVT gốc', render: (medicine) => medicine.unit || '—' },
    { key: 'salePrice', label: 'Giá base', className: 'font-semibold text-blue-600', render: (medicine) => fmt(medicine.salePrice) },
    {
      key: 'units',
      label: 'Đơn vị bán',
      render: (medicine) => Array.isArray(medicine.units) && medicine.units.length > 0 ? medicine.units.length : 1,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (medicine) => (
        <Badge variant={medicine.status === 'ACTIVE' ? 'success' : 'danger'}>
          {medicine.status === 'ACTIVE' ? 'Đang bán' : medicine.status}
        </Badge>
      ),
    },
    {
      key: '_actions',
      label: '',
      render: (medicine) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEdit(medicine);
          }}
          className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          Sửa
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý thuốc"
        subtitle={`${medicines.length} sản phẩm`}
        actions={<Button onClick={openCreate}>+ Thêm thuốc</Button>}
      />

      {msg && <Alert variant="success" onDismiss={() => setMsg(null)}>{msg}</Alert>}
      {err && !showForm && <Alert variant="error" onDismiss={() => setErr(null)}>{err}</Alert>}

      <SearchInput
        placeholder="Tìm theo tên, mã hoặc hoạt chất..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Modal
        open={showForm}
        title={editing ? `Sửa thuốc — ${editing.name}` : 'Thêm thuốc mới'}
        onClose={closeModal}
        size="lg"
        footer={(
          <>
            <Button variant="ghost" onClick={closeModal}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </>
        )}
      >
        {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">⚠ {err}</div>}

        {editing ? (
          <>
            <GalleryManagerRef
              ref={galleryRef}
              medicineId={editing.id}
              onPrimaryChange={() => refreshEditingMedicine(editing.id)}
            />
            <MedicineUnitsManager
              medicineId={editing.id}
              onChanged={() => refreshEditingMedicine(editing.id)}
            />
          </>
        ) : (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Lưu thuốc trước để upload gallery và thêm nhiều đơn vị bán như vỉ, hộp, chai.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Mã thuốc *</label>
            <input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} className="input w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Tên thuốc *</label>
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="input w-full" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Tên generic</label>
            <input value={form.genericName} onChange={(e) => setForm((current) => ({ ...current, genericName: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Hoạt chất</label>
            <input value={form.activeIngredient} onChange={(e) => setForm((current) => ({ ...current, activeIngredient: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Dạng bào chế</label>
            <input value={form.dosageForm} onChange={(e) => setForm((current) => ({ ...current, dosageForm: e.target.value }))} className="input w-full" placeholder="Viên nén, siro..." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Đơn vị gốc</label>
            <input value={form.unit} onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value }))} className="input w-full" placeholder="Viên, ml..." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Quy cách</label>
            <input value={form.packageSize} onChange={(e) => setForm((current) => ({ ...current, packageSize: e.target.value }))} className="input w-full" placeholder="Hộp 30 viên" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Nhà sản xuất</label>
            <input value={form.manufacturer} onChange={(e) => setForm((current) => ({ ...current, manufacturer: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Xuất xứ</label>
            <input value={form.origin} onChange={(e) => setForm((current) => ({ ...current, origin: e.target.value }))} className="input w-full" placeholder="Việt Nam..." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Giá base</label>
            <input type="number" min="0" value={form.salePrice} onChange={(e) => setForm((current) => ({ ...current, salePrice: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Mã vạch</label>
            <input value={form.barcode} onChange={(e) => setForm((current) => ({ ...current, barcode: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Danh mục</label>
            <select value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))} className="select w-full">
              <option value="">-- Chọn danh mục --</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} className="select w-full">
              <option value="ACTIVE">Đang bán</option>
              <option value="INACTIVE">Ngừng bán</option>
              <option value="DISCONTINUED">Ngừng sản xuất</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-500">Mô tả</label>
          <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows={2} className="input w-full resize-y" />
        </div>
        <div className="mt-2">
          <label className="mb-1 block text-xs text-slate-500">Hướng dẫn sử dụng</label>
          <textarea value={form.usageInstructions} onChange={(e) => setForm((current) => ({ ...current, usageInstructions: e.target.value }))} rows={2} className="input w-full resize-y" />
        </div>
        <div className="mt-2">
          <label className="mb-1 block text-xs text-slate-500">Tác dụng phụ</label>
          <textarea value={form.sideEffects} onChange={(e) => setForm((current) => ({ ...current, sideEffects: e.target.value }))} rows={2} className="input w-full resize-y" />
        </div>
      </Modal>

      <DataTable columns={columns} rows={filtered} loading={loading} emptyText="Không tìm thấy thuốc nào" />
    </div>
  );
}
