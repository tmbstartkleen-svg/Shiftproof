import 'server-only';
import {databaseStatus} from '@/lib/db';
import {identityStatus} from '@/lib/identity';

export function evidenceStatus(){
  const configured=Boolean(process.env.BLOB_READ_WRITE_TOKEN||process.env.VERCEL_OIDC_TOKEN);
  return {provider:configured?'vercel-blob-private':'demo-metadata',configured,privateStorage:configured};
}

export function notificationStatus(){
  const resendConfigured=Boolean(process.env.RESEND_API_KEY&&process.env.SHIFTPROOF_NOTIFICATION_FROM);
  const webhookConfigured=Boolean(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_URL);
  const configured=resendConfigured||webhookConfigured;
  const provider=resendConfigured?'resend':webhookConfigured?'webhook':'disabled';
  return {
    provider,
    configured,
    resendConfigured,
    webhookConfigured,
    bearerConfigured:Boolean(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN)
  };
}

export function liveServicesStatus(){
  const database=databaseStatus(),identity=identityStatus(),evidence=evidenceStatus(),notifications=notificationStatus();
  return {
    version:'18.0.0',
    database,identity,evidence,notifications,
    hardening:{
      rateLimiting:true,
      auditExport:true,
      applicationBackupExport:true,
      securityHeaders:true,
      permissionTests:true,
      structuredLogging:true
    },
    pilotReady:database.configured&&evidence.configured,
    productionReady:database.configured&&evidence.configured&&identity.productionReady&&Boolean(process.env.SHIFTPROOF_SESSION_SECRET&&process.env.SHIFTPROOF_SESSION_SECRET.length>=32)
  };
}
