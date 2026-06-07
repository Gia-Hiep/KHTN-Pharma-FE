// File: src/pages/ForbiddenPage.jsx
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="center-page">
      <h1>403</h1>
      <h2>Không có quyền truy cập</h2>
      <p>Bạn không có vai trò phù hợp để xem trang này.</p>
      <Link to="/" style={{ color: '#3b82f6' }}>← Về trang chủ</Link>
    </div>
  );
}
