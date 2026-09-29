# ShiftProof ONE v13

v13 is the live-services activation build. It extends the green v12 deployment gate with managed-Postgres activation, private evidence storage, notification-provider delivery logging, persistent plant records, and a service-readiness control plane.

## v13 live services

- managed Postgres through `DATABASE_URL`
- migration/seed workflow
- tenant-scoped persistent plant records
- private Vercel Blob evidence uploads
- SHA-256 evidence fingerprints + database metadata
- notification webhook provider + delivery audit records
- production identity readiness hooks
- `/services` live-services control page
- `/api/services/status`
- `/api/facilities/[facilityId]/evidence`
- `/api/notifications/test`

The v12 preview/build/promotion pipeline remains in place. If the repository has `VERCEL_TOKEN`, preview branches can continue through a real Vercel deployment; otherwise the build/test gate still runs and reports the missing credential boundary explicitly.
