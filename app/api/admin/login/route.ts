import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyCredentials, cleanupExpiredSessions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.ip ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);

    // Rate limit: 5 attempts per minute, then block for 5 minutes
    const { allowed, retryAfter } = checkRateLimit(ip, 5, 60_000, 5 * 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in " + retryAfter + " seconds." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(username);
    await setSessionCookie(token);

    // Cleanup expired sessions in the background
    cleanupExpiredSessions().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
