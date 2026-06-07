// File: src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="center-page">
      <h1>404</h1>
      <h2>Trang không tồn tại</h2>
      <p>Đường dẫn bạn truy cập không tồn tại.</p>
      <Link to="/" style={{ color: '#3b82f6' }}>← Về trang chủ</Link>
    </div>
  );
}
