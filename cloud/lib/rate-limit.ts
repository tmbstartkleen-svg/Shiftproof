import 'server-only';
import crypto from 'node:crypto';
import { databaseConfigured, sql } from '@/lib/db';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: string;
};

type MemoryBucket = { hits: number; resetAt: number };
const globalBuckets = globalThis as typeof globalThis & { __shiftproofRateBuckets?: Map<string, MemoryBucket> };
const memoryBuckets = globalBuckets.__shiftproofRateBuckets || new Map<string, MemoryBucket>();
globalBuckets.__shiftproofRateBuckets = memoryBuckets;

function windowStart(windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / windowSeconds) * windowSeconds;
}

export function requestIp(request: Request) {
  const raw=(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0,24);
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const start = windowStart(windowSeconds);
  const resetEpoch = start + windowSeconds;
  let hits = 0;

  if (databaseConfigured()) {
    const rows = await sql()`
      insert into rate_limit_counters(bucket_key, window_start, hits)
      values(${key}, to_timestamp(${start}), 1)
      on conflict(bucket_key, window_start)
      do update set hits = rate_limit_counters.hits + 1
      returning hits
    `;
    hits = Number(rows[0]?.hits || 1);
  } else {
    const nowMs = Date.now();
    const existing = memoryBuckets.get(key);
    if (!existing || existing.resetAt <= nowMs) {
      memoryBuckets.set(key, { hits: 1, resetAt: resetEpoch * 1000 });
      hits = 1;
    } else {
      existing.hits += 1;
      hits = existing.hits;
    }
  }

  return {
    allowed: hits <= limit,
    limit,
    remaining: Math.max(0, limit - hits),
    retryAfter: Math.max(1, resetEpoch - Math.floor(Date.now() / 1000)),
    resetAt: new Date(resetEpoch * 1000).toISOString(),
  };
}
