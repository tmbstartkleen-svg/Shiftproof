export type IdentityMode='demo'|'oidc'|'authjs'|'clerk';

export function identityStatus(){
  const mode=(process.env.SHIFTPROOF_IDP_MODE||'demo') as IdentityMode;
  const oidcConfigured=Boolean(process.env.SHIFTPROOF_IDP_ISSUER&&process.env.SHIFTPROOF_IDP_CLIENT_ID&&process.env.SHIFTPROOF_IDP_CLIENT_SECRET);
  const adapterConfigured=mode==='oidc'?oidcConfigured:mode==='authjs'||mode==='clerk';
  return {
    mode,
    configured: mode==='demo' ? true : adapterConfigured,
    productionReady: mode!=='demo' && adapterConfigured,
    callbackPath:'/api/auth/callback',
    inviteProvisioning:'enabled'
  };
}
