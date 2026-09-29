# ShiftProof ONE v8 Architecture

## Editions
1. Local Pilot Edition: Python + SQLite for plant pilots and offline/local use.
2. Cloud SaaS Edition: Next.js App Router + Postgres-ready repository for multi-tenant hosting.

## Cloud security boundary
Browser -> signed HTTP-only session -> organization context -> facility allow-list -> role capability -> route handler/repository.

Demo auth is preview-only and separable from the future production identity provider.

## Cloud data plane
Postgres stores organizations, identity mappings, memberships, facilities, evidence metadata, integration events, and audit events. Binary evidence belongs in external blob/object storage with SHA-256 retained in metadata.