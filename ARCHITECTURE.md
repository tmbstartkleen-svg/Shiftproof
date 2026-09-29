# ShiftProof ONE v12 Architecture

v12 preserves the dual-edition architecture: the repository root remains the local pilot application while `cloud/` is the Next.js SaaS edition.

The deployment layer now has a full promotion chain:

GitHub preview branch → preflight → typecheck → Next.js build → Vercel project bootstrap/link → Vercel preview build → preview deploy → smoke/release checks → deployment artifact → controlled promotion.

The Vercel project name and team scope are configuration, not secrets. The deployment token remains secret. Cloud runtime secrets such as database credentials and production identity credentials remain Vercel environment variables and are never committed.
