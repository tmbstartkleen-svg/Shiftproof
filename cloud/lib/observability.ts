import 'server-only';
import crypto from 'node:crypto';

export function requestContext(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return {
    requestId: request.headers.get('x-vercel-id') || request.headers.get('x-request-id') || crypto.randomUUID(),
    ipHash: crypto.createHash('sha256').update(forwarded.split(',')[0].trim()).digest('hex').slice(0,24),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export function logOperationalEvent(event: string, detail: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ type: 'shiftproof.operational', event, at: new Date().toISOString(), ...detail }));
}

export function logOperationalError(event: string, error: unknown, detail: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ type: 'shiftproof.error', event, at: new Date().toISOString(), message, ...detail }));
}
