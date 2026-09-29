# ShiftProof ONE v11

ShiftProof ONE v11 is the deployment and test-gate build. It preserves the local pilot edition at the repository root and advances the `cloud/` Next.js SaaS edition toward repeatable preview deployments and controlled production promotion.

## v11 focus

- Deployment readiness endpoint and UI
- Structural preflight checks
- Live preview smoke tests
- GitHub Actions preview deployment workflow
- Separate manual production promotion workflow
- Exact-artifact preview -> test -> promote flow
- Managed Postgres, onboarding, invitations, tenant isolation, and plant-record persistence retained from v10

## Cloud deployment root

Set the Vercel Root Directory to `cloud`.

See `DEPLOYMENT.md` for the required Vercel/GitHub configuration.
