import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../apis';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', phone: '', email: '', address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await AuthApi.register(form);
      const token = res?.token ?? res?.access_token;
      const userId = res?.userId ?? res?.id;
      const roles = res?.roles ?? ['BUYER'];

      if (!token) throw new Error('Đăng ký thành công nhưng không nhận được token');

      login({ token, user: { userId, roles } });
      navigate('/shop/medicines');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng ký thất bại');
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
            Tạo tài khoản để bắt đầu mua thuốc online. An toàn, tiện lợi, giao hàng nhanh.
          </p>
        </div>
      </div>

      {/* Right — Register Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.409a2.25 2.25 0 0 1-2.133 1.591H8.603a2.25 2.25 0 0 1-2.133-1.591L5 14.5m14 0H5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pharmacy SOA</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng ký tài khoản</h2>
            <p className="mt-1 text-sm text-slate-500">Tạo tài khoản mua hàng nhanh chóng</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập *</label>
                  <input name="username" value={form.username} onChange={handleChange} required autoFocus
                    placeholder="Tối thiểu 3 ký tự"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input name="address" value={form.address} onChange={handleChange}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng ký...
                  </span>
                ) : 'Đăng ký'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
