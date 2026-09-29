import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json',
  'next.config.mjs',
  'vercel.json',
  '.env.example',
  'app/api/health/route.ts',
  'app/api/readiness/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/me/route.ts',
  'app/deployment/page.tsx',
  'lib/readiness.ts',
  'db/schema.sql',
  'db/migrations/0002_tenant_admin.sql',
  'db/migrations/0003_activation.sql'
];
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error('PRECHECK_FAIL missing files:', missing.join(', '));
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '11.0.0') {
  console.error('PRECHECK_FAIL package version must be 11.0.0');
  process.exit(1);
}
const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['DATABASE_URL','SHIFTPROOF_SESSION_SECRET','SHIFTPROOF_DEMO_AUTH','SHIFTPROOF_BASE_URL']) {
  if (!env.includes(key + '=')) {
    console.error('PRECHECK_FAIL missing env template key:', key);
    process.exit(1);
  }
}
console.log('PRECHECK_OK ShiftProof v11 deployment files are structurally ready.');
