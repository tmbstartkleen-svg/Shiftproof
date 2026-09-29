import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  facilityIds: string[];
  exp: number;
};

const COOKIE = "sp_cloud_session";
const TWELVE_HOURS = 60 * 60 * 12;

function secret() {
  return process.env.SHIFTPROOF_SESSION_SECRET || "shiftproof-preview-only-change-before-production";
}

function b64url(input: string) {
  return Buffer.from(input).toString("base64url");
}
function unb64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}
function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(session: Omit<Session, "exp">) {
  const body: Session = { ...session, exp: Math.floor(Date.now() / 1000) + TWELVE_HOURS };
  const payload = b64url(JSON.stringify(body));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const body = JSON.parse(unb64url(payload)) as Session;
    if (body.exp <= Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWELVE_HOURS
  };
}

export function clearSessionCookie() {
  return { name: COOKIE, value: "", path: "/", maxAge: 0 };
}

export function demoAuthEnabled() {
  return process.env.SHIFTPROOF_DEMO_AUTH !== "false";
}

export function validateDemoCredentials(email: string, password: string) {
  if (!demoAuthEnabled()) return null;
  const expectedEmail = process.env.SHIFTPROOF_DEMO_EMAIL || "plantmanager@demo.local";
  const expectedPassword = process.env.SHIFTPROOF_DEMO_PASSWORD || "1111";
  const okEmail = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
  const a = Buffer.from(password);
  const b = Buffer.from(expectedPassword);
  const okPassword = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!okEmail || !okPassword) return null;
  return {
    userId: "u_pm",
    email: expectedEmail,
    name: "Morgan Reed",
    role: "Plant Manager",
    organizationId: "org_demo",
    facilityIds: ["central", "north", "south"]
  };
}

export function authReadiness() {
  return {
    mode: demoAuthEnabled() ? "signed-preview-demo" : "external-idp-required",
    sessionSecretConfigured: Boolean(process.env.SHIFTPROOF_SESSION_SECRET),
    productionReady: Boolean(process.env.SHIFTPROOF_SESSION_SECRET) && !demoAuthEnabled()
  };
}