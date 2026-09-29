import 'server-only';
import { databaseStatus } from '@/lib/db';
import { identityStatus } from '@/lib/identity';

export function evidenceStatus() {
  const configured = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN);
  return {
    provider: configured ? 'vercel-blob-private' : 'demo-metadata',
    configured,
    privateStorage: configured,
  };
}

export function notificationStatus() {
  const configured = Boolean(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_URL);
  return {
    provider: configured ? 'webhook' : 'disabled',
    configured,
    bearerConfigured: Boolean(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN),
  };
}

export function liveServicesStatus() {
  const database = databaseStatus();
  const identity = identityStatus();
  const evidence = evidenceStatus();
  const notifications = notificationStatus();
  return {
    version: '13.0.0',
    database,
    identity,
    evidence,
    notifications,
    pilotReady: database.configured && evidence.configured,
    productionReady:
      database.configured &&
      evidence.configured &&
      identity.productionReady &&
      Boolean(process.env.SHIFTPROOF_SESSION_SECRET && process.env.SHIFTPROOF_SESSION_SECRET.length >= 32),
  };
}
