# ShiftProof ONE v10 Architecture

## Tenant hierarchy
Organization -> Facility -> Department -> Line -> Asset -> Plant Record / Evidence / Event.

## Activation flow
1. Deploy cloud app.
2. Configure DATABASE_URL and session secret.
3. Run migrations.
4. Seed/bootstrap first owner or connect external identity provider.
5. Create organization/facilities.
6. Invite managers and supervisors.
7. Invitation acceptance provisions user + organization membership + optional facility membership.
8. Plant events persist to tenant-scoped plant_records.

## Safety boundaries
- HTTP-only signed sessions in preview mode.
- Organization and facility scope enforced server-side.
- Invitation tokens are never stored in plaintext; only SHA-256 hashes persist.
- Demo auth can be disabled independently from the production IdP adapter.
