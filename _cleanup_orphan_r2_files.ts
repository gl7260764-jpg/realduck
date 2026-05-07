/**
 * Delete R2 files in realduck-media that are NOT referenced by any current
 * row in the realduck database. This frees up space from previously-deleted
 * products without ever touching files that are still in use.
 *
 * Sources of "referenced" URLs:
 *   • Product.imageUrl, Product.images[], Product.videoUrl
 *   • BlogPost.imageUrl, BlogPost.images[]
 *   • Announcement.imageUrl
 *
 * Default = dry run; pass --apply to delete.
 *
 *   npx tsx ./_cleanup_orphan_r2_files.ts          # preview
 *   npx tsx ./_cleanup_orphan_r2_files.ts --apply  # delete
 *
 * Safety:
 *   • Hardcoded to the realduck-media bucket (R2_BUCKET env). If the env
 *     points at a different bucket, the script aborts.
 *   • Only deletes files NOT referenced. New products you've added since
 *     the deletions are protected automatically.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

const endpoint = process.env.R2_ENDPOINT!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;
const publicUrlBase = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

if (bucket !== "realduck-media") {
  console.error(`Refusing to run — R2_BUCKET="${bucket}" is not "realduck-media".`);
  console.error("This script is hardcoded for realduck only.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Extract the R2 key from a public URL. Returns null if URL isn't from this bucket's host. */
function urlToKey(url: string): string | null {
  if (!url) return null;
  if (!publicUrlBase) return null;
  if (!url.startsWith(publicUrlBase + "/")) return null;
  return url.slice(publicUrlBase.length + 1);
}

async function listAllObjects() {
  const items: { Key: string; Size: number }[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
    );
    for (const o of res.Contents || []) {
      if (o.Key && o.Size !== undefined) items.push({ Key: o.Key, Size: o.Size });
    }
    token = res.NextContinuationToken;
  } while (token);
  return items;
}

async function collectReferencedKeys(): Promise<Set<string>> {
  const referenced = new Set<string>();
  const add = (url: string | null | undefined) => {
    if (!url) return;
    const k = urlToKey(url);
    if (k) referenced.add(k);
  };

  const products = await prisma.product.findMany({
    select: { imageUrl: true, images: true, videoUrl: true, slug: true },
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

  const anns = await prisma.announcement.findMany({
    select: { imageUrl: true },
  });
  for (const a of anns) add(a.imageUrl);

  return referenced;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (deleting)" : "DRY RUN"}`);
  console.log(`Bucket: ${bucket}`);
  console.log(`Public URL base: ${publicUrlBase}\n`);

  console.log("Scanning bucket…");
  const allObjects = await listAllObjects();
  const totalBytes = allObjects.reduce((s, o) => s + o.Size, 0);
  console.log(`  ${allObjects.length} files, ${formatBytes(totalBytes)} total`);

  console.log("Collecting referenced URLs from realduck DB…");
  const referenced = await collectReferencedKeys();
  console.log(`  ${referenced.size} unique R2 keys still referenced\n`);

  const orphans = allObjects.filter((o) => !referenced.has(o.Key));
  const orphanBytes = orphans.reduce((s, o) => s + o.Size, 0);

  console.log(`Orphans (in bucket, not referenced anywhere in DB): ${orphans.length}`);
  console.log(`Reclaimable: ${formatBytes(orphanBytes)}  (${((orphanBytes / Math.max(totalBytes, 1)) * 100).toFixed(1)}% of bucket)`);
  console.log("─".repeat(70));

  // Show first 30 orphans for spot-check
  const sample = [...orphans].sort((a, b) => b.Size - a.Size).slice(0, 30);
  for (const o of sample) {
    console.log(`  ${formatBytes(o.Size).padStart(10)}  ${o.Key}`);
  }
  if (orphans.length > sample.length) {
    console.log(`  … and ${orphans.length - sample.length} more`);
  }
  console.log();

  if (orphans.length === 0) {
    console.log("Nothing to clean up — every file is currently in use.");
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log("DRY RUN — no changes made. Re-run with --apply to delete:");
    console.log("  npx tsx ./_cleanup_orphan_r2_files.ts --apply");
    await prisma.$disconnect();
    return;
  }

  // R2 DeleteObjects: 1000 keys/call max
  const CHUNK = 1000;
  const allKeys = orphans.map((o) => o.Key);
  for (let i = 0; i < allKeys.length; i += CHUNK) {
    const batch = allKeys.slice(i, i + CHUNK);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
  console.log(`✓ Deleted ${allKeys.length} orphan files. Reclaimed ${formatBytes(orphanBytes)}.`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
