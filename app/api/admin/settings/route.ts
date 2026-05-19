import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ALL_CATEGORIES, invalidateHiddenCategoriesCache } from "@/lib/categoryVisibility";

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

    // Hidden categories — accepted as array of enum names; stored as CSV.
    // Invalid entries silently dropped. Empty list → delete the row.
    let hiddenCategoriesTouched = false;
    if (Array.isArray(body.hiddenCategories)) {
      hiddenCategoriesTouched = true;
      const valid = body.hiddenCategories
        .filter((v: unknown): v is string => typeof v === "string")
        .filter((v: string) => (ALL_CATEGORIES as readonly string[]).includes(v));
      const csv = Array.from(new Set(valid)).join(",");
      if (csv) {
        operations.push(
          prisma.siteSetting.upsert({
            where: { key: "hiddenCategories" },
            update: { value: csv },
            create: { key: "hiddenCategories", value: csv },
          })
        );
      } else {
        operations.push(prisma.siteSetting.deleteMany({ where: { key: "hiddenCategories" } }));
      }
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
    if (hiddenCategoriesTouched) invalidateHiddenCategoriesCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
