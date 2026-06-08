import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../apis';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await AuthApi.login({ username: form.username, password: form.password });

      const token  = res?.token  ?? res?.access_token;
      const userId = res?.userId ?? res?.id;
      const roles  = res?.roles  ?? [];

      if (!token) throw new Error('Không nhận được token từ server');

      login({ token, user: { userId, roles } });

      if (roles.includes('ADMIN')) navigate('/admin/dashboard');
      else if (roles.includes('PHARMACIST')) navigate('/pharma/orders');
      else navigate('/shop/medicines');
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.409a2.25 2.25 0 0 1-2.133 1.591H8.603a2.25 2.25 0 0 1-2.133-1.591L5 14.5m14 0H5" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Pharmacy SOA</h2>
          <p className="mt-3 text-blue-200 text-sm leading-relaxed">
            Nền tảng quản lý nhà thuốc B2B thông minh. Quản lý đơn hàng, kho thuốc, hóa đơn — tất cả trong một.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Sản phẩm' },
              { value: '24/7', label: 'Hỗ trợ' },
              { value: '99.9%', label: 'Uptime' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur px-3 py-3">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[11px] text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.409a2.25 2.25 0 0 1-2.133 1.591H8.603a2.25 2.25 0 0 1-2.133-1.591L5 14.5m14 0H5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pharmacy SOA</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin tài khoản để tiếp tục</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên đăng nhập</label>
                <input
                  name="username"
                  placeholder="admin / pharmacist / buyer"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
