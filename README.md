# ShiftProof ONE v12

v12 is the live-infrastructure bootstrap build. The cloud application can now validate itself, create or find its dedicated Vercel project from CI, link that project, build a preview artifact, deploy it, smoke-test the live URL, save a deployment report, and promote the exact tested artifact.

## Main v12 change

The preview workflow now needs only one sensitive GitHub Actions secret:

- `VERCEL_TOKEN`

The workflow defaults to:

- Vercel scope: `tblevins-1457s-projects`
- Vercel project: `shiftproof-one`
- Project root: `cloud/`

`VERCEL_SCOPE` and `VERCEL_PROJECT_NAME` may be overridden with GitHub repository variables, but they are not secrets.

## Deployment sequence

1. Install dependencies
2. Structural preflight
3. TypeScript validation
4. Next.js production build
5. Verify Vercel authorization
6. Create/find `shiftproof-one`
7. Link the cloud directory
8. Pull preview environment
9. Vercel prebuild
10. Preview deploy
11. Login/session smoke test
12. Health/readiness/deployment endpoint checks
13. Upload deployment result artifact
14. Promote the exact validated preview through the production workflow

See `DEPLOYMENT.md` for the operational flow.
