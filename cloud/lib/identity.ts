export type IdentityMode='demo'|'oidc'|'authjs'|'clerk';
export function identityStatus(){const mode=(process.env.SHIFTPROOF_IDP_MODE||'demo') as IdentityMode;return {mode,productionReady:mode!=='demo',callbackPath:'/api/auth/callback',inviteProvisioning:'enabled'}}
