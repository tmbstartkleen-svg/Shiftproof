# ShiftProof Cloud Migration - v13

v13 turns the cloud scaffold into an activatable service stack.

Recommended activation order:

1. add `VERCEL_TOKEN` to GitHub Actions
2. deploy a green preview to `shiftproof-one`
3. attach managed Postgres and set `DATABASE_URL`
4. run `npm run db:migrate`
5. run `npm run db:seed`
6. attach a private Vercel Blob store
7. set production identity configuration and disable demo auth
8. configure the notification provider webhook
9. use `/services`, `/api/readiness`, and `/api/deployment/status` to verify activation
10. smoke-test a preview and promote that exact artifact
