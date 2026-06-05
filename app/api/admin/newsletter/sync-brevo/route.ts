// CRAFTED By W1C3
// One-shot bulk sync: push all active newsletter subscribers into the Brevo
// contact list so campaigns can target them. Idempotent (updates existing).
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAdminConfig } from "@/lib/adminConfig";
import { brevoEnabled, getNewsletterListId, importContacts } from "@/lib/brevo";

const BATCH_SIZE = 500;

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getAdminConfig();
  if (!brevoEnabled(config.brevoApiKey)) {
    return NextResponse.json(
      { error: "Brevo is not configured. Add your API key in Settings first." },
      { status: 400 },
    );
  }

  const listId = await getNewsletterListId(config.brevoApiKey);
  if (!listId) {
    return NextResponse.json(
      { error: "Could not resolve the Brevo contact list." },
      { status: 502 },
    );
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { email: true, source: true, country: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, listId });
  }

  let synced = 0;
  const failures: string[] = [];
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const res = await importContacts(
      batch.map((s) => ({
        email: s.email,
        attributes: { SOURCE: s.source || "", COUNTRY: s.country || "" },
      })),
      listId,
      config.brevoApiKey,
    );
    if (res.ok) synced += batch.length;
    else failures.push(res.error || `batch ${i / BATCH_SIZE} failed`);
  }

  return NextResponse.json({
    ok: failures.length === 0,
    synced,
    total: subscribers.length,
    listId,
    errors: failures,
  });
}
