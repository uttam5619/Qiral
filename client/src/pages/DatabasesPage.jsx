import { useState, useEffect } from 'react';
import { dbApi } from '../api/axios';
import { useAuth } from '../context/AuthContext';

function DbModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ dbName: '', host: '127.0.0.1', port: 3306, dbUsername: '', dbPassword: '', dbType: 'MYSQL' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await dbApi.register({ ...form, port: Number(form.port) });
      onSuccess();
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.message).join(', ');
      setError(msgs || err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 w-full max-w-md fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-100">Register Database</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">✕</button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Database Name</label>
            <input className="input" placeholder="MyDatabase" value={form.dbName} onChange={set('dbName')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Host</label>
              <input className="input" value={form.host} onChange={set('host')} required /></div>
            <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Port</label>
              <input className="input" type="number" value={form.port} onChange={set('port')} required /></div>
          </div>
          <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Username</label>
            <input className="input" value={form.dbUsername} onChange={set('dbUsername')} required /></div>
          <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Password</label>
            <input className="input" type="password" value={form.dbPassword} onChange={set('dbPassword')} required /></div>
          <div><label className="text-xs text-gray-400 font-medium mb-1.5 block">Type</label>
            <select className="input" value={form.dbType} onChange={set('dbType')}>
              <option>MYSQL</option><option>POSTGRES</option><option>MSSQL</option>
            </select></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Registering…' : 'Register Database'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DatabasesPage() {
  const { isEngineer, isAnalyst } = useAuth();
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus]       = useState({});   // { dbName: 'testing'|'syncing'|'ok'|'error' }
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});

  const loadDatabases = async (p = 1) => {
    setLoading(true);
    try {
      const res = await dbApi.list(p);
      setDatabases(res.data.data || []);
      setPagination(res.data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDatabases(page); }, [page]);

  const testDb = async (dbName) => {
    setStatus(s => ({ ...s, [dbName]: 'testing' }));
    try {
      await dbApi.test(dbName);
      setStatus(s => ({ ...s, [dbName]: 'ok' }));
    } catch { setStatus(s => ({ ...s, [dbName]: 'error' })); }
  };

  const syncDb = async (dbName) => {
    setStatus(s => ({ ...s, [dbName]: 'syncing' }));
    try {
      await dbApi.sync(dbName);
      setStatus(s => ({ ...s, [dbName]: 'synced' }));
    } catch { setStatus(s => ({ ...s, [dbName]: 'sync-error' })); }
  };

  const deleteDb = async (dbName) => {
    if (!confirm(`Delete database "${dbName}"?`)) return;
    try { await dbApi.delete(dbName); loadDatabases(page); } catch (err) { alert(err.response?.data?.message); }
  };

  const statusLabel = { testing: '⏳ Testing…', syncing: '⏳ Syncing…', ok: '✅ Online', error: '❌ Error', synced: '✅ Synced', 'sync-error': '❌ Sync failed' };

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-100">🗄️ Databases</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your database connections.</p>
        </div>
        {isEngineer && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Register Database
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : databases.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center fade-up">
          <div className="text-5xl mb-4">🗄️</div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No databases yet</h3>
          <p className="text-gray-500 text-sm mb-6">Register your first database connection to get started.</p>
          {isEngineer && <button onClick={() => setShowModal(true)} className="btn-primary">Register Database</button>}
        </div>
      ) : (
        <div className="grid gap-4">
          {databases.map(db => (
            <div key={db.db_name} className="glass p-5 flex items-center gap-5 fade-up">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                🗄️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-gray-100">{db.db_name}</span>
                  <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{db.db_type}</span>
                  {status[db.db_name] && (
                    <span className="text-xs text-gray-400">{statusLabel[status[db.db_name]]}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono">{db.db_username}@{db.host}:{db.port}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {isAnalyst && (
                  <button onClick={() => testDb(db.db_name)} disabled={status[db.db_name] === 'testing'}
                    className="btn-secondary text-xs px-3 py-1.5">Test</button>
                )}
                {isAnalyst && (
                  <button onClick={() => syncDb(db.db_name)} disabled={status[db.db_name] === 'syncing'}
                    className="btn-secondary text-xs px-3 py-1.5">Sync</button>
                )}
                {isEngineer && (
                  <button onClick={() => deleteDb(db.db_name)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs">← Prev</button>
              <span className="text-xs text-gray-400 flex items-center px-3">Page {page} / {pagination.totalPages}</span>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs">Next →</button>
            </div>
          )}
        </div>
      )}

      {showModal && <DbModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadDatabases(page); }} />}
    </div>
  );
}
