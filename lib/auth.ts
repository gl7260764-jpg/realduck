import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── Create a cryptographically secure session stored in DB ──

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.adminSession.create({
    data: { token, username, expiresAt },
  });

  return token;
}

// ── Read the session cookie ──

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
}

// ── Set the session cookie ──

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_MS / 1000, // 4 hours in seconds
    path: "/",
  });
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
