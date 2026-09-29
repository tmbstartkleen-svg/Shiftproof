# ShiftProof Cloud v13

Next.js SaaS edition for ShiftProof ONE.

```bash
npm install
npm run preflight
npm run typecheck
npm run build
npm run db:migrate
npm run db:seed
npm run vercel:bootstrap -- --apply
npm run smoke
npm run release:check
```

v13 adds private Vercel Blob evidence uploads, live-service readiness, notification-provider hooks, and migration `0004_live_services.sql` while retaining v12's deployment/promotion gate.
