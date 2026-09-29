import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();
const required=['package.json','next.config.mjs','vercel.json','.env.example','app/api/health/route.ts','app/api/readiness/route.ts','app/api/auth/login/route.ts','app/api/auth/me/route.ts','app/api/pilot/status/route.ts','app/api/audit/export/route.ts','app/api/admin/backup/export/route.ts','app/api/admin/notifications/process/route.ts','app/pilot/page.tsx','app/manifest.ts','lib/rate-limit.ts','lib/observability.ts','lib/audit.ts','lib/recovery.ts','lib/pilot.ts','lib/security.ts','db/migrations/0006_pilot_reliability.sql','components/FloorConsole.tsx','app/floor/[facilityId]/page.tsx','scripts/permission-test.ts','scripts/security-test.ts','scripts/recovery-check.mjs'];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error('PRECHECK_FAIL missing files:',missing.join(', '));process.exit(1)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.version!=='16.0.0'){console.error('PRECHECK_FAIL package version must be 16.0.0');process.exit(1)}
const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');
for(const key of ['DATABASE_URL','SHIFTPROOF_SESSION_SECRET','SHIFTPROOF_DEMO_AUTH','SHIFTPROOF_BASE_URL','BLOB_READ_WRITE_TOKEN','SHIFTPROOF_WEBHOOK_SECRET']){if(!env.includes(key+'=')){console.error('PRECHECK_FAIL missing env template key:',key);process.exit(1)}}
console.log('PRECHECK_OK ShiftProof v16 floor-operations UX files are structurally ready.');
