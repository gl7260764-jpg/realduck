import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAccount,
  getSession,
  isAuthenticated,
  updateAdminAccount,
  verifyCredentials,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

// GET: the current admin username and where it comes from ("database" once it has
// been changed from the panel, "env" while still on the ADMIN_* env vars).
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const account = await getAdminAccount();
    return NextResponse.json({ username: account?.username ?? "", source: account?.source ?? "env" });
  } catch (error) {
    console.error("Error reading admin account:", error);
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
  }
}

// PUT: change username and/or password. Always requires the current password.
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
  const { allowed, retryAfter } = checkRateLimit(`account:${ip}`, 5, 60_000, 5 * 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newUsernameRaw = typeof body.newUsername === "string" ? body.newUsername.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword) {
      return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
    }

    const account = await getAdminAccount();
    if (!account || !(await verifyCredentials(account.username, currentPassword))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }

    const username = newUsernameRaw || account.username;
    if (username.length < 3 || username.length > 64 || /\s/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–64 characters with no spaces." },
        { status: 400 }
      );
    }

    if (newPassword && (newPassword.length < 8 || newPassword.length > 200)) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (username === account.username && !newPassword) {
      return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
    }

    // Keep the current password if only the username changes.
    const password = newPassword || currentPassword;
    await updateAdminAccount(username, password, await getSession());

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Admin account update error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
