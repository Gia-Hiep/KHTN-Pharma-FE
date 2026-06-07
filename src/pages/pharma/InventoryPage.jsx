import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryApi, CatalogApi } from '../../apis';
import { SERVICE_URLS } from '../../apis/serviceUrls';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const CATALOG_BASE = SERVICE_URLS.catalog;

const TAB_META = {
  summary: {
    label: 'Tổng hợp',
    description: 'Theo dõi tồn kho theo từng thuốc và lượng khả dụng thực tế.',
  },
  lots: {
    label: 'Lô hàng',
    description: 'Kiểm tra từng lô, hạn dùng và xử lý trực tiếp trên kho.',
  },
  alerts: {
    label: 'Cảnh báo',
    description: 'Tập trung các thuốc tồn thấp và các lô gần hết hạn.',
  },
  history: {
    label: 'Lịch sử',
    description: 'Xem lại các giao dịch nhập, xuất và điều chỉnh kho.',
  },
};

const ACTION_META = {
  adjust: {
    title: 'Điều chỉnh tồn kho',
    submitLabel: 'Lưu điều chỉnh',
  },
  damaged: {
    title: 'Đánh dấu hư hỏng',
    submitLabel: 'Xác nhận hư hỏng',
  },
  expired: {
    title: 'Đánh dấu hết hạn',
    submitLabel: 'Xác nhận hết hạn',
  },
};

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${CATALOG_BASE}${imageUrl}`;
}

function toNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInteger(value) {
  return toNumber(value).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN');
}

function isExpired(value) {
  return !!value && new Date(value) < new Date();
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function getLotAvailable(row) {
  if (row?.available != null) return toNumber(row.available);
  return toNumber(row?.qtyOnHand) - toNumber(row?.qtyReserved);
}

function MedThumbnail({ imageUrl, name, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const src = resolveImageUrl(imageUrl);
  const fallback = String(name || 'M').trim().charAt(0).toUpperCase() || 'M';

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200"
      style={{ width: size, height: size }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

function Notice({ tone = 'info', message, onClose }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${styles[tone] || styles.info}`}>
      <div>{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 text-current/60 transition hover:bg-white/40 hover:text-current"
      >
        x
      </button>
    </div>
  );
}

function MetricCard({ label, value, hint, tone = 'slate' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-white text-slate-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  }[tone] || 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-current/60">{label}</div>
      <div className="mt-3 text-2xl font-black leading-none">{value}</div>
      {hint && <div className="mt-2 text-xs text-current/70">{hint}</div>}
    </div>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function InventoryPage() {
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState([]);
  const [lots, setLots] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [expBefore, setExpBefore] = useState('');

  const [action, setAction] = useState(null);
  const [actionForm, setActionForm] = useState({ lotId: '', medicineId: '', qty: 0, reason: '' });

  useEffect(() => {
    CatalogApi.getMedicines()
      .then((data) => setMedicines(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const medImageMap = useMemo(() => {
    const map = {};
    medicines.forEach((medicine) => {
      if (medicine.id) map[medicine.id] = medicine.imageUrl || null;
    });
    return map;
  }, [medicines]);

  const refreshCurrentTab = useCallback(async () => {
    setLoading(true);
    try {
      switch (tab) {
        case 'summary': {
          const data = await InventoryApi.getSummary();
          setSummary(Array.isArray(data) ? data : []);
          break;
        }
        case 'lots': {
          const data = await InventoryApi.getLots();
          setLots(Array.isArray(data) ? data : []);
          break;
        }
        case 'alerts': {
          const [low, expiry] = await Promise.all([
            InventoryApi.getLowStockAlerts().catch(() => []),
            InventoryApi.getExpiryAlerts(expBefore || undefined).catch(() => []),
          ]);
          setLowStock(Array.isArray(low) ? low : []);
          setExpiring(Array.isArray(expiry) ? expiry : []);
          break;
        }
        case 'history': {
          const data = await InventoryApi.getTransactions();
          setTransactions(Array.isArray(data) ? data : []);
          break;
        }
        default:
          break;
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Không tải được dữ liệu kho'));
    } finally {
      setLoading(false);
    }
  }, [expBefore, tab]);

  useEffect(() => {
    refreshCurrentTab();
  }, [refreshCurrentTab]);

  const handleSyncNames = async () => {
    try {
      const response = await InventoryApi.backfillNames();
      setMsg(`Đã cập nhật ${response.updated}/${response.total} tên thuốc.`);
      await refreshCurrentTab();
    } catch (syncError) {
      setError(`Không đồng bộ được tên thuốc: ${getErrorMessage(syncError, 'Lỗi không xác định')}`);
    }
  };

  const executeAction = async () => {
    if (!action) return;

    try {
      if (action === 'adjust') {
        await InventoryApi.adjust({
          medicineId: Number(actionForm.medicineId),
          quantity: Number(actionForm.qty),
          reason: actionForm.reason || 'Điều chỉnh thủ công',
        });
        setMsg('Đã điều chỉnh tồn kho.');
      } else if (action === 'damaged') {
        await InventoryApi.markDamaged({
          lotId: Number(actionForm.lotId),
          qty: Number(actionForm.qty) || 1,
          reason: actionForm.reason || 'Hư hỏng',
        });
        setMsg('Đã đánh dấu hàng hư hỏng.');
      } else if (action === 'expired') {
        await InventoryApi.markExpired({
          lotId: Number(actionForm.lotId),
          qty: Number(actionForm.qty) || 1,
          reason: actionForm.reason || 'Hết hạn',
        });
        setMsg('Đã đánh dấu hàng hết hạn.');
      }

      setAction(null);
      setActionForm({ lotId: '', medicineId: '', qty: 0, reason: '' });
      await refreshCurrentTab();
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'Không thực hiện được thao tác kho'));
    }
  };

  const openAdjustModal = () => {
    setAction('adjust');
    setActionForm({ lotId: '', medicineId: '', qty: 0, reason: '' });
  };

  const openLotAction = (type, lot) => {
    setAction(type);
    setActionForm({
      lotId: lot.id,
      medicineId: lot.medicineId,
      qty: type === 'expired' ? lot.qtyOnHand || 1 : 1,
      reason: '',
    });
  };

  const tabs = useMemo(
    () => [
      { key: 'summary', label: TAB_META.summary.label },
      { key: 'lots', label: TAB_META.lots.label },
      { key: 'alerts', label: TAB_META.alerts.label },
      { key: 'history', label: TAB_META.history.label },
    ],
    []
  );

  const summaryMetrics = useMemo(() => {
    const totalSku = summary.length;
    const totalOnHand = summary.reduce((sum, item) => sum + toNumber(item.totalQty), 0);
    const totalReserved = summary.reduce((sum, item) => sum + toNumber(item.reservedQty), 0);
    const totalAvailable = summary.reduce((sum, item) => sum + toNumber(item.availableQty), 0);

    return [
      { label: 'Mặt hàng', value: formatInteger(totalSku), hint: 'SKU đang được theo dõi', tone: 'slate' },
      { label: 'Tổng tồn', value: formatInteger(totalOnHand), hint: 'Số lượng đang có trong kho', tone: 'blue' },
      { label: 'Đã giữ chỗ', value: formatInteger(totalReserved), hint: 'Đang reserve cho đơn hàng', tone: 'amber' },
      { label: 'Khả dụng', value: formatInteger(totalAvailable), hint: 'Có thể xuất bán ngay', tone: 'emerald' },
    ];
  }, [summary]);

  const lotMetrics = useMemo(() => {
    const totalLots = lots.length;
    const totalOnHand = lots.reduce((sum, lot) => sum + toNumber(lot.qtyOnHand), 0);
    const expiredLots = lots.filter((lot) => isExpired(lot.expiryDate)).length;

    return [
      { label: 'Số lô', value: formatInteger(totalLots), hint: 'Tổng lô đang có trong kho', tone: 'slate' },
      { label: 'Tồn theo lô', value: formatInteger(totalOnHand), hint: 'Tổng số lượng của các lô', tone: 'blue' },
      { label: 'Lô hết hạn', value: formatInteger(expiredLots), hint: 'Cần xử lý hoặc loại bỏ', tone: 'rose' },
    ];
  }, [lots]);

  const alertMetrics = useMemo(() => {
    return [
      { label: 'Tồn thấp', value: formatInteger(lowStock.length), hint: 'Thuốc dưới ngưỡng cảnh báo', tone: 'amber' },
      { label: 'Sắp hết hạn', value: formatInteger(expiring.length), hint: 'Lô gần tới hạn dùng', tone: 'rose' },
      { label: 'Mốc lọc', value: expBefore || 'Tất cả', hint: 'Ngày lọc hạn dùng', tone: 'slate' },
    ];
  }, [expBefore, expiring.length, lowStock.length]);

  const historyMetrics = useMemo(() => {
    const inbound = transactions.filter((txn) => ['IN', 'INBOUND'].includes(txn.type)).length;
    const outbound = transactions.filter((txn) => ['OUT', 'OUTBOUND'].includes(txn.type)).length;

    return [
      { label: 'Giao dịch', value: formatInteger(transactions.length), hint: 'Tổng bản ghi biến động kho', tone: 'slate' },
      { label: 'Nhập kho', value: formatInteger(inbound), hint: 'Các lần cộng tồn', tone: 'emerald' },
      { label: 'Xuất kho', value: formatInteger(outbound), hint: 'Các lần trừ tồn', tone: 'amber' },
    ];
  }, [transactions]);

  const activeMetrics = useMemo(() => {
    switch (tab) {
      case 'lots':
        return lotMetrics;
      case 'alerts':
        return alertMetrics;
      case 'history':
        return historyMetrics;
      case 'summary':
      default:
        return summaryMetrics;
    }
  }, [alertMetrics, historyMetrics, lotMetrics, summaryMetrics, tab]);

  const currentTabMeta = TAB_META[tab];

  const summaryColumns = [
    {
      key: 'medicineName',
      label: 'Thuốc',
      render: (row) => (
        <div className="flex items-center gap-3">
          <MedThumbnail imageUrl={medImageMap[row.medicineId]} name={row.medicineName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.medicineName || `#${row.medicineId}`}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalQty',
      label: 'Tổng tồn',
      className: 'text-right font-semibold tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'reservedQty',
      label: 'Đã giữ chỗ',
      className: 'text-right text-amber-600 tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'availableQty',
      label: 'Khả dụng',
      className: 'text-right font-bold tabular-nums',
      headerClassName: 'text-right',
      render: (row) => (
        <span className={`block text-right ${toNumber(row.availableQty) <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
          {formatInteger(row.availableQty)}
        </span>
      ),
    },
  ];

  const lotColumns = [
    {
      key: 'lotNumber',
      label: 'Lô',
      className: 'font-mono font-semibold',
      render: (row) => row.lotNumber || row.id,
    },
    {
      key: 'medicineName',
      label: 'Thuốc',
      render: (row) => (
        <div className="flex items-center gap-3">
          <MedThumbnail imageUrl={medImageMap[row.medicineId]} name={row.medicineName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.medicineName || `#${row.medicineId}`}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'qtyOnHand',
      label: 'Tồn',
      className: 'text-right font-semibold tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'qtyReserved',
      label: 'Giữ chỗ',
      className: 'text-right text-amber-600 tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'available',
      label: 'Khả dụng',
      className: 'text-right font-bold tabular-nums',
      headerClassName: 'text-right',
      render: (row) => {
        const value = getLotAvailable(row);
        return <span className={`block text-right ${value <= 0 ? 'text-red-600' : 'text-blue-600'}`}>{formatInteger(value)}</span>;
      },
    },
    {
      key: 'expiryDate',
      label: 'Hạn dùng',
      render: (row) => (
        <span className={isExpired(row.expiryDate) ? 'font-semibold text-red-600' : 'text-slate-500'}>
          {formatDate(row.expiryDate)}
        </span>
      ),
    },
    {
      key: '_actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            title="Đánh dấu hư hỏng"
            onClick={(event) => {
              event.stopPropagation();
              openLotAction('damaged', row);
            }}
            className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Hư hỏng
          </button>
          <button
            type="button"
            title="Đánh dấu hết hạn"
            onClick={(event) => {
              event.stopPropagation();
              openLotAction('expired', row);
            }}
            className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Hết hạn
          </button>
        </div>
      ),
    },
  ];

  const lowStockColumns = [
    {
      key: 'medicineName',
      label: 'Thuốc',
      render: (row) => (
        <div className="flex items-center gap-3">
          <MedThumbnail imageUrl={medImageMap[row.medicineId]} name={row.medicineName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.medicineName || `#${row.medicineId}`}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'currentQty',
      label: 'Tồn hiện tại',
      className: 'text-right font-bold text-red-600 tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'threshold',
      label: 'Ngưỡng',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
    },
  ];

  const expiryColumns = [
    {
      key: 'medicineName',
      label: 'Thuốc',
      render: (row) => (
        <div className="flex items-center gap-3">
          <MedThumbnail imageUrl={medImageMap[row.medicineId]} name={row.medicineName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.medicineName || `#${row.medicineId}`}</div>
          </div>
        </div>
      ),
    },
    { key: 'lotNumber', label: 'Lô', className: 'font-mono' },
    {
      key: 'qty',
      label: 'Số lượng',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      render: (row) => formatInteger(row.qty ?? row.quantity),
    },
    {
      key: 'expiryDate',
      label: 'Hạn dùng',
      className: 'font-semibold text-red-600',
      render: (row) => formatDate(row.expiryDate),
    },
  ];

  const transactionColumns = [
    {
      key: 'createdAt',
      label: 'Thời gian',
      className: 'whitespace-nowrap text-xs text-slate-500',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'type',
      label: 'Loại',
      render: (row) => {
        const variant = ['IN', 'INBOUND'].includes(row.type)
          ? 'success'
          : ['OUT', 'OUTBOUND'].includes(row.type)
            ? 'danger'
            : 'gray';
        return <Badge variant={variant}>{row.type}</Badge>;
      },
    },
    {
      key: 'medicineName',
      label: 'Thuốc',
      render: (row) => (
        <div className="flex items-center gap-3">
          <MedThumbnail imageUrl={medImageMap[row.medicineId]} name={row.medicineName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{row.medicineName || `#${row.medicineId}`}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'qty',
      label: 'Số lượng',
      className: 'text-right font-semibold tabular-nums',
      headerClassName: 'text-right',
    },
    {
      key: 'refType',
      label: 'Tham chiếu',
      className: 'font-mono text-xs',
      render: (row) => (row.refType ? `${row.refType}#${row.refId}` : '-'),
    },
    {
      key: 'note',
      label: 'Ghi chú',
      className: 'max-w-[220px] text-slate-500',
      render: (row) => row.note || '-',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho"
        subtitle="Theo dõi tồn kho, lô hàng, cảnh báo và lịch sử biến động."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshCurrentTab}>
              Làm mới
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSyncNames}>
              Đồng bộ tên
            </Button>
            <Button size="sm" onClick={openAdjustModal}>
              Điều chỉnh kho
            </Button>
          </div>
        }
      />

      {msg && <Notice tone="info" message={msg} onClose={() => setMsg(null)} />}
      {error && <Notice tone="danger" message={error} onClose={() => setError(null)} />}

      <Panel
        title={currentTabMeta.label}
        subtitle={currentTabMeta.description}
        actions={
          tab === 'alerts' ? (
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Mốc hạn dùng</label>
                <input
                  type="date"
                  value={expBefore}
                  onChange={(event) => setExpBefore(event.target.value)}
                  className="input w-full min-w-[160px] py-2 text-sm"
                />
              </div>
              <Button size="sm" variant="ghost" onClick={refreshCurrentTab}>
                Lọc
              </Button>
            </div>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <TabButton key={item.key} active={tab === item.key} label={item.label} onClick={() => setTab(item.key)} />
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
              tone={metric.tone}
            />
          ))}
        </div>
      </Panel>

      {tab === 'summary' && (
        <Panel title="Tồn kho theo thuốc">
          <DataTable
            columns={summaryColumns}
            rows={summary}
            loading={loading}
            emptyText="Chưa có dữ liệu tổng hợp tồn kho"
            emptySubtext="Khi có giao dịch nhập kho hoặc điều chỉnh, danh sách sẽ hiển thị tại đây."
          />
        </Panel>
      )}

      {tab === 'lots' && (
        <Panel title="Danh sách lô hàng">
          <DataTable
            columns={lotColumns}
            rows={lots}
            loading={loading}
            emptyText="Chưa có lô hàng trong kho"
            emptySubtext="Các lô sẽ xuất hiện sau khi nhận hàng từ phiếu nhập hoặc điều chỉnh."
          />
        </Panel>
      )}

      {tab === 'alerts' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title={`Tồn kho thấp (${formatInteger(lowStock.length)})`}>
            <DataTable
              columns={lowStockColumns}
              rows={lowStock}
              loading={loading}
              emptyText="Không có cảnh báo tồn kho thấp"
              emptySubtext="Mức tồn hiện tại vẫn đang an toàn."
            />
          </Panel>

          <Panel title={`Sắp hết hạn (${formatInteger(expiring.length)})`}>
            <DataTable
              columns={expiryColumns}
              rows={expiring}
              loading={loading}
              emptyText="Không có lô sắp hết hạn"
              emptySubtext="Các lô hiện tại chưa rơi vào mốc cảnh báo đã chọn."
            />
          </Panel>
        </div>
      )}

      {tab === 'history' && (
        <Panel title="Lịch sử biến động kho">
          <DataTable
            columns={transactionColumns}
            rows={transactions}
            loading={loading}
            emptyText="Chưa có giao dịch kho"
            emptySubtext="Khi có nhập, xuất hoặc điều chỉnh, lịch sử sẽ được cập nhật tại đây."
          />
        </Panel>
      )}

      <Modal
        open={!!action}
        title={ACTION_META[action]?.title || 'Thao tác kho'}
        onClose={() => setAction(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>
              Hủy
            </Button>
            <Button onClick={executeAction}>{ACTION_META[action]?.submitLabel || 'Xác nhận'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {action === 'adjust' ? (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Chọn thuốc *</label>
              <select
                value={actionForm.medicineId}
                onChange={(event) => setActionForm((current) => ({ ...current, medicineId: event.target.value }))}
                className="select w-full"
              >
                <option value="">-- Chọn thuốc --</option>
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} (ID: {medicine.id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Lô: <strong>{actionForm.lotId}</strong>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số lượng</label>
              <input
                type="number"
                value={actionForm.qty}
                onChange={(event) => setActionForm((current) => ({ ...current, qty: event.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Lý do</label>
              <input
                value={actionForm.reason}
                onChange={(event) => setActionForm((current) => ({ ...current, reason: event.target.value }))}
                className="input w-full"
                placeholder="Nhập lý do xử lý..."
              />
            </div>
          </div>

          {(action === 'damaged' || action === 'expired') && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Thao tác này tác động trực tiếp tới tồn kho của lô đang chọn. Hãy kiểm tra số lượng trước khi xác nhận.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
