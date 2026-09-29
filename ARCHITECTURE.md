# ShiftProof ONE v13 Architecture

v13 keeps the dual-edition model: the repository root remains the local pilot application while `cloud/` is the hosted Next.js SaaS edition.

The cloud control plane now separates four production services behind adapters:

1. **Database** — managed Postgres via `DATABASE_URL`
2. **Evidence** — private Vercel Blob storage with SHA-256 evidence metadata in Postgres
3. **Identity** — demo or external production identity provider
4. **Notifications** — provider-neutral webhook delivery with database delivery logs

Operational records remain tenant/facility scoped. Evidence is never intentionally public in the v13 Vercel Blob path. The CI/CD chain remains preview branch → preflight → typecheck → Next.js build → Vercel bootstrap/link → preview deployment → smoke/release checks → controlled promotion.
