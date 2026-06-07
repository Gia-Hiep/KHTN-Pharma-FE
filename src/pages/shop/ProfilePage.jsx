// File: src/pages/shop/ProfilePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { AuthApi } from '../../apis';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components/ui/PageHeader';

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '' });
  const [pwForm, setPwForm] = useState({ newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuthApi.getProfile();
      setProfile(res);
      setForm({ fullName: res.fullName || '', phone: res.phone || '', email: res.email || '', address: res.address || '' });
    } catch (e) {
      toast.error(e?.message || 'Không tải được thông tin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChange = useCallback((e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await AuthApi.updateProfile(form);
      setProfile(res);
      toast.success('Cập nhật thành công!');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu mới phải từ 6 ký tự'); return; }
    setPwSaving(true);
    try {
      await AuthApi.changeMyPassword(pwForm);
      setPwForm({ newPassword: '' });
      toast.success('Đổi mật khẩu thành công!');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setPwSaving(false);
    }
  }, [pwForm]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="skeleton-text w-48 h-6" />
        <div className="card">
          <div className="card-body space-y-4">
            <div className="mx-auto skeleton h-20 w-20 rounded-full" />
            <div className="skeleton-text w-2/3" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="👤 Thông tin tài khoản" />

      {/* ── Profile Info ── */}
      <div className="card">
        <div className="card-body">
          {/* Avatar placeholder */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {(profile?.fullName || profile?.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{profile?.fullName || profile?.username}</div>
              <div className="text-sm text-slate-500">
                {profile?.roles?.join(', ')}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="prof-name" className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
              <input id="prof-name" name="fullName" className="input" value={form.fullName} onChange={handleChange} aria-label="Họ và tên" />
            </div>
            <div>
              <label htmlFor="prof-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input id="prof-phone" name="phone" className="input" value={form.phone} onChange={handleChange} aria-label="Số điện thoại" />
            </div>
            <div>
              <label htmlFor="prof-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input id="prof-email" name="email" type="email" className="input" value={form.email} onChange={handleChange} aria-label="Email" />
            </div>
            <div>
              <label htmlFor="prof-address" className="mb-1.5 block text-sm font-medium text-slate-700">Địa chỉ</label>
              <input id="prof-address" name="address" className="input" value={form.address} onChange={handleChange} aria-label="Địa chỉ" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving} aria-label="Lưu thay đổi">
              {saving ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang lưu...</>
              ) : '💾 Lưu thay đổi'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="card">
        <div className="card-body">
          <h3 className="mb-4 text-base font-bold text-slate-900">🔑 Đổi mật khẩu</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="prof-pw" className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
              <input
                id="prof-pw"
                name="newPassword"
                type="password"
                className="input"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ newPassword: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                aria-label="Mật khẩu mới"
              />
            </div>
            <button type="submit" className="btn-secondary w-full" disabled={pwSaving} aria-label="Đổi mật khẩu">
              {pwSaving ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> Đang đổi...</>
              ) : '🔑 Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
