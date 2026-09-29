# ShiftProof ONE v14 — Pilot Hardening

v14 is the controlled-pilot hardening build. It adds database-backed rate limiting, audit exports, application-level recovery exports, structured operational logging, automated permission-matrix tests, security headers, mobile metadata, a pilot-readiness dashboard, and a deployment workflow that always emits a diagnostic report even when Vercel authorization fails.

The application backup export is an application-level JSON recovery package. It does not claim to be a physical PostgreSQL backup or a backup of private Blob bytes.
