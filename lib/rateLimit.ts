// In-memory rate limiter for serverless — no external deps required.
// Tracks attempts per key (IP) with sliding window cleanup.

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    // Remove entries whose window and block have both expired
    if (now > entry.blockedUntil && now - entry.firstAttempt > 60_000) {
      store.delete(key);
    }
  }
}

/**
 * Check if a key (usually IP) is rate limited.
 * @param key - Identifier (IP address)
 * @param maxAttempts - Max attempts allowed in the window (default: 5)
 * @param windowMs - Time window in ms (default: 60 seconds)
 * @param blockMs - How long to block after exceeding limit (default: 5 minutes)
 * @returns { allowed: boolean, retryAfter?: number (seconds) }
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000,
  blockMs = 5 * 60_000
): { allowed: boolean; retryAfter?: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  // No previous attempts
  if (!entry) {
    store.set(key, { attempts: 1, firstAttempt: now, blockedUntil: 0 });
    return { allowed: true };
  }

  // Currently blocked
  if (entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Window expired — reset
  if (now - entry.firstAttempt > windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now, blockedUntil: 0 });
    return { allowed: true };
  }

  // Within window — increment
  entry.attempts++;

  // Exceeded limit — block
  if (entry.attempts > maxAttempts) {
    entry.blockedUntil = now + blockMs;
    const retryAfter = Math.ceil(blockMs / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}
