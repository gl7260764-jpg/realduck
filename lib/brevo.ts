// CRAFTED By W1C3
// Brevo (formerly Sendinblue) API client — dependency-free wrapper over fetch.
// Covers transactional email, contacts/lists, and email campaigns.
// All calls are best-effort: they return a result object and never throw into
// the request path, mirroring the Promise.allSettled style used across the app.
import prisma from "@/lib/prisma";

const BREVO_BASE = "https://api.brevo.com/v3";
const TIMEOUT_MS = 10000;

const DEFAULT_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contact@realduckdistro.com";
const DEFAULT_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Real Duck Distro";
// Replies must keep landing in the Hostinger inbox — receiving never moves to Brevo.
const DEFAULT_REPLY_TO = process.env.BREVO_SENDER_EMAIL || "contact@realduckdistro.com";

const LIST_SETTING_KEY = "brevoListId";
const LIST_NAME = "Newsletter Subscribers";

export function getBrevoApiKey(override?: string): string {
  return (override || process.env.BREVO_API_KEY || "").trim();
}

export function brevoEnabled(override?: string): boolean {
  return getBrevoApiKey(override).length > 0;
}

export interface BrevoResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

interface FetchOpts {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  apiKey?: string;
}

async function brevoFetch<T = unknown>(path: string, opts: FetchOpts): Promise<BrevoResult<T>> {
  const key = getBrevoApiKey(opts.apiKey);
  if (!key) return { ok: false, status: 0, error: "Brevo API key not configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BREVO_BASE + path, {
      method: opts.method,
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : "") || text || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg, data: data as T };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (err) {
    const aborted = (err as Error).name === "AbortError";
    return { ok: false, status: 0, error: aborted ? "Brevo request timed out" : (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Transactional email ──

export interface SendTransactionalArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  senderName?: string;
  senderEmail?: string;
  tags?: string[];
  apiKey?: string;
}

export async function sendTransactional(args: SendTransactionalArgs): Promise<BrevoResult> {
  const toList = (Array.isArray(args.to) ? args.to : [args.to])
    .filter(Boolean)
    .map((email) => ({ email }));
  if (toList.length === 0) return { ok: false, status: 0, error: "No recipient" };

  const body: Record<string, unknown> = {
    sender: {
      name: args.senderName || DEFAULT_SENDER_NAME,
      email: args.senderEmail || DEFAULT_SENDER_EMAIL,
    },
    to: toList,
    subject: args.subject,
    htmlContent: args.html,
    replyTo: { email: args.replyTo || DEFAULT_REPLY_TO },
  };
  if (args.tags && args.tags.length) body.tags = args.tags;

  return brevoFetch("/smtp/email", { method: "POST", body, apiKey: args.apiKey });
}

// ── Contacts ──

export async function upsertContact(
  email: string,
  attributes: Record<string, unknown> = {},
  listIds: number[] = [],
  apiKey?: string,
): Promise<BrevoResult> {
  const body: Record<string, unknown> = { email, updateEnabled: true };
  if (Object.keys(attributes).length) body.attributes = attributes;
  if (listIds.length) body.listIds = listIds;
  return brevoFetch("/contacts", { method: "POST", body, apiKey });
}

export interface ImportContact {
  email: string;
  attributes?: Record<string, unknown>;
}

// Bulk import (used by the admin "sync subscribers" action). Brevo accepts up
// to a few thousand contacts per call; callers batch as needed.
export async function importContacts(
  contacts: ImportContact[],
  listId: number,
  apiKey?: string,
): Promise<BrevoResult> {
  if (!contacts.length) return { ok: true, status: 204 };
  const body = {
    listIds: [listId],
    updateExistingContacts: true,
    emptyContactsAttributes: false,
    jsonBody: contacts.map((c) => ({ email: c.email, attributes: c.attributes || {} })),
  };
  return brevoFetch("/contacts/import", { method: "POST", body, apiKey });
}

// ── Lists ──

async function readCachedListId(): Promise<number | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LIST_SETTING_KEY } });
    if (row && /^\d+$/.test(row.value.trim())) return Number(row.value.trim());
  } catch {
    /* ignore */
  }
  return null;
}

async function cacheListId(id: number): Promise<void> {
  try {
    await prisma.siteSetting.upsert({
      where: { key: LIST_SETTING_KEY },
      update: { value: String(id) },
      create: { key: LIST_SETTING_KEY, value: String(id) },
    });
  } catch {
    /* ignore */
  }
}

interface BrevoList {
  id: number;
  name: string;
}

// Resolve (or lazily create) the newsletter contact list, caching its id in
// SiteSetting so we only hit the Brevo API once.
export async function getNewsletterListId(apiKey?: string): Promise<number | null> {
  const cached = await readCachedListId();
  if (cached) return cached;

  // Reuse an existing list with our name if one is already there.
  const lists = await brevoFetch<{ lists: BrevoList[] }>("/contacts/lists?limit=50&offset=0", {
    method: "GET",
    apiKey,
  });
  if (lists.ok && lists.data?.lists) {
    const found = lists.data.lists.find((l) => l.name === LIST_NAME);
    if (found) {
      await cacheListId(found.id);
      return found.id;
    }
  }

  // Otherwise create it inside the first available folder (default folder = 1).
  let folderId = 1;
  const folders = await brevoFetch<{ folders: { id: number }[] }>(
    "/contacts/folders?limit=10&offset=0",
    { method: "GET", apiKey },
  );
  if (folders.ok && folders.data?.folders?.length) folderId = folders.data.folders[0].id;

  const created = await brevoFetch<{ id: number }>("/contacts/lists", {
    method: "POST",
    body: { name: LIST_NAME, folderId },
    apiKey,
  });
  if (created.ok && created.data?.id) {
    await cacheListId(created.data.id);
    return created.data.id;
  }
  return null;
}

// ── Email campaigns ──

export interface CreateCampaignArgs {
  name: string;
  subject: string;
  html: string;
  listIds: number[];
  scheduledAt?: string; // ISO-8601 with timezone offset, e.g. 2026-06-10T09:00:00.000+00:00
  senderName?: string;
  senderEmail?: string;
  apiKey?: string;
}

// Creates a classic email campaign and either sends it immediately or leaves it
// scheduled. Returns the Brevo campaign id on success.
export async function createAndSendCampaign(
  args: CreateCampaignArgs,
): Promise<BrevoResult<{ id: number }>> {
  const body: Record<string, unknown> = {
    name: args.name,
    subject: args.subject,
    sender: {
      name: args.senderName || DEFAULT_SENDER_NAME,
      email: args.senderEmail || DEFAULT_SENDER_EMAIL,
    },
    type: "classic",
    htmlContent: args.html,
    recipients: { listIds: args.listIds },
  };
  if (args.scheduledAt) body.scheduledAt = args.scheduledAt;

  const created = await brevoFetch<{ id: number }>("/emailCampaigns", {
    method: "POST",
    body,
    apiKey: args.apiKey,
  });
  if (!created.ok || !created.data?.id) return created;

  const campaignId = created.data.id;

  // Schedule path is handled by Brevo via scheduledAt; only send-now needs the
  // explicit /sendNow trigger.
  if (!args.scheduledAt) {
    const sent = await brevoFetch(`/emailCampaigns/${campaignId}/sendNow`, {
      method: "POST",
      apiKey: args.apiKey,
    });
    if (!sent.ok) {
      return { ok: false, status: sent.status, error: sent.error, data: { id: campaignId } };
    }
  }
  return { ok: true, status: created.status, data: { id: campaignId } };
}
