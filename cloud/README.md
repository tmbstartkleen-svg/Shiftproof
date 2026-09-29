# ShiftProof ONE Cloud v7

This directory is the hosted SaaS migration target for ShiftProof ONE.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Vercel

Create a Vercel project with **Root Directory** set to `cloud/`. Add the environment variables from `.env.example`. The app runs without external services in demo-adapter mode, then automatically reports cloud readiness as Postgres/storage/AI providers are configured.

## Architecture goals

- Tenant isolation by organization and facility
- Managed Postgres-compatible schema
- Evidence storage provider abstraction
- Notification provider abstraction
- Token-protected webhook route handlers
- Cloud AI adapter with deterministic grounded fallback
- Server-rendered enterprise command UI