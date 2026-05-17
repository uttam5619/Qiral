import https from 'node:https';
import http  from 'node:http';

const BASE  = 'http://localhost:7695/api/v1';

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

(async () => {
  console.log("Logging in...");
  const loginRes = await request('POST', '/auth/login', { email: 'uttam@techventures.com', password: 'Admin@123456' });
  const token = loginRes.body.data.accessToken;

  console.log("Creating table, inserting, fetching...");
  const q = "Create a table named employees2 with id and name, insert Jane Doe into it, then fetch all employees2";
  const res = await request('POST', '/query', { dbName: 'AutoL', userQuery: q }, token);
  console.log(JSON.stringify(res.body, null, 2));
})();
