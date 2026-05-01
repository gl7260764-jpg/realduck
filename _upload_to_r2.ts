/**
 * Walks ~/Desktop/realduck-media/<slug>/ and uploads every normalized file
 * (01.jpg, 02.jpg, …, video.mp4) to Cloudflare R2 under the key
 *   <slug>/<filename>
 * Then updates the matching Product row in Postgres:
 *   • Product.imageUrl   = R2 URL of 01.<ext>
 *   • Product.images[]   = R2 URLs of 02.<ext>, 03.<ext>, … in order
 *   • Product.videoUrl   = R2 URL of video.<ext>, or null if absent
 *
 * Defaults to DRY RUN — prints what it would upload + update, no changes.
 * Pass --apply to actually upload + write the DB.
 *
 * Pass --slug=<slug> to limit to a single product (recommended for the
 * first test run). Without --slug, processes every folder that has files.
 *
 *   npx tsx ./_upload_to_r2.ts --slug=2cb              # preview just one
 *   npx tsx ./_upload_to_r2.ts --slug=2cb --apply      # do it for real
 *   npx tsx ./_upload_to_r2.ts                         # preview all
 *   npx tsx ./_upload_to_r2.ts --apply                 # upload everything
 *
 * Idempotent: re-uploading the same key overwrites cleanly. DB updates
 * only run for products whose folder has files.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import * as fs from "fs/promises";
import * as path from "path";
import { prisma } from "./lib/prisma";
import { putObject, publicUrlFor, contentTypeFor } from "./lib/r2";

const PARENT = "/home/wice2/Desktop/realduck-media";
const APPLY = process.argv.includes("--apply");
const slugArg = process.argv.find((a) => a.startsWith("--slug="));
const ONLY_SLUG = slugArg ? slugArg.split("=")[1] : null;

const NUMBERED_RE = /^(\d{2})\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;
const VIDEO_RE = /^video\.(mp4|mov|webm|mkv|m4v)$/i;

interface FolderPlan {
  slug: string;
  imageFiles: string[];   // sorted by leading number (01, 02, …)
  videoFile: string | null;
  productExists: boolean;
  productId?: string;
  productTitle?: string;
}

async function planFolder(slug: string): Promise<FolderPlan> {
  const folderPath = path.join(PARENT, slug);
  const entries = await fs.readdir(folderPath);

  const images: string[] = [];
  let video: string | null = null;

  for (const name of entries) {
    if (NUMBERED_RE.test(name)) images.push(name);
    else if (VIDEO_RE.test(name)) video = video || name;
  }

  images.sort();

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });

  return {
    slug,
    imageFiles: images,
    videoFile: video,
    productExists: !!product,
    productId: product?.id,
    productTitle: product?.title,
  };
}

async function uploadFile(slug: string, filename: string): Promise<string> {
  const filePath = path.join(PARENT, slug, filename);
  const data = await fs.readFile(filePath);
  const key = `${slug}/${filename}`;
  return putObject(key, data, contentTypeFor(filename));
}

async function processFolder(plan: FolderPlan): Promise<{ updated: boolean; skippedReason?: string }> {
  if (plan.imageFiles.length === 0 && !plan.videoFile) {
    return { updated: false, skippedReason: "empty (no normalized files)" };
  }
  if (!plan.productExists) {
    return { updated: false, skippedReason: `no Product row with slug "${plan.slug}"` };
  }

  // Compute target URLs (without uploading yet)
  const imageUrls = plan.imageFiles.map((f) => publicUrlFor(`${plan.slug}/${f}`));
  const videoUrl = plan.videoFile ? publicUrlFor(`${plan.slug}/${plan.videoFile}`) : null;

  console.log(`📦 ${plan.slug}  →  ${plan.productTitle}`);
  for (let i = 0; i < plan.imageFiles.length; i++) {
    const f = plan.imageFiles[i];
    const role = i === 0 ? "main image" : `gallery #${i + 1}`;
    console.log(`     ${f.padEnd(12)}  ${APPLY ? "uploading…" : "would upload"}  → ${imageUrls[i]}    [${role}]`);
  }
  if (plan.videoFile) {
    console.log(`     ${plan.videoFile.padEnd(12)}  ${APPLY ? "uploading…" : "would upload"}  → ${videoUrl}    [video]`);
  }

  if (!APPLY) {
    console.log(`     DB update would set: imageUrl, images[${plan.imageFiles.length - 1}], videoUrl=${videoUrl ? "set" : "null"}\n`);
    return { updated: false };
  }

  // Upload images in parallel (small concurrency to be polite)
  const uploaded: string[] = [];
  for (const f of plan.imageFiles) {
    const url = await uploadFile(plan.slug, f);
    uploaded.push(url);
    console.log(`     ✓ ${f}`);
  }
  let uploadedVideo: string | null = null;
  if (plan.videoFile) {
    uploadedVideo = await uploadFile(plan.slug, plan.videoFile);
    console.log(`     ✓ ${plan.videoFile}`);
  }

  // Update DB
  const mainImage = uploaded[0];
  const gallery = uploaded.slice(1);
  await prisma.product.update({
    where: { id: plan.productId! },
    data: {
      imageUrl: mainImage,
      images: gallery,
      videoUrl: uploadedVideo,
    },
  });
  console.log(`     ✓ DB updated\n`);
  return { updated: true };
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (uploading + writing DB)" : "DRY RUN (no changes)"}`);
  if (ONLY_SLUG) console.log(`Limited to slug: ${ONLY_SLUG}`);
  console.log(`Source: ${PARENT}`);
  console.log(`Bucket: ${process.env.R2_BUCKET}`);
  console.log(`Public URL base: ${process.env.R2_PUBLIC_URL}\n`);

  let folders: string[];
  try {
    folders = (await fs.readdir(PARENT, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    console.error(`ERROR: ${PARENT} does not exist.`);
    process.exit(1);
  }

  if (ONLY_SLUG) folders = folders.filter((f) => f === ONLY_SLUG);

  let processed = 0;
  let updated = 0;
  const skipped: { slug: string; reason: string }[] = [];

  for (const folder of folders) {
    const plan = await planFolder(folder);
    const result = await processFolder(plan);
    processed++;
    if (result.updated) updated++;
    if (result.skippedReason) skipped.push({ slug: folder, reason: result.skippedReason });
  }

  console.log("─".repeat(70));
  console.log(`Processed: ${processed}`);
  console.log(`${APPLY ? "Updated" : "Would update"}: ${APPLY ? updated : processed - skipped.length}`);
  console.log(`Skipped:   ${skipped.length}`);

  if (!APPLY) {
    console.log("\nLooks good? Re-run with --apply:");
    console.log(`  npx tsx ./_upload_to_r2.ts ${ONLY_SLUG ? `--slug=${ONLY_SLUG} ` : ""}--apply`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
