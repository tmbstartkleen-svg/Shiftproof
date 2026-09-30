export type IdentityMode='demo'|'neon'|'oidc'|'authjs'|'clerk';

export function identityStatus(){
  const demoAuth=process.env.SHIFTPROOF_DEMO_AUTH!=='false';
  const inferredMode:IdentityMode=!demoAuth&&process.env.NEON_AUTH_BASE_URL?'neon':'demo';
  const mode=(process.env.SHIFTPROOF_IDP_MODE||inferredMode) as IdentityMode;
  const neonConfigured=Boolean(process.env.NEON_AUTH_BASE_URL);
  const oidcConfigured=Boolean(process.env.SHIFTPROOF_IDP_ISSUER&&process.env.SHIFTPROOF_IDP_CLIENT_ID&&process.env.SHIFTPROOF_IDP_CLIENT_SECRET);
  const adapterConfigured=
    mode==='neon'?neonConfigured:
    mode==='oidc'?oidcConfigured:
    mode==='authjs'||mode==='clerk';

  return {
    mode,
    configured: mode==='demo' ? true : adapterConfigured,
    productionReady: mode!=='demo' && adapterConfigured,
    callbackPath: mode==='neon'?'/api/auth/callback':'/api/auth/callback',
    inviteProvisioning:'enabled'
  };
}
