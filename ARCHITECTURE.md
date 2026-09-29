# ShiftProof ONE v7 Architecture

## Local Pilot Edition

The repository root remains the pilot-ready Python/SQLite application. It is intentionally retained because local facilities can test ShiftProof without a cloud migration or enterprise infrastructure purchase.

## Cloud SaaS Edition

`cloud/` is a Next.js App Router application designed for Vercel.

### Tenant boundary

The cloud model scopes every facility and operational record to an organization. Membership checks happen before facility data access. Production deployments should enforce the same boundary in the Postgres queries and authentication claims.

### Data

`cloud/db/schema.sql` establishes the first managed-Postgres schema for organizations, facilities, users, memberships, facility memberships, and audit events. The current UI uses a demo repository adapter when `DATABASE_URL` is absent.

### Evidence

Storage is behind a provider boundary. The intended hosted path is managed object/blob storage, with evidence metadata and content hashes retained separately from binary files.

### Notifications

Email and push are provider adapters. v7 exposes configuration status without inventing delivery success when no provider is connected.

### AI

Shift Commander can use a cloud LLM provider when configured, but the architecture preserves the deterministic plant-intelligence fallback from v6. AI output should remain grounded in organization/facility-scoped operational records.

### Integrations

Next.js route handlers provide token-protected connector ingress. Production should add signature verification, replay protection, rate limits, dead-letter handling, and idempotency keys.

### Deployment

Set the Vercel project root to `cloud/`. GitHub PRs can run the preview workflow once `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are configured as secrets.