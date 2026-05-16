import { useState, useEffect } from 'react';
import { userApi } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'engineer', 'analyst', 'user'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});
  const [actionState, setActionState] = useState({});

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await userApi.list(p);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const changeRole = async (userId, role) => {
    setActionState(s => ({ ...s, [userId]: 'updating' }));
    try {
      await userApi.updateRole(userId, role);
      setUsers(u => u.map(x => x.user_id === userId ? { ...x, role } : x));
      setActionState(s => ({ ...s, [userId]: 'done' }));
      setTimeout(() => setActionState(s => ({ ...s, [userId]: undefined })), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
      setActionState(s => ({ ...s, [userId]: undefined }));
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await userApi.delete(userId);
      load(page);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const roleBadge = {
    admin:    'badge-admin', engineer: 'badge-engineer',
    analyst: 'badge-analyst', user: 'badge-user',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-100">👥 Team Members</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {pagination.totalItems || 0} members in your organization.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{u.full_name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.user_id === me?.userId ? (
                      <span className={roleBadge[u.role]}>{u.role}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.user_id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    {actionState[u.user_id] === 'updating' && <span className="ml-2 text-xs text-indigo-400">saving…</span>}
                    {actionState[u.user_id] === 'done'     && <span className="ml-2 text-xs text-emerald-400">✓ saved</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={u.is_deleted ? 'badge-inactive' : 'badge-active'}>
                      {u.is_deleted ? 'Deleted' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.user_id !== me?.userId && !u.is_deleted && (
                      <button onClick={() => deleteUser(u.user_id, u.email)}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No team members found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs">← Prev</button>
          <span className="text-xs text-gray-400 flex items-center px-3">Page {page} / {pagination.totalPages}</span>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs">Next →</button>
        </div>
      )}
    </div>
  );
}
