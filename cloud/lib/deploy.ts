import 'server-only';

export function deploymentControlStatus() {
  const orgId = process.env.VERCEL_ORG_ID || '';
  const projectId = process.env.VERCEL_PROJECT_ID || '';
  const vercelEnv = process.env.VERCEL_ENV || '';
  const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local';
  return {
    version: '13.0.0',
    environment: vercelEnv || process.env.NODE_ENV || 'local',
    commit,
    deploymentUrl,
    configured: {
      vercelProject: Boolean(orgId && projectId),
      organizationId: Boolean(orgId),
      projectId: Boolean(projectId),
      database: Boolean(process.env.DATABASE_URL),
      sessionSecret: Boolean(process.env.SHIFTPROOF_SESSION_SECRET && process.env.SHIFTPROOF_SESSION_SECRET.length >= 32),
      externalIdentity: process.env.SHIFTPROOF_IDENTITY_PROVIDER && process.env.SHIFTPROOF_IDENTITY_PROVIDER !== 'demo'
        ? true
        : false,
    },
  };
}
