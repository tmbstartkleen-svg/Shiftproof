import 'server-only';
import { databaseStatus } from '@/lib/db';
import { identityStatus } from '@/lib/identity';
import { evidenceStatus, notificationStatus } from '@/lib/services';

export function deploymentReadiness() {
  const database = databaseStatus();
  const identity = identityStatus();
  const evidence = evidenceStatus();
  const notifications = notificationStatus();
  const sessionSecret = Boolean(process.env.SHIFTPROOF_SESSION_SECRET && process.env.SHIFTPROOF_SESSION_SECRET.length >= 32);
  const baseUrl = process.env.SHIFTPROOF_BASE_URL || '';
  const demoAuth = process.env.SHIFTPROOF_DEMO_AUTH !== 'false';
  const previewReady = sessionSecret || demoAuth;
  const productionReady = Boolean(database.configured && evidence.configured && identity.productionReady && sessionSecret && baseUrl.startsWith('https://') && !demoAuth);
  return {
    version: '13.0.0',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
    previewReady,
    productionReady,
    checks: {
      database: database.configured,
      privateEvidence: evidence.configured,
      productionIdentity: identity.productionReady,
      notificationProvider: notifications.configured,
      sessionSecret,
      secureBaseUrl: baseUrl.startsWith('https://'),
      demoAuth
    }
  };
}
