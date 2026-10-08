// In-memory throttle for the admin session-mint POST. The admin app has no
// rate-limit dependency; this route is the only anonymous state-changing
// endpoint that mints a cookie, so a small local guard beats a new dep.
// 20 attempts per 15 minutes per IP — forgery is impossible without a valid
// Supabase JWT, this only bounds log spam and cookie-minting probes.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const buckets = new Map<string, { start: number; count: number }>();

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

export function checkSessionMintLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  return bucket.count <= MAX_ATTEMPTS;
}

// Test-only reset. Not used by route code.
export function resetSessionMintLimits() {
  buckets.clear();
}

export const SESSION_MINT_LIMIT = { WINDOW_MS, MAX_ATTEMPTS };
