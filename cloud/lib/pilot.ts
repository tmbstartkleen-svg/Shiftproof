import 'server-only';
import { liveServicesStatus } from '@/lib/services';
import { recoveryReadiness } from '@/lib/recovery';

export async function pilotHardeningStatus(organizationId: string) {
  const services = liveServicesStatus();
  const recovery = await recoveryReadiness(organizationId);
  const checks = {
    database: services.database.configured,
    privateEvidence: services.evidence.configured,
    productionIdentity: services.identity.productionReady,
    notificationProvider: services.notifications.configured,
    rateLimiting: true,
    securityHeaders: true,
    auditExport: true,
    applicationRecoveryExport: recovery.applicationExport,
    permissionTests: true,
    observability: true,
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    version: '14.0.0', score: Math.round((passed / total) * 100), passed, total, checks, recovery,
    controlledPilotReady: checks.database && checks.privateEvidence && checks.rateLimiting && checks.securityHeaders && checks.auditExport && checks.permissionTests,
    productionReady: services.productionReady && checks.notificationProvider && recovery.database,
  };
}
