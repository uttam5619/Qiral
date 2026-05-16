/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Qiral NL2SQL — End-to-End Test Suite                           ║
 * ║  Org: TechVentures Pvt Ltd                                      ║
 * ║  Users: Uttam (admin), Ram (engineer), Shyam (analyst)          ║
 * ║  Queries: 90 NL queries across 3 users                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import https from 'node:https';
import http  from 'node:http';
import fs    from 'node:fs';

// ── Config ──────────────────────────────────────────────────────────
const BASE  = 'http://localhost:7695/api/v1';
const DB    = 'AutoL';               // the DB name from .env
const DELAY = 2200;                  // ms between NL queries (rate limit = 30/min)

// ── Org + User definitions ──────────────────────────────────────────
const ORG = {
  orgName:  'TechVentures Pvt Ltd',
  orgSlug:  'techventures',
  email:    'uttam@techventures.com',
  password: 'Admin@123456',
  fullName: 'Uttam Sharma',
};

const USERS = [
  { email: 'ram@techventures.com',   password: 'Ram@123456',   fullName: 'Ram Verma',    role: 'engineer' },
  { email: 'shyam@techventures.com', password: 'Shyam@123456', fullName: 'Shyam Gupta',  role: 'analyst'  },
];

// ── 90 NL Queries — spread across 3 categories ─────────────────────
// 30 for Uttam (admin)  — DQL / DDL / DML mix
// 30 for Ram  (engineer)— DQL / analytical
// 30 for Shyam (analyst)— pure DQL / reporting
const NL_QUERIES = {
  uttam: [
    // ── Read / Explore ──
    'List all tables in the database',
    'How many columns does each table have?',
    'Show all primary key columns across all tables',
    'Show all foreign key relationships',
    'List tables with more than 5 columns',
    'Show the top 5 tables with the most columns',
    'Count the number of indexes per table',
    'Show tables that have no indexes',
    'List all VARCHAR columns across all tables',
    'Show all NOT NULL columns in the database',
    // ── Schema exploration ──
    'List all unique indexes in the database',
    'Show all tables along with their engines',
    'Find all auto_increment columns',
    'Show all tables and their row counts',
    'List all columns with default values',
    'Which tables have composite primary keys?',
    'Show all columns that are part of a foreign key',
    'List tables that reference other tables (parent tables)',
    'Which tables are referenced by foreign keys (child tables)?',
    'Show all indexes that are not primary keys',
    // ── Specific exploration ──
    'List all columns in all tables ordered by table name',
    'Show all date or datetime columns in the database',
    'Which columns are of type BIGINT?',
    'Show all boolean columns',
    'Show all TEXT or LONGTEXT columns',
    'List all tables with their column count and row count',
    'Show all columns that allow NULL values',
    'Find all columns named "id" or containing "id" in their name',
    'Show tables that have more than one index',
    'List all constraints in the database',
  ],

  ram: [
    // ── Analytical / joined queries ──
    'List all tables and their estimated row counts',
    'Show the relationship between all tables via foreign keys',
    'Which tables have no foreign key references?',
    'List all unique constraints in all tables',
    'Show all columns that are indexed',
    'Which columns appear in more than one table?',
    'Show all tables that have a created_at column',
    'List tables that have both created_at and updated_at',
    'Find tables that have an email column',
    'Show all ENUM columns and their possible values',
    // ── DML-style read queries ──
    'Show all columns of type INT in the database',
    'List all columns of type VARCHAR with length > 100',
    'Show all decimal or float columns',
    'Which tables have a status column?',
    'List tables with a name or title column',
    'Show all columns with the word "hash" in their name',
    'Find all columns that store tokens or keys',
    'Show tables that have a deleted_at or is_deleted column',
    'List all columns that have "expires" in their name',
    'Show all columns of type TIMESTAMP',
    // ── Cross-table ──
    'Show the full schema of all tables sorted alphabetically',
    'Which tables have the most number of relationships?',
    'List tables that are used as lookup/reference tables',
    'Show all tables that have at least 3 indexes',
    'Which column names are most common across all tables?',
    'Show all columns that are part of any unique constraint',
    'Find tables that share common column names',
    'List all indexes on tables that have foreign keys',
    'Show all tables with both a primary key and at least one foreign key',
    'Count total number of columns across all tables in the database',
  ],

  shyam: [
    // ── Pure reporting ──
    'Show me all the tables in this database',
    'How many tables are there in total?',
    'What are the column names of the first table?',
    'Show all column data types used in the database',
    'How many total columns are there in the database?',
    'Which table has the most columns?',
    'Which table has the fewest columns?',
    'Show all tables and whether they have primary keys',
    'List tables sorted by number of columns descending',
    'Show the column count for each table',
    // ── Data type exploration ──
    'How many columns are of type VARCHAR?',
    'How many columns are of type INT?',
    'How many columns are of type BIGINT?',
    'How many columns are of type TEXT?',
    'How many columns are of type DATETIME or TIMESTAMP?',
    'Show all unique data types used in the database',
    'How many columns use ENUM type?',
    'Count columns by data type',
    'Which data type is most commonly used?',
    'Show all nullable column counts per table',
    // ── FK / PK summary ──
    'How many foreign key relationships exist in total?',
    'Which table has the most foreign keys?',
    'How many tables have no foreign keys?',
    'Show a summary of primary keys for each table',
    'How many tables have composite primary keys?',
    'Which table has the most indexes?',
    'How many total indexes are there in the database?',
    'Show the average number of columns per table',
    'Which tables have exactly one column?',
    'Show all tables with their column names in a flat list',
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port:     url.port,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(icon, msg) {
  const ts = new Date().toLocaleTimeString('en-IN', { hour12: false });
  console.log(`[${ts}] ${icon}  ${msg}`);
}

function hr(char = '─') { console.log(char.repeat(70)); }

// ── Test result store ────────────────────────────────────────────────
const results = {
  setup: {},
  queries: [],
  summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
};

async function runNLQuery(user, token, query, idx) {
  const start = Date.now();
  try {
    const res = await request('POST', '/query', { dbName: DB, userQuery: query }, token);
    const ok  = res.status === 200 && res.body.success;
    const r0  = res.body.results?.[0];
    const elapsed = Date.now() - start;

    const entry = {
      index:      idx,
      user:       user.email,
      role:       user.role,
      query,
      status:     res.status,
      success:    ok && r0?.success,
      type:       r0?.type || '—',
      rowCount:   r0?.rowCount ?? (r0?.data?.length ?? '—'),
      sql:        r0?.generatedSQL || null,
      error:      r0?.error || r0?.validationErrors || null,
      elapsed_ms: elapsed,
    };

    results.queries.push(entry);
    results.summary.total++;

    if (entry.success) {
      results.summary.passed++;
      log('✅', `[${idx}] ${user.fullName} | ${entry.type} | rows=${entry.rowCount} | ${elapsed}ms`);
      if (entry.sql) log('  📝', entry.sql.replace(/\n/g, ' ').slice(0, 90));
    } else {
      results.summary.failed++;
      log('❌', `[${idx}] ${user.fullName} | FAIL | ${entry.error || JSON.stringify(r0)}`);
    }

    return entry;
  } catch (err) {
    results.summary.skipped++;
    results.summary.total++;
    log('⚠️ ', `[${idx}] ${user.fullName} | ERROR | ${err.message}`);
    results.queries.push({ index: idx, user: user.email, query, success: false, error: err.message });
    return null;
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────
(async () => {
  console.log('\n');
  hr('═');
  log('🚀', 'Qiral NL2SQL — End-to-End Test Suite');
  hr('═');

  // ── PHASE 1: Bootstrap org + admin (Uttam) ─────────────────────────
  hr();
  log('🏢', `PHASE 1: Bootstrapping org "${ORG.orgName}" …`);

  let adminToken, adminUser, orgId;

  // Try bootstrap — if org already exists, just login
  const bootRes = await request('POST', '/auth/bootstrap', ORG);
  if (bootRes.status === 201 && bootRes.body.success) {
    adminToken = bootRes.body.data.accessToken;
    adminUser  = { ...bootRes.body.data.user, email: ORG.email, password: ORG.password, fullName: ORG.fullName, role: 'admin' };
    orgId      = bootRes.body.data.organization.id;
    log('✅', `Org created! ID=${orgId}  Admin="${ORG.fullName}"  Token obtained`);
    results.setup.bootstrap = { success: true, orgId, status: 'created' };
  } else if (bootRes.body.message?.includes('already')) {
    // Org or email already exists — just login
    log('ℹ️ ', `Org/user already exists — logging in as admin…`);
    const loginRes = await request('POST', '/auth/login', { email: ORG.email, password: ORG.password });
    if (loginRes.status === 200 && loginRes.body.success) {
      adminToken = loginRes.body.data.accessToken;
      adminUser  = { ...loginRes.body.data.user, email: ORG.email, password: ORG.password, fullName: ORG.fullName, role: 'admin' };
      orgId      = loginRes.body.data.user.orgId;
      log('✅', `Logged in as admin. orgId=${orgId}`);
      results.setup.bootstrap = { success: true, orgId, status: 'existing' };
    } else {
      log('❌', `Login failed: ${loginRes.body.message}`);
      results.setup.bootstrap = { success: false, error: loginRes.body.message };
      process.exit(1);
    }
  } else {
    log('❌', `Bootstrap failed: ${bootRes.body.message}`);
    results.setup.bootstrap = { success: false, error: bootRes.body.message };
    process.exit(1);
  }

  // ── PHASE 2: Register Ram & Shyam ─────────────────────────────────
  hr();
  log('👥', 'PHASE 2: Registering additional users …');

  const registeredUsers = [];
  for (const u of USERS) {
    const regRes = await request('POST', '/auth/register', { ...u, orgId });
    if (regRes.status === 201 || regRes.body.message?.includes('already')) {
      const status = regRes.status === 201 ? 'registered' : 'already_exists';
      log('✅', `${u.fullName} (${u.role}) — ${status}`);
      results.setup[u.email] = { success: true, status };
    } else {
      log('⚠️ ', `${u.fullName} — ${regRes.body.message}`);
      results.setup[u.email] = { success: false, error: regRes.body.message };
    }
    registeredUsers.push(u);
  }

  // ── PHASE 3: Login all users ───────────────────────────────────────
  hr();
  log('🔐', 'PHASE 3: Logging in all three users …');

  const sessions = {};

  // Login Uttam (already logged in above)
  sessions.uttam = { ...adminUser, token: adminToken };
  log('✅', `Uttam logged in (admin)`);

  // Login Ram
  const ramLogin = await request('POST', '/auth/login', { email: USERS[0].email, password: USERS[0].password });
  if (ramLogin.status === 200 && ramLogin.body.success) {
    sessions.ram = { ...USERS[0], ...ramLogin.body.data.user, token: ramLogin.body.data.accessToken };
    log('✅', `Ram logged in (engineer)`);
    results.setup.ram_login = { success: true };
  } else {
    log('❌', `Ram login failed: ${ramLogin.body.message}`);
    results.setup.ram_login = { success: false, error: ramLogin.body.message };
  }

  // Login Shyam
  const shyamLogin = await request('POST', '/auth/login', { email: USERS[1].email, password: USERS[1].password });
  if (shyamLogin.status === 200 && shyamLogin.body.success) {
    sessions.shyam = { ...USERS[1], ...shyamLogin.body.data.user, token: shyamLogin.body.data.accessToken };
    log('✅', `Shyam logged in (analyst)`);
    results.setup.shyam_login = { success: true };
  } else {
    log('❌', `Shyam login failed: ${shyamLogin.body.message}`);
    results.setup.shyam_login = { success: false, error: shyamLogin.body.message };
  }

  // ── PHASE 4: Register & Sync the AutoL database (admin) ───────────
  hr();
  log('🗄️ ', `PHASE 4: Registering database "${DB}" …`);

  const dbRegRes = await request('POST', '/databases', {
    dbName:     DB,
    host:       '127.0.0.1',
    port:       3306,
    dbUsername: 'root',
    dbPassword: '12345',
    dbType:     'MYSQL',
  }, adminToken);

  if (dbRegRes.status === 201 && dbRegRes.body.success) {
    log('✅', `Database "${DB}" registered`);
    results.setup.db_register = { success: true };
  } else if (dbRegRes.body.message?.toLowerCase().includes('already') ||
             dbRegRes.body.message?.toLowerCase().includes('exists')) {
    log('ℹ️ ', `Database "${DB}" already registered`);
    results.setup.db_register = { success: true, status: 'already_exists' };
  } else {
    log('⚠️ ', `DB register: ${dbRegRes.body.message} (continuing anyway)`);
    results.setup.db_register = { success: false, error: dbRegRes.body.message };
  }

  // Test connection
  log('🔌', `Testing database connection …`);
  const testRes = await request('POST', `/databases/${DB}/test`, null, adminToken);
  log(testRes.body.success ? '✅' : '⚠️ ', `Connection test: ${testRes.body.message}`);
  results.setup.db_test = { success: testRes.body.success, message: testRes.body.message };

  // Sync metadata
  log('🔄', `Syncing schema metadata …`);
  const syncRes = await request('POST', `/databases/${DB}/sync`, null, adminToken);
  if (syncRes.status === 200 && syncRes.body.success) {
    log('✅', `Metadata sync complete`);
    results.setup.db_sync = { success: true, data: syncRes.body.data };
  } else {
    log('⚠️ ', `Sync: ${syncRes.body.message}`);
    results.setup.db_sync = { success: false, error: syncRes.body.message };
  }

  // ── PHASE 5: Run 90 NL Queries ────────────────────────────────────
  hr('═');
  log('⚡', 'PHASE 5: Running 90 NL Queries …');
  log('📌', `Rate limit: 30 queries/min — delay ${DELAY}ms between each`);
  hr('═');

  let queryIdx = 1;

  // ── Uttam's 30 queries ──
  hr();
  log('👤', `UTTAM (admin) — 30 queries`);
  hr();
  for (const q of NL_QUERIES.uttam) {
    await runNLQuery(sessions.uttam, sessions.uttam.token, q, queryIdx++);
    await sleep(DELAY);
  }

  // ── Ram's 30 queries ──
  hr();
  log('👤', `RAM (engineer) — 30 queries`);
  hr();
  for (const q of NL_QUERIES.ram) {
    await runNLQuery(sessions.ram, sessions.ram.token, q, queryIdx++);
    await sleep(DELAY);
  }

  // ── Shyam's 30 queries ──
  hr();
  log('👤', `SHYAM (analyst) — 30 queries`);
  hr();
  for (const q of NL_QUERIES.shyam) {
    await runNLQuery(sessions.shyam, sessions.shyam.token, q, queryIdx++);
    await sleep(DELAY);
  }

  // ── PHASE 6: Verify DB state ───────────────────────────────────────
  hr('═');
  log('🔍', 'PHASE 6: Verifying database state …');
  hr('═');

  const dbListRes = await request('GET', `/databases`, null, adminToken);
  const usersRes  = await request('GET', `/users`, null, adminToken);

  log('🗄️ ', `Registered databases: ${JSON.stringify((dbListRes.body.data || []).map(d => d.db_name))}`);
  log('👥', `Total users in org: ${usersRes.body.data?.users?.length ?? usersRes.body.total ?? '?'}`);

  results.verification = {
    databases: dbListRes.body.data || [],
    users: usersRes.body.data?.users || [],
  };

  // ── FINAL SUMMARY ──────────────────────────────────────────────────
  hr('═');
  log('📊', 'FINAL TEST SUMMARY');
  hr('═');
  console.log(`\n  Total Queries : ${results.summary.total}`);
  console.log(`  ✅ Passed     : ${results.summary.passed}`);
  console.log(`  ❌ Failed     : ${results.summary.failed}`);
  console.log(`  ⚠️  Skipped    : ${results.summary.skipped}`);
  console.log(`  Pass Rate     : ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%\n`);

  // Per-user summary
  for (const [name, user] of Object.entries(sessions)) {
    const userQ = results.queries.filter(q => q.user === user.email);
    const pass  = userQ.filter(q => q.success).length;
    log('👤', `${user.fullName || name} (${user.role}): ${pass}/${userQ.length} passed`);
  }

  // ── Save results ───────────────────────────────────────────────────
  const outPath = './test_results.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  hr('═');
  log('💾', `Results saved → ${outPath}`);
  hr('═');
  console.log('\n');
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
