import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  adminSessionCookieOptions,
  renewedExpiry,
} from "@/lib/admin-session-policy";

// 90 days, renewed at most once a day while the device is in use, so the owner
// stays signed in on a device. See lib/admin-session-policy.ts.
const SESSION_MAX_AGE_MS = ADMIN_SESSION_TTL_MS;

// ── Create a cryptographically secure session stored in DB ──

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Neon (serverless) scales to zero when idle, so the first write can fail with
  // a connection error while the DB wakes. Retry briefly so a cold-start recovers
  // instead of erroring the admin out of login.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.adminSession.create({ data: { token, username, expiresAt } });
      return token;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// ── Read the session cookie ──

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
}

// ── Set the session cookie ──

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  // Lax, not Strict: a tap on a notification opens the admin from another app, and
  // Strict cookies are not sent then. See lib/admin-session-policy.ts.
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
}

// ── Clear the session cookie AND delete from DB ──

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  // Delete from DB so the token can never be reused
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } }).catch(() => {});
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

// ── Validate session against DB — checks token exists and hasn't expired ──

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSession();
  if (!token) return false;

  try {
    const session = await prisma.adminSession.findUnique({
      where: { token },
    });

    if (!session) return false;

    // Check expiry
    if (session.expiresAt < new Date()) {
      // Expired — clean up
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
      return false;
    }

    // Sliding renewal: a session last renewed more than a day ago gets a fresh 90
    // days. At most one write per device per day. A failed write is not a sign-out.
    const nextExpiry = renewedExpiry(session.expiresAt);
    if (nextExpiry) {
      await prisma.adminSession
        .update({ where: { id: session.id }, data: { expiresAt: nextExpiry } })
        .catch(() => {});
    }

    return true;
  } catch {
    return false;
  }
}

// ── Verify admin credentials ──

export function verifyCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD env vars are not set");
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  const usernameMatch =
    adminUsername.length === username.length &&
    crypto.timingSafeEqual(Buffer.from(adminUsername), Buffer.from(username));

  const passwordMatch =
    adminPassword.length === password.length &&
    crypto.timingSafeEqual(Buffer.from(adminPassword), Buffer.from(password));

  return usernameMatch && passwordMatch;
}

// ── Cleanup expired sessions (call periodically) ──

export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => {});
}
