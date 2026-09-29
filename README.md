# ShiftProof ONE v7

ShiftProof ONE connects Production, Sanitation, Quality, Maintenance, contractors, and management in one plant operating record.

## v7: dual-edition architecture

The repository now contains two runnable directions:

- **Local Pilot Edition** at the repository root: the proven Python + SQLite application from v6, including Enterprise Command, QR assets, OEE, sanitation forecasting, proof, handoffs, integrations, permissions, PWA support, and grounded Shift Commander workflows.
- **Cloud SaaS Edition** in `cloud/`: a Next.js App Router application designed for Vercel with tenant boundaries, Postgres-ready schema, evidence/notification/AI provider adapters, cloud webhooks, enterprise command UI, and deployment configuration.

## Local Pilot Edition

Double-click `START_ShiftProof.command` on macOS, or run:

```bash
python3 server.py
```

Default URL: `http://127.0.0.1:4788`

## Cloud SaaS Edition

```bash
cd cloud
npm install
npm run dev
```

Set the Vercel project root directory to `cloud/`. Copy `cloud/.env.example` into your provider environment settings and configure only the services you are ready to activate.

## v7 cloud capabilities

- Multi-tenant organization/facility boundary model
- Enterprise network dashboard
- Next.js route-handler API surface
- Managed Postgres-compatible schema
- Token-protected integration webhooks
- Evidence storage adapter
- Email/push notification adapter
- Cloud AI provider adapter with grounded deterministic fallback
- GitHub preview-deployment workflow
- Vercel project configuration
- No committed secrets

See `CLOUD_MIGRATION.md` and `cloud/README.md` for the migration sequence.