# ShiftProof ONE v14 Deployment

Preview CI validates the Vercel token separately and always uploads deployment-result.json. With valid authorization the sequence is: preflight → typecheck → permission tests → Next.js build → Vercel auth → project create/link → Vercel prebuild → preview deploy → login smoke test → release checks → recovery checks → deployment artifact.
