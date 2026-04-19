import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/webpush";

// Process scheduled announcements — publish and push any that are due
// Called by Vercel Cron every 5 minutes (see vercel.json)
export async function GET(request: NextRequest) {
  // In production, verify the request comes from Vercel Cron
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const now = new Date();

    // Find announcements that are scheduled, not yet published, and due
    const due = await prisma.announcement.findMany({
      where: {
        scheduledAt: { lte: now },
        published: false,
      },
    });

    if (due.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let totalSent = 0;

    for (const announcement of due) {
      // Publish it
      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { published: true },
      });

      // Send push notification if not already pushed
      if (!announcement.pushed) {
        const subs = await prisma.pushSubscription.findMany({ where: { active: true } });

        const payload = {
          title: announcement.title,
          body: announcement.message,
          url: announcement.link || "/announcements",
          image: announcement.imageUrl || undefined,
          tag: `announcement-${announcement.id}`,
        };

        const deactivateIds: string[] = [];

        for (let i = 0; i < subs.length; i += 50) {
          await Promise.allSettled(
            subs.slice(i, i + 50).map(async (sub) => {
              const ok = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                payload
              );
              if (ok) totalSent++;
              else deactivateIds.push(sub.id);
            })
          );
        }

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
      }
    }

    return NextResponse.json({ processed: due.length, pushSent: totalSent });
  } catch (error) {
    console.error("Process announcements error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
