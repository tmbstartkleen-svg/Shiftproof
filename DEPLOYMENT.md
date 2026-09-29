# ShiftProof ONE v12 Deployment

## Required GitHub secret

`VERCEL_TOKEN`

That is the only credential required by the v12 preview workflow. Do not commit the token.

## Optional repository variables

- `VERCEL_SCOPE` — defaults to `tblevins-1457s-projects`
- `VERCEL_PROJECT_NAME` — defaults to `shiftproof-one`

## Preview testing

Push a commit to any `preview/**` branch. The `ShiftProof Preview Deploy` workflow will validate and build the app. If `VERCEL_TOKEN` is available, it will also create/find the Vercel project, link it, deploy a preview, smoke-test the live URL, and upload `deployment-result.json` as a workflow artifact.

## Production promotion

Use the `ShiftProof Production Promote` workflow. Provide the validated preview URL and type `PROMOTE`. The workflow re-runs smoke and release checks against that exact URL before promotion.

## Local Vercel bootstrap

From `cloud/`:

```bash
export VERCEL_TOKEN='<token>'
npm run vercel:bootstrap -- --apply
```

Without `--apply`, the command is a dry run and prints the commands it would execute.

## Test endpoints

- `/api/health`
- `/api/readiness`
- `/api/deployment/status`
- `/api/auth/login`
- `/api/auth/me`
