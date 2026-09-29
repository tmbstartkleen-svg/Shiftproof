# ShiftProof ONE v11 Architecture

## Product architecture

Local Pilot Edition -> Python/SQLite at repository root.

Cloud SaaS Edition -> Next.js App Router in `cloud/` with tenant-scoped Postgres-ready services.

## Tenant hierarchy

Organization -> Facility -> Department -> Line -> Asset -> Plant Record / Evidence / Event.

## Deployment pipeline

Source branch -> structural preflight -> typecheck -> Next.js build -> Vercel prebuild -> preview deploy -> live smoke tests -> manual promote.

The preview and production workflows use the same built deployment artifact. Promotion occurs only after the exact preview URL passes live health/session smoke tests.

## Runtime readiness

`/api/health` reports application health and activation features.

`/api/readiness` reports preview readiness, production readiness, database status, production identity status, strong session-secret configuration, HTTPS base URL, environment, and commit SHA.

`/deployment` exposes the same gates in the UI.

## Security boundaries

- HTTP-only signed sessions.
- Organization and facility scope enforced server-side.
- Invitation tokens stored as SHA-256 hashes.
- Preview/demo authentication separable from production identity.
- Production readiness requires managed database, production identity, strong session secret, and HTTPS base URL.
