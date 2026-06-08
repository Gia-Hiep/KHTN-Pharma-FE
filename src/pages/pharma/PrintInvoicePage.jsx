// Trang in phiếu soạn/đóng gói — standalone (không dùng AdminLayout)
// Truy cập: /print/invoices/:id
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SalesApi } from '../../apis';

function fmt(n) {
  return Number(n || 0).toLocaleString('vi-VN') + '₫';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

export function PrintInvoicePage() {
  const { id } = useParams();
  const [invoice,  setInvoice]  = useState(null);
  const [items,    setItems]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [inv, its, pays] = await Promise.all([
          SalesApi.getInvoice(id),
          SalesApi.getInvoiceItems(id),
          SalesApi.getInvoicePayments(id),
        ]);
        setInvoice(inv);
        setItems(Array.isArray(its) ? its : []);
        setPayments(Array.isArray(pays) ? pays : []);
      } catch (e) {
        setError(e?.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Tự động in khi dữ liệu đã load xong
  useEffect(() => {
    if (!loading && !error && invoice) {
      // Delay nhỏ để browser render xong
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [loading, error, invoice]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      Đang tải dữ liệu...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>
      Lỗi: {error}
    </div>
  );

  const total = items.reduce((s, i) => s + (i.lineTotal || 0), 0);
  const paid  = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <>
      {/* ──────── Print CSS ──────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
        .print-wrap { width: 210mm; margin: 0 auto; padding: 16mm 12mm; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 20px; letter-spacing: 2px; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #555; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 14px; font-size: 11px; }
        .meta span { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #888; padding: 5px 7px; text-align: left; font-size: 11px; }
        th { background: #f0f0f0; font-weight: bold; }
        td.right, th.right { text-align: right; }
        .totals { float: right; width: 220px; font-size: 12px; }
        .totals table { margin: 0; }
        .totals td { border: none; padding: 3px 5px; }
        .totals td.right { font-weight: bold; }
        .total-row td { border-top: 2px solid #000 !important; font-weight: bold; font-size: 13px; }
        .section-title { font-weight: bold; font-size: 12px; margin: 10px 0 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px;}
        .badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 12px; }
        .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 8px; text-align: center; font-size: 11px; }
        .sig-box { border-top: 1px solid #000; padding-top: 6px; margin-top: 60px; }
        .clearfix::after { content: ''; display: table; clear: both; }
        @media print {
          @page { margin: 0; }
          body { margin: 10mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ──────── Nút in (ẩn khi in) ──────── */}
      <div className="no-print" style={{
        position: 'fixed', top: 12, right: 16, zIndex: 999,
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={() => window.print()}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
          }}
        >
          🖨️ In phiếu
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: '#e5e7eb', color: '#374151', border: 'none',
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
          }}
        >
          ✕ Đóng
        </button>
      </div>

      {/* ──────── Nội dung phiếu ──────── */}
      <div className="print-wrap">

        {/* Header */}
        <div className="header">
          <h1>💊 PHIẾU SOẠN THUỐC / ĐÓNG GÓI</h1>
          <p>Nhà thuốc Pharmacy SOA — Tel: 1900-xxxx — pharmacy@example.com</p>
        </div>

        {/* Meta info */}
        <div className="meta">
          <div>Số HĐ: <span>#{invoice.id}</span></div>
          <div>Ngày tạo: <span>{fmtDate(invoice.createdAt)}</span></div>
          <div>Khách hàng: <span>#{invoice.customerId || '—'}</span></div>
          <div>Nhân viên: <span>#{invoice.staffId || '—'}</span></div>
          <div>Trạng thái: <span>{invoice.status}</span></div>
          {invoice.note && <div style={{ gridColumn: 'span 2' }}>Ghi chú: <span>{invoice.note}</span></div>}
        </div>

        {/* Items table */}
        <div className="section-title">📦 DANH SÁCH THUỐC / SẢN PHẨM</div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>Tên thuốc</th>
              <th>Medicine ID</th>
              <th className="right" style={{ width: 60 }}>SL</th>
              <th className="right" style={{ width: 90 }}>Đơn giá</th>
              <th className="right" style={{ width: 100 }}>Thành tiền</th>
              <th style={{ width: 80, textAlign: 'center' }}>✓ Đã soạn</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id ?? idx}>
                <td>{idx + 1}</td>
                <td>{item.medicineName || '—'}</td>
                <td>{item.medicineId}</td>
                <td className="right">{item.qty}</td>
                <td className="right">{fmt(item.unitPrice)}</td>
                <td className="right">{fmt(item.lineTotal)}</td>
                <td style={{ textAlign: 'center' }}>☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="clearfix">
          <div className="totals">
            <table>
              <tbody>
                <tr>
                  <td>Tổng cộng:</td>
                  <td className="right">{fmt(total)}</td>
                </tr>
                {invoice.discountAmount > 0 && (
                  <tr>
                    <td>Giảm giá:</td>
                    <td className="right">- {fmt(invoice.discountAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td>Đã thanh toán:</td>
                  <td className="right">{fmt(paid)}</td>
                </tr>
                <tr className="total-row">
                  <td>Còn lại:</td>
                  <td className="right">{fmt(Math.max(0, total - (invoice.discountAmount || 0) - paid))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>💳 THANH TOÁN</div>
            <table>
              <thead>
                <tr>
                  <th>Phương thức</th>
                  <th className="right">Số tiền</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id ?? i}>
                    <td>{p.method}</td>
                    <td className="right">{fmt(p.amount)}</td>
                    <td>{fmtDate(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer / Signatures */}
        <div className="footer">
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
            In ngày: {new Date().toLocaleString('vi-VN')} — Phiếu này có giá trị soạn hàng nội bộ.
          </div>
          <div className="sigs">
            <div>
              <div className="sig-box">Người soạn hàng<br />(Ký, ghi rõ họ tên)</div>
            </div>
            <div>
              <div className="sig-box">Người kiểm tra<br />(Ký, ghi rõ họ tên)</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
