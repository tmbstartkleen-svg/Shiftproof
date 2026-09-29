# ShiftProof ONE v13 Deployment

## Required GitHub Actions secret

- `VERCEL_TOKEN`

## Runtime cloud-service variables

- `DATABASE_URL`
- `SHIFTPROOF_SESSION_SECRET`
- `SHIFTPROOF_DEMO_AUTH=false` for production
- `SHIFTPROOF_BASE_URL`
- `BLOB_READ_WRITE_TOKEN` or Vercel OIDC-backed Blob access
- `SHIFTPROOF_NOTIFICATION_WEBHOOK_URL` when notifications are enabled
- production identity provider variables when external identity is enabled

## Verification

The preview pipeline runs preflight, typecheck, Next.js build, Vercel bootstrap/deploy when authorized, smoke checks, release checks, and uploads a deployment report artifact.

The `/services` page shows database, evidence, identity, notification, pilot-readiness, and production-readiness status without exposing secret values.
