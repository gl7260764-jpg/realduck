import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Keepalive — a trivial query that keeps the (serverless, scale-to-zero) Neon
 * database warm. Ping this every ~5 minutes from an external uptime service
 * (e.g. cron-job.org, UptimeRobot) so the DB never fully sleeps, which prevents
 * cold-start failures on login and data-driven pages.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 503 });
  }
}
