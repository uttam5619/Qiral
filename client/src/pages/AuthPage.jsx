import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/axios';

const TAB = { LOGIN: 'login', REGISTER: 'register', BOOTSTRAP: 'bootstrap', FORGOT: 'forgot' };

export default function AuthPage() {
  const { user, login, register, bootstrap } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]         = useState(TAB.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', role: 'user',
    orgId: '', orgName: '', orgSlug: '',
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (tab === TAB.LOGIN) {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else if (tab === TAB.REGISTER) {
        await register({ email: form.email, password: form.password, fullName: form.fullName, role: form.role, orgId: Number(form.orgId) });
        setSuccess('Registered! Please login.');
        setTab(TAB.LOGIN);
      } else if (tab === TAB.BOOTSTRAP) {
        await bootstrap({ orgName: form.orgName, orgSlug: form.orgSlug, email: form.email, password: form.password, fullName: form.fullName });
        navigate('/dashboard');
      } else if (tab === TAB.FORGOT) {
        const res = await authApi.forgotPassword(form.email);
        setSuccess(res.data.message + (res.data.dev_reset_token ? ` Token: ${res.data.dev_reset_token}` : ''));
      }
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.message).join(', ');
      setError(msgs || err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: TAB.LOGIN,     label: 'Sign In' },
    { id: TAB.REGISTER,  label: 'Join Org' },
    { id: TAB.BOOTSTRAP, label: 'New Org' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">

      {/* Gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg">Q</div>
            <span className="text-2xl font-bold gradient-text">Qiral</span>
          </div>
          <p className="text-gray-400 text-sm">Natural Language → SQL, Magically.</p>
        </div>

        <div className="glass p-8">

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error   && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm break-all">{success}</div>}

          <form onSubmit={handle} className="space-y-4">

            {/* Bootstrap: org fields */}
            {tab === TAB.BOOTSTRAP && (<>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Organization Name</label>
                <input className="input" placeholder="Acme Corp" value={form.orgName} onChange={set('orgName')} required />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Slug (lowercase, hyphens)</label>
                <input className="input" placeholder="acme-corp" value={form.orgSlug} onChange={set('orgSlug')} required />
              </div>
            </>)}

            {/* Full name for register + bootstrap */}
            {(tab === TAB.REGISTER || tab === TAB.BOOTSTRAP) && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Full Name</label>
                <input className="input" placeholder="Jane Doe" value={form.fullName} onChange={set('fullName')} required />
              </div>
            )}

            {/* Email — always */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>

            {/* Password — not on forgot */}
            {tab !== TAB.FORGOT && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Password</label>
                <input className="input" type="password" placeholder="Min 8 chars, 1 upper, 1 digit" value={form.password} onChange={set('password')} required />
              </div>
            )}

            {/* Join org: orgId + role */}
            {tab === TAB.REGISTER && (<>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Organization ID</label>
                <input className="input" type="number" placeholder="10001" value={form.orgId} onChange={set('orgId')} required />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="user">User (Viewer)</option>
                  <option value="analyst">Analyst</option>
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>)}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Please wait…' :
                tab === TAB.LOGIN ? 'Sign In' :
                tab === TAB.REGISTER ? 'Join Organization' :
                tab === TAB.BOOTSTRAP ? 'Create Organization & Account' :
                'Send Reset Link'}
            </button>
          </form>

          {tab === TAB.LOGIN && (
            <button onClick={() => setTab(TAB.FORGOT)} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 w-full text-center">
              Forgot password?
            </button>
          )}
          {tab === TAB.FORGOT && (
            <button onClick={() => setTab(TAB.LOGIN)} className="mt-4 text-xs text-gray-500 hover:text-gray-300 w-full text-center">
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
