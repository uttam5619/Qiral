import { useState, useRef, useEffect } from 'react';
import { dbApi, queryApi } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EXAMPLE_QUERIES = [
  'List all tables in the system',
  'How many columns does each table have?',
  'Show all foreign key relationships',
  'Create a table named products with id, name, and price',
  'Create a table named orders with id, product_id, and quantity with a foreign key to products',
  'Insert 3 sample products into products table',
  'Insert 2 orders into the orders table',
  'Fetch all orders joined with products to show product name and quantity',
  'Show the top 5 tables with the most columns',
  'Find all primary key columns across all tables',
];

function ResultTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0 || !rows[0])
    return <div className="text-center py-8 text-gray-500 text-sm">No rows returned.</div>;

  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {cols.map(c => (
              <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} hover:bg-white/5 transition-colors`}>
              {cols.map(c => (
                <td key={c} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{String(row[c] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QueryPage() {
  const { user } = useAuth();
  const [databases, setDatabases]   = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [history, setHistory]       = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    dbApi.list().then(r => {
      const dbs = r.data.data || [];
      setDatabases(dbs);
      if (dbs.length > 0) setSelectedDb(dbs[0].db_name);
    }).catch(() => {});
  }, []);

  const runQuery = async (e) => {
    e?.preventDefault();
    if (!query.trim() || !selectedDb) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await queryApi.run(selectedDb, query);
      const allResults = res.data.results || [];
      // Store all results; UI will iterate them
      setResult({ allResults, classification: res.data.classification });
      setHistory(h => [{ query, db: selectedDb, result: allResults[allResults.length - 1], ts: new Date() }, ...h.slice(0, 19)]);
    } catch (err) {
      setResult({ allResults: [], error: err.response?.data?.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const tryFix = async (stepResult) => {
    if ((!stepResult?.error && !stepResult?.validationErrors) || !stepResult?.generatedSQL) return;
    setLoading(true);
    try {
      const errorMsg = stepResult.error || (Array.isArray(stepResult.validationErrors) ? stepResult.validationErrors.join(', ') : stepResult.validationErrors);
      const res = await queryApi.fix(selectedDb, query, stepResult.generatedSQL, errorMsg);
      // Update that specific step result with the fixedSQL
      setResult(prev => ({
        ...prev,
        allResults: prev.allResults.map(r =>
          r === stepResult ? { ...r, fixedSQL: res.data.fixedSQL } : r
        ),
      }));
    } catch (err) {
      alert('Fix failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="px-8 py-5 border-b border-white/5 bg-[#13161f] flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-100">⚡ Query Playground</h1>
        <p className="text-gray-400 text-sm mt-0.5">Ask anything in plain English — get SQL results instantly.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Main panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 gap-5">

          {/* DB Selector + Input */}
          <form onSubmit={runQuery} className="glass p-5 space-y-4">
            <div className="flex gap-4 items-end">
              <div className="w-56">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Database</label>
                <select className="input" value={selectedDb} onChange={e => setSelectedDb(e.target.value)}>
                  {databases.length === 0 && <option value="">No databases</option>}
                  {databases.map(db => <option key={db.db_name} value={db.db_name}>{db.db_name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Natural Language Query</label>
              <textarea ref={textareaRef}
                className="input resize-none font-medium text-base"
                rows={3}
                placeholder="e.g. Show the top 5 tables with the most columns"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runQuery(); }}
              />
              <p className="text-xs text-gray-600 mt-1">Press Ctrl+Enter to run</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading || !selectedDb} className="btn-primary">
                {loading ? <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running…</span> : '▶ Run Query'}
              </button>
              {result && !result.success && result.generatedSQL && (
                <button type="button" onClick={tryFix} disabled={loading} className="btn-secondary">
                  🔧 Fix SQL
                </button>
              )}
              {query && <button type="button" onClick={() => { setQuery(''); setResult(null); }} className="btn-secondary">Clear</button>}
            </div>
          </form>

          {/* Result — show ALL steps */}
          {result && (
            <div className="flex flex-col gap-4 fade-up overflow-y-auto flex-1">
              {/* Top-level error (network / 500) */}
              {result.error && (
                <div className="glass p-5 border border-red-500/20">
                  <p className="text-red-400 text-sm">{result.error}</p>
                </div>
              )}

              {(result.allResults || []).map((r, idx) => (
                <div key={idx} className="glass flex-shrink-0 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                        r.success ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {r.success ? '✅ Success' : '❌ Failed'}
                      </span>
                      {r.success && typeof r.rowCount === 'number' && (
                        <span className="text-xs text-gray-500">{r.rowCount} row{r.rowCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.type && <span className="text-xs text-indigo-400 font-mono font-semibold">{r.type}</span>}
                      {!r.success && r.generatedSQL && (
                        <button type="button" onClick={() => tryFix(r)} disabled={loading}
                          className="btn-secondary text-xs py-1 px-2">
                          🔧 Fix
                        </button>
                      )}
                    </div>
                  </div>

                  {r.generatedSQL && (
                    <div className="px-5 py-3 border-b border-white/5">
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Generated SQL</p>
                      <div className="sql-block">{r.generatedSQL}</div>
                    </div>
                  )}

                  {r.fixedSQL && (
                    <div className="px-5 py-3 border-b border-white/5">
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Fixed SQL</p>
                      <div className="sql-block text-yellow-300">{r.fixedSQL}</div>
                    </div>
                  )}

                  {(r.error || r.validationErrors) && (
                    <div className="px-5 py-3">
                      <p className="text-xs text-red-400">
                        {r.validationErrors
                          ? (Array.isArray(r.validationErrors) ? r.validationErrors.join(', ') : r.validationErrors)
                          : (Array.isArray(r.error) ? r.error.join(', ') : r.error)}
                      </p>
                    </div>
                  )}

                  {r.success && Array.isArray(r.data) && r.data.length > 0 && (
                    <div className="overflow-auto max-h-64">
                      <ResultTable rows={r.data} />
                    </div>
                  )}

                  {r.success && Array.isArray(r.data) && r.data.length === 0 && r.type !== 'DDL' && (
                    <div className="px-5 py-3 text-xs text-gray-500">Query executed. No rows returned.</div>
                  )}

                  {r.success && r.type === 'DDL' && (
                    <div className="px-5 py-3 text-xs text-emerald-500">Schema change applied and metadata synced ✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Examples + History ── */}
        <div className="w-72 flex-shrink-0 border-l border-white/5 overflow-y-auto px-5 py-6 space-y-6">

          {/* Examples */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Example Queries</h3>
            <div className="space-y-1.5">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button key={i} onClick={() => setQuery(q)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-150">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Queries</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setQuery(h.query); setSelectedDb(h.db); }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-150 space-y-1">
                    <div className="text-xs text-gray-300 truncate">{h.query}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400">{h.db}</span>
                      <span className={`text-xs ${h.result?.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {h.result?.success ? `✓ ${h.result.rowCount}r` : '✗'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
