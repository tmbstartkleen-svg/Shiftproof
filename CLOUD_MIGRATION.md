# ShiftProof Cloud Migration - v12

v12 closes the CI/CD bootstrap gap. Once `VERCEL_TOKEN` is present in GitHub Actions, the pipeline can provision or locate the `shiftproof-one` Vercel project and deploy/test previews without manually copying project IDs into the repository.

Next infrastructure activation after the first preview is live:

1. attach managed Postgres
2. set `DATABASE_URL`
3. run migrations and seed the first tenant
4. configure a production identity provider
5. disable demo auth for production
6. configure evidence storage and notifications
7. run a validated preview and promote that exact artifact
