import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/axios';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('profile');

  // Change password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New passwords do not match'); return;
    }
    setPwLoading(true);
    try {
      const res = await userApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess(res.data.message || 'Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(logout, 2000); // force re-login
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.message).join(', ');
      setPwError(msgs || err.response?.data?.message || 'Failed');
    } finally { setPwLoading(false); }
  };

  const roleBadgeClass = { admin: 'badge-admin', engineer: 'badge-engineer', analyst: 'badge-analyst', user: 'badge-user' }[user?.role] || 'badge-user';

  const tabs = [
    { id: 'profile',  label: 'Profile' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-100">⚙️ Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your profile and security settings.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="glass p-6 fade-up space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-2xl">
              {(user?.fullName?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-gray-100">{user?.fullName}</div>
              <div className="text-sm text-gray-400">{user?.email}</div>
              <span className={`mt-1 inline-block ${roleBadgeClass}`}>{user?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ['User ID',         user?.userId],
              ['Organization ID', user?.orgId],
              ['Role',            user?.role],
              ['Email',           user?.email],
            ].map(([k, v]) => (
              <div key={k} className="p-4 rounded-xl bg-white/5">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm font-medium text-gray-200">{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div className="glass p-6 fade-up">
          <h2 className="text-base font-semibold text-gray-200 mb-4">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">
            After changing your password, you will be logged out of all devices and redirected to login.
          </p>

          {pwError   && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{pwError}</div>}
          {pwSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{pwSuccess} Redirecting to login…</div>}

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Current Password</label>
              <input className="input" type="password" placeholder="Enter current password" value={pwForm.currentPassword} onChange={setPw('currentPassword')} required />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">New Password</label>
              <input className="input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 digit" value={pwForm.newPassword} onChange={setPw('newPassword')} required />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Confirm New Password</label>
              <input className="input" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={setPw('confirm')} required />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary">
              {pwLoading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
