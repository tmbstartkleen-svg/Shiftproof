#!/usr/bin/env node
const base = (process.env.BASE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('BASE_URL is required.');
  process.exit(2);
}
const checks = ['/api/health', '/api/readiness', '/api/deployment/status'];
let failed = false;
for (const path of checks) {
  const res = await fetch(base + path, { redirect: 'follow' });
  const text = await res.text();
  console.log(`${path} -> ${res.status}`);
  if (!res.ok) {
    failed = true;
    console.error(text.slice(0, 500));
  }
}
if (failed) process.exit(1);
console.log('RELEASE_CHECK_OK');
