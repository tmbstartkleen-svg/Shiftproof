import "server-only";

export type IdentityProvider = "demo" | "oidc" | "authjs" | "clerk";

export function identityStatus() {
  const provider = (process.env.SHIFTPROOF_IDENTITY_PROVIDER || "demo") as IdentityProvider;
  return {
    provider,
    demo: provider === "demo",
    configured: provider === "demo" || Boolean(process.env.SHIFTPROOF_IDENTITY_ISSUER),
    issuer: process.env.SHIFTPROOF_IDENTITY_ISSUER || null
  };
}

export function externalIdentityReady() {
  const status = identityStatus();
  return status.provider !== "demo" && status.configured;
}