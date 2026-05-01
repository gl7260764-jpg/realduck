/**
 * Cloudinary usage audit — READ ONLY.
 *
 * Connects to your Cloudinary account using CLOUDINARY_URL from .env,
 * enumerates every image + video, cross-references against URLs stored
 * in the database, and prints:
 *
 *   1. Total assets, total storage, breakdown by folder
 *   2. Top 20 largest individual assets
 *   3. Orphan count + reclaimable size (assets not referenced in DB)
 *   4. The first 30 orphan public_ids so you can spot-check
 *
 * Nothing is deleted. Run a delete script separately after reviewing.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "./lib/prisma";

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error("ERROR: CLOUDINARY_URL not set in .env");
  process.exit(1);
}
// Parse cloudinary://<api_key>:<api_secret>@<cloud_name> directly to dodge
// the SDK's import-order-dependent auto-config.
const urlMatch = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
if (!urlMatch) {
  console.error("ERROR: CLOUDINARY_URL format invalid (expected cloudinary://<key>:<secret>@<cloud_name>)");
  process.exit(1);
}
const [, apiKey, apiSecret, cloudName] = urlMatch;
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

interface Asset {
  public_id: string;
  resource_type: "image" | "video" | "raw";
  format: string;
  bytes: number;
  secure_url: string;
  folder?: string;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function listAll(resourceType: "image" | "video"): Promise<Asset[]> {
  const out: Asset[] = [];
  let next_cursor: string | undefined;
  do {
    const res: { resources: Asset[]; next_cursor?: string } = await cloudinary.api.resources({
      resource_type: resourceType,
      type: "upload",
      max_results: 500,
      next_cursor,
    });
    out.push(...res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);
  return out;
}

async function collectDbUrls(): Promise<Set<string>> {
  const referenced = new Set<string>();
  const add = (u: string | null | undefined) => {
    if (!u) return;
    // Strip any transformation segment so we can match by public_id later.
    referenced.add(u);
  };

  const products = await prisma.product.findMany({
    select: { imageUrl: true, images: true, videoUrl: true },
  });
  for (const p of products) {
    add(p.imageUrl);
    p.images.forEach(add);
    add(p.videoUrl);
  }

  const blogs = await prisma.blogPost.findMany({
    select: { imageUrl: true, images: true },
  });
  for (const b of blogs) {
    add(b.imageUrl);
    b.images.forEach(add);
  }

  const announcements = await prisma.announcement.findMany({
    select: { imageUrl: true },
  });
  for (const a of announcements) add(a.imageUrl);

  return referenced;
}

function publicIdFromUrl(url: string): string | null {
  // Cloudinary URLs look like:
  //   https://res.cloudinary.com/<cloud>/image/upload/<transforms?>/v<version>/<public_id>.<ext>
  // We want <public_id> (which may include a folder prefix like nobu_packs/abc123).
  const m = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (!m) return null;
  // Strip any transformation segments that slipped through (they contain commas).
  let id = m[1];
  // If first segment contains a comma, it was a transform — drop it.
  const parts = id.split("/");
  while (parts.length > 0 && parts[0].includes(",")) parts.shift();
  return parts.join("/") || null;
}

async function main() {
  console.log("Connecting to Cloudinary…\n");

  const [images, videos] = await Promise.all([listAll("image"), listAll("video")]);
  const all: Asset[] = [...images, ...videos];

  console.log(`Total assets: ${all.length}  (images: ${images.length}, videos: ${videos.length})`);
  const totalBytes = all.reduce((s, a) => s + (a.bytes || 0), 0);
  console.log(`Total storage: ${formatBytes(totalBytes)}\n`);

  // Folder breakdown
  const folderTotals = new Map<string, { count: number; bytes: number }>();
  for (const a of all) {
    const folder = a.folder || a.public_id.split("/").slice(0, -1).join("/") || "(root)";
    const cur = folderTotals.get(folder) || { count: 0, bytes: 0 };
    cur.count++;
    cur.bytes += a.bytes || 0;
    folderTotals.set(folder, cur);
  }
  console.log("Storage by folder:");
  console.log("─".repeat(80));
  const folders = [...folderTotals.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  for (const [folder, { count, bytes }] of folders) {
    console.log(`  ${formatBytes(bytes).padStart(10)}  ${String(count).padStart(5)} files  ${folder}`);
  }
  console.log();

  // Top 20 largest
  console.log("Top 20 largest assets:");
  console.log("─".repeat(80));
  const largest = [...all].sort((a, b) => (b.bytes || 0) - (a.bytes || 0)).slice(0, 20);
  for (const a of largest) {
    console.log(`  ${formatBytes(a.bytes).padStart(10)}  ${a.resource_type.padEnd(5)}  ${a.public_id}`);
  }
  console.log();

  // Orphan analysis
  console.log("Cross-referencing with database…");
  const dbUrls = await collectDbUrls();
  const dbPublicIds = new Set<string>();
  for (const url of dbUrls) {
    const id = publicIdFromUrl(url);
    if (id) dbPublicIds.add(id);
  }
  console.log(`DB references: ${dbUrls.size} URLs → ${dbPublicIds.size} unique public_ids\n`);

  const orphans = all.filter((a) => !dbPublicIds.has(a.public_id));
  const orphanBytes = orphans.reduce((s, a) => s + (a.bytes || 0), 0);
  console.log(`Orphans (in Cloudinary but NOT referenced in DB): ${orphans.length}`);
  console.log(`Reclaimable storage: ${formatBytes(orphanBytes)}  (${((orphanBytes / Math.max(totalBytes, 1)) * 100).toFixed(1)}% of total)\n`);

  if (orphans.length > 0) {
    console.log("First 30 orphans (spot-check before deleting):");
    console.log("─".repeat(80));
    const sample = [...orphans].sort((a, b) => (b.bytes || 0) - (a.bytes || 0)).slice(0, 30);
    for (const a of sample) {
      console.log(`  ${formatBytes(a.bytes).padStart(10)}  ${a.resource_type.padEnd(5)}  ${a.public_id}`);
    }
    console.log();
    console.log("Save the orphan list to a file for review? Re-run with: --save-orphans");
    if (process.argv.includes("--save-orphans")) {
      const fs = await import("fs/promises");
      const lines = orphans.map((a) => `${a.resource_type}\t${a.public_id}\t${a.bytes}`).join("\n");
      await fs.writeFile("./_cloudinary_orphans.tsv", lines + "\n");
      console.log("→ wrote ./_cloudinary_orphans.tsv");
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
