import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { fanOutPush } from "@/lib/webpush";
import { pingIndexNow } from "@/lib/indexNow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const a = await prisma.announcement.findUnique({ where: { id } });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(a);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const a = await prisma.announcement.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        message: body.message?.trim(),
        content: body.content?.trim(),
        imageUrl: body.imageUrl?.trim() || null,
        link: body.link?.trim() || null,
        published: body.published,
      },
    });

    // Re-push if requested
    if (body.sendPush) {
      const subs = await prisma.pushSubscription.findMany({ where: { active: true } });
      const payload = {
        title: a.title,
        body: a.message,
        url: a.link || "/announcements",
        image: a.imageUrl || undefined,
        tag: `announcement-${a.id}`,
      };

      const { goneIds } = await fanOutPush(subs, payload);

      if (goneIds.length > 0) {
        await prisma.pushSubscription.updateMany({
          where: { id: { in: goneIds } },
          data: { active: false },
        });
      }

      await prisma.announcement.update({
        where: { id },
        data: { pushed: true, pushSentAt: new Date() },
      });
    }

    if (a.published) {
      pingIndexNow([
        `${SITE_URL}/announcements`,
        `${SITE_URL}/announcements?id=${a.id}`,
        `${SITE_URL}/sitemap.xml`,
      ]).catch(() => {});
    }

    return NextResponse.json(a);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
