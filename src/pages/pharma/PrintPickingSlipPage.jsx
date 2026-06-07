// File: src/pages/pharma/PrintPickingSlipPage.jsx
/**
 * Phiếu soạn hàng cho đơn online BUYER.
 * Trang này dùng riêng cho buyer order, KHÔNG dùng cho invoice POS nội bộ.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrderApi } from '../../apis/order.api';

const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export function PrintPickingSlipPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OrderApi.pharmacistOrderDetail(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!order) return <div style={{ padding: 40, color: '#dc2626' }}>Không tìm thấy đơn</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      {/* No-print controls */}
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Link to={`/pharma/orders/${id}`} style={{ color: '#2563eb', fontSize: 13 }}>← Quay lại đơn</Link>
        <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
          🖨 In phiếu
        </button>
      </div>

      {/* Print content */}
      <div style={{ border: '2px solid #000', padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>PHIẾU SOẠN HÀNG</div>
          <div style={{ fontSize: 11, color: '#666' }}>ĐƠN ONLINE — BUYER ORDER</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
          <div><b>Mã đơn:</b> #{order.id}</div>
          <div><b>Buyer ID:</b> #{order.buyerId}</div>
          <div><b>Ngày đặt:</b> {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
          <div><b>Trạng thái:</b> {order.status}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Địa chỉ giao:</b> {order.shippingAddress}</div>
          <div><b>Thanh toán:</b> {order.paymentMethod}</div>
          {order.notes && <div style={{ gridColumn: '1 / -1' }}><b>Ghi chú:</b> {order.notes}</div>}
        </div>



        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'left' }}>#</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'left' }}>Tên thuốc</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>SL</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>Đơn giá</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>Thành tiền</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>Lô / HSD</th>
              <th style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>✓</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: 6 }}>{i + 1}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{it.medicineName}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center', fontWeight: 700 }}>{it.qty}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>{fmt(it.unitPrice)}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>{fmt(it.lineTotal)}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>__________</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', fontWeight: 700, marginBottom: 16 }}>
          TỔNG: {fmt(order.total)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32, textAlign: 'center', fontSize: 12 }}>
          <div>
            <div>Người soạn hàng</div>
            <div style={{ marginTop: 40 }}>____________________</div>
          </div>
          <div>
            <div>Người kiểm tra</div>
            <div style={{ marginTop: 40 }}>____________________</div>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } }`}</style>
    </div>
  );
}
