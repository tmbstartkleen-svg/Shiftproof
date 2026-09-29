# ShiftProof ONE Cloud v8

The v8 cloud edition is the first authenticated hosted-preview architecture.

## What changed
- Signed, expiring HTTP-only cloud sessions
- Tenant-scoped session context
- Facility allow-list enforcement
- Role/capability authorization
- Protected enterprise, facility, and Ask-the-Plant APIs
- Managed Postgres adapter using `postgres`
- Expanded Postgres schema for identity, facilities, evidence, integrations, and audits
- Token-protected connector webhook endpoint
- Optional OpenAI-compatible Shift Commander provider with grounded fallback

## Preview credentials
When `SHIFTPROOF_DEMO_AUTH=true`, defaults are:
- `plantmanager@demo.local`
- `1111`

Before a production launch, set `SHIFTPROOF_DEMO_AUTH=false`, provide a strong `SHIFTPROOF_SESSION_SECRET`, and connect a real identity provider.

## Run
```bash
npm install
npm run typecheck
npm run build
npm run dev
```