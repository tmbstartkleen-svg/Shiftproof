const base = (process.env.BASE_URL || process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: BASE_URL=https://preview.example npm run smoke');
  process.exit(2);
}
async function json(path, init={}) {
  const res = await fetch(base + path, init);
  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`);
  return { res, body };
}
const health = await json('/api/health');
if (!health.body.ok) throw new Error('health endpoint did not return ok');
const readiness = await json('/api/readiness');
if (!readiness.body.readiness?.previewReady) throw new Error('preview readiness is false');
const email = process.env.SHIFTPROOF_SMOKE_EMAIL || 'plantmanager@demo.local';
const password = process.env.SHIFTPROOF_SMOKE_PASSWORD || '1111';
const login = await json('/api/auth/login', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,password}) });
const setCookie = login.res.headers.get('set-cookie');
if (!setCookie) throw new Error('login did not issue a session cookie');
const cookie = setCookie.split(';')[0];
const me = await json('/api/auth/me', { headers:{cookie} });
if (!me.body.user?.email) throw new Error('session verification failed');
console.log(JSON.stringify({ok:true,version:health.body.version,previewReady:true,user:me.body.user.email},null,2));
