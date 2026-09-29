# ShiftProof Cloud Migration - v11

1. Create a dedicated Vercel ShiftProof project with Root Directory `cloud`.
2. Add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID to GitHub repository secrets.
3. Add ShiftProof preview credentials to GitHub secrets for live smoke tests.
4. Configure a managed Postgres DATABASE_URL in Vercel.
5. Configure a 32+ character SHIFTPROOF_SESSION_SECRET.
6. Configure SHIFTPROOF_BASE_URL to the HTTPS deployment URL.
7. Keep SHIFTPROOF_DEMO_AUTH=true for preview testing; disable it for production identity cutover.
8. Run database migrations and seed/bootstrap the first owner.
9. Use the preview workflow for every deployment candidate.
10. Promote only a preview URL that passes the live smoke suite.
