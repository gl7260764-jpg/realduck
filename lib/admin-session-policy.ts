/**
 * How long an admin sign-in lasts. Shared by lib/auth.ts (which issues and checks
 * the session) and middleware.ts (which keeps the cookie alive). No imports, so the
 * edge middleware can read it.
 *
 * Owner: "once I log in on a device I should not need to log in again; tapping a
 * notification should take me straight to the admin panel."
 *
 *  - A session lasts 90 days and RENEWS itself. The AdminSession row's expiry is
 *    pushed out to a fresh 90 days at most once a day (one small write per device
 *    per day, never one per request, so Neon can still sleep). A device in use
 *    stays signed in; one left alone for 90 days has to sign in again.
 *  - The cookie is SameSite=Lax, not Strict. Strict cookies are not sent when the
 *    admin is opened from outside the site (a tap on an ntfy/Telegram notification
 *    opens it from another app), so every notification landed on the sign-in page.
 *    Lax still withholds the cookie from cross-site POSTs.
 *
 * Sign out one device: its Sign out button (deletes that row and the cookie).
 * Sign out EVERY device: delete all rows in the AdminSession table.
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
/** Renew at most once a day per device. */
export const ADMIN_SESSION_RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
    path: "/",
  };
}

/**
 * The new expiry for a valid session that is due for renewal, or null when the
 * session has expired or was renewed within the last day.
 */
export function renewedExpiry(expiresAt: Date, now: number = Date.now()): Date | null {
  const remaining = expiresAt.getTime() - now;
  if (remaining <= 0) return null;
  if (remaining > ADMIN_SESSION_TTL_MS - ADMIN_SESSION_RENEW_AFTER_MS) return null;
  return new Date(now + ADMIN_SESSION_TTL_MS);
}
