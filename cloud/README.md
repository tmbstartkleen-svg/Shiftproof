# ShiftProof ONE Cloud v10

v10 is the activation build for the hosted SaaS edition.

## Added
- Managed Postgres migration runner and seed script
- Organization onboarding
- Facility creation
- Tenant administration dashboard
- Invitation creation with hashed one-time tokens and 7-day expiry
- Invitation acceptance that provisions users, organization memberships, and facility memberships
- Persistent plant_records table and tenant-scoped records API
- Provider-neutral identity adapter with demo fallback

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Database
```bash
npm run db:migrate
npm run db:seed
```

Set `DATABASE_URL` before running migrations. Without it, the web app uses demo fallback data.
