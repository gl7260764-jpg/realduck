import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.siteSetting.findMany();
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const allowedKeys = [
      "telegramOrder",
      "telegramChannel",
      "snapchatLink",
      "signalLink",
      "tiktokLink",
      "phoneNumber",
      "potatoChat",
      "telegramBotToken",
      "telegramChatId",
      "adminEmail",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPassword",
      "companyEmail",
    ];

    // Build upserts and deletes in a single transaction
    const operations = [];
    for (const key of allowedKeys) {
      if (typeof body[key] !== "string") continue;
      const trimmed = body[key].trim();
      if (trimmed) {
        // Non-empty value — upsert it
        operations.push(
          prisma.siteSetting.upsert({
            where: { key },
            update: { value: trimmed },
            create: { key, value: trimmed },
          })
        );
      } else {
        // Empty value — delete the setting so it reverts to default
        operations.push(
          prisma.siteSetting.deleteMany({ where: { key } })
        );
      }
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
