# ShiftProof ONE v7 Cloud Migration

v7 establishes a dual-edition architecture:

- **Local Pilot Edition**: existing Python + SQLite application at repository root.
- **Cloud SaaS Edition**: Next.js application under `cloud/` intended for Vercel.

## Migration sequence

1. Deploy `cloud/` as a preview project.
2. Provision managed Postgres and apply `cloud/db/schema.sql`.
3. Configure production authentication and tenant membership mapping.
4. Move evidence blobs from local `uploads/` into managed object storage.
5. Replace demo repository adapters with Postgres repositories.
6. Connect email/push providers.
7. Enable a production LLM provider for Shift Commander while preserving deterministic fallback.
8. Add customer onboarding and billing only after tenant isolation tests pass.

No secrets are committed. Vercel/GitHub credentials must remain in provider secret stores.