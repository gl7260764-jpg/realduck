/**
 * Walks ~/Desktop/realduck-media/<slug>/ and renames whatever's inside to
 * the convention the upload script expects:
 *
 *   • images sorted alphabetically → 01.<ext>, 02.<ext>, 03.<ext>, ...
 *   • the (single) video file        → video.<ext>
 *   • _README.txt and dotfiles       → left alone
 *   • unknown file types             → left alone, listed as warnings
 *
 * Defaults to DRY RUN — prints what it would do. Pass --apply to actually
 * rename. Idempotent: re-running on already-normalized folders is a no-op.
 *
 *   npx tsx ./_normalize_media.ts             # preview
 *   npx tsx ./_normalize_media.ts --apply     # rename for real
 *
 * CRAFTED By W1C3
 */

import * as fs from "fs/promises";
import * as path from "path";

const PARENT = "/home/wice2/Desktop/realduck-media";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"]);
const SKIP_NAMES = new Set(["_README.txt"]);

const APPLY = process.argv.includes("--apply");

interface Plan {
  folder: string;
  renames: { from: string; to: string }[];
  warnings: string[];
  imageCount: number;
  hasVideo: boolean;
  alreadyNormalized: boolean;
}

function classify(filename: string): "image" | "video" | "skip" {
  if (filename.startsWith(".") || SKIP_NAMES.has(filename)) return "skip";
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return "skip";
}

async function planFolder(folder: string): Promise<Plan> {
  const folderPath = path.join(PARENT, folder);
  const entries = await fs.readdir(folderPath);

  const images: string[] = [];
  const videos: string[] = [];
  const warnings: string[] = [];

  for (const name of entries) {
    const cls = classify(name);
    if (cls === "image") images.push(name);
    else if (cls === "video") videos.push(name);
    else if (name !== "_README.txt" && !name.startsWith(".")) {
      warnings.push(`unrecognized file: ${name}`);
    }
  }

  // Natural sort: "IMG_2.jpg" before "IMG_10.jpg".
  images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  videos.sort();

  const renames: { from: string; to: string }[] = [];

  images.forEach((name, i) => {
    const ext = path.extname(name).toLowerCase();
    const newName = `${String(i + 1).padStart(2, "0")}${ext}`;
    if (name !== newName) renames.push({ from: name, to: newName });
  });

  if (videos.length > 1) {
    warnings.push(`multiple videos (${videos.length}) — keeping the first one: ${videos[0]}`);
  }
  if (videos.length > 0) {
    const vid = videos[0];
    const ext = path.extname(vid).toLowerCase();
    const newName = `video${ext}`;
    if (vid !== newName) renames.push({ from: vid, to: newName });
  }

  return {
    folder,
    renames,
    warnings,
    imageCount: images.length,
    hasVideo: videos.length > 0,
    alreadyNormalized: renames.length === 0 && (images.length > 0 || videos.length > 0),
  };
}

async function applyPlan(plan: Plan) {
  const folderPath = path.join(PARENT, plan.folder);
  // Two-phase rename to avoid clashes (e.g. 02.jpg → 01.jpg when 01.jpg already exists).
  const tempPrefix = `__rename_${Date.now()}_`;
  const phase1: { tempName: string; finalName: string }[] = [];
  for (let i = 0; i < plan.renames.length; i++) {
    const { from, to } = plan.renames[i];
    const tempName = `${tempPrefix}${i}${path.extname(from)}`;
    await fs.rename(path.join(folderPath, from), path.join(folderPath, tempName));
    phase1.push({ tempName, finalName: to });
  }
  for (const { tempName, finalName } of phase1) {
    await fs.rename(path.join(folderPath, tempName), path.join(folderPath, finalName));
  }
}

async function main() {
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

  console.log(`Mode: ${APPLY ? "APPLY (renaming files)" : "DRY RUN (no changes)"}`);
  console.log(`Scanning ${folders.length} folders under ${PARENT}\n`);

  let totalToRename = 0;
  let foldersWithChanges = 0;
  let foldersAlreadyDone = 0;
  let foldersEmpty = 0;
  const warningsByFolder: { folder: string; warnings: string[] }[] = [];

  for (const folder of folders) {
    const plan = await planFolder(folder);

    if (plan.warnings.length) warningsByFolder.push({ folder, warnings: plan.warnings });

    if (plan.imageCount === 0 && !plan.hasVideo) {
      foldersEmpty++;
      continue;
    }

    if (plan.alreadyNormalized) {
      foldersAlreadyDone++;
      continue;
    }

    foldersWithChanges++;
    totalToRename += plan.renames.length;

    console.log(`📁 ${folder}  (${plan.imageCount} image${plan.imageCount === 1 ? "" : "s"}${plan.hasVideo ? " + video" : ""})`);
    for (const { from, to } of plan.renames) {
      console.log(`     ${from}  →  ${to}`);
    }
    if (APPLY) {
      await applyPlan(plan);
    }
    console.log();
  }

  console.log("─".repeat(70));
  console.log(`Folders with files needing rename: ${foldersWithChanges}`);
  console.log(`Folders already normalized:        ${foldersAlreadyDone}`);
  console.log(`Folders still empty (no files):    ${foldersEmpty}`);
  console.log(`Total renames ${APPLY ? "applied" : "planned"}:           ${totalToRename}`);

  if (warningsByFolder.length) {
    console.log("\n⚠ Warnings:");
    for (const w of warningsByFolder) {
      for (const msg of w.warnings) console.log(`   ${w.folder}: ${msg}`);
    }
  }

  if (!APPLY && foldersWithChanges > 0) {
    console.log("\nLooks good? Re-run with --apply to actually rename:");
    console.log("  npx tsx ./_normalize_media.ts --apply");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
