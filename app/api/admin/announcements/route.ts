import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendPushNotification } from "@/lib/webpush";

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    if (!body.title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!body.message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title.trim(),
        message: body.message.trim(),
        content: body.content?.trim() || body.message.trim(),
        imageUrl: body.imageUrl?.trim() || null,
        link: body.link?.trim() || null,
        published: isScheduled ? false : (body.published ?? false),
        scheduledAt: scheduledAt || null,
      },
    });

    // If sendPush flag is set, send push notification to all active subscribers
    if (body.sendPush) {
      const subs = await prisma.pushSubscription.findMany({
        where: { active: true },
      });

      const payload = {
        title: announcement.title,
        body: announcement.message,
        url: announcement.link || "/announcements",
        image: announcement.imageUrl || undefined,
        tag: `announcement-${announcement.id}`,
      };

      let sent = 0;
      let failed = 0;
      const deactivateIds: string[] = [];

      // Send in batches of 50
      for (let i = 0; i < subs.length; i += 50) {
        const batch = subs.slice(i, i + 50);
        await Promise.allSettled(
          batch.map(async (sub) => {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload
            );
            if (ok) {
              sent++;
            } else {
              failed++;
              deactivateIds.push(sub.id);
            }
          })
        );
      }

      // Deactivate all invalid subscriptions in one query
      if (deactivateIds.length > 0) {
        await prisma.pushSubscription.updateMany({
          where: { id: { in: deactivateIds } },
          data: { active: false },
        });
      }

      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { pushed: true, pushSentAt: new Date() },
      });

      return NextResponse.json({
        ...announcement,
        pushed: true,
        pushStats: { sent, failed, total: subs.length },
      });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
