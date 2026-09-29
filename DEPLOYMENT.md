# ShiftProof ONE v11 Deployment

v11 adds a repeatable preview -> test -> promote deployment path.

## Required GitHub repository secrets

- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- SHIFTPROOF_SMOKE_EMAIL
- SHIFTPROOF_SMOKE_PASSWORD

## Vercel project configuration

- Framework: Next.js
- Root Directory: cloud
- Build Command: npm run build
- Install Command: npm install

## Preview testing

Push a branch named `preview/<name>` or run the `ShiftProof Preview Deploy` workflow manually.

The workflow runs:

1. npm ci
2. structural preflight
3. TypeScript typecheck
4. Next.js build
5. Vercel prebuild
6. preview deploy
7. live smoke test against /api/health, /api/readiness, login, and /api/auth/me

## Production promotion

Run `ShiftProof Production Promote` manually with a validated preview URL and `PROMOTE` confirmation. It smoke-tests that exact URL again before calling `vercel promote`.
