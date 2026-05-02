/**
 * Report R2 storage usage. Lists every object, totals bytes, and breaks
 * down by top-level folder so you can see where storage is going.
 *
 *   npx tsx ./_r2_storage_report.ts
 *
 * Read-only — no changes.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;

const FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function main() {
  console.log(`Scanning bucket: ${bucket}\n`);

  const folderTotals = new Map<string, { count: number; bytes: number }>();
  let totalBytes = 0;
  let totalCount = 0;
  let largestObject = { key: "", bytes: 0 };
  let continuationToken: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    for (const obj of res.Contents || []) {
      if (!obj.Key || obj.Size === undefined) continue;
      totalCount++;
      totalBytes += obj.Size;
      const folder = obj.Key.split("/").slice(0, -1).join("/") || "(root)";
      const cur = folderTotals.get(folder) || { count: 0, bytes: 0 };
      cur.count++;
      cur.bytes += obj.Size;
      folderTotals.set(folder, cur);
      if (obj.Size > largestObject.bytes) {
        largestObject = { key: obj.Key, bytes: obj.Size };
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log("─".repeat(70));
  console.log(`Total objects:  ${totalCount}`);
  console.log(`Total storage:  ${formatBytes(totalBytes)}`);
  console.log(`Free-tier cap:  ${formatBytes(FREE_TIER_BYTES)} (10 GB)`);
  const percentUsed = (totalBytes / FREE_TIER_BYTES) * 100;
  const percentFree = 100 - percentUsed;
  console.log(`Used:           ${percentUsed.toFixed(2)}%`);
  console.log(`Free remaining: ${formatBytes(FREE_TIER_BYTES - totalBytes)}  (${percentFree.toFixed(2)}%)`);
  console.log("─".repeat(70));

  // Visual bar
  const barWidth = 60;
  const filled = Math.min(barWidth, Math.round((percentUsed / 100) * barWidth));
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
  console.log(`[${bar}]  ${percentUsed.toFixed(2)}%`);
  console.log();

  console.log("Storage by folder (top 20):");
  console.log("─".repeat(70));
  const sortedFolders = [...folderTotals.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  for (const [folder, { count, bytes }] of sortedFolders.slice(0, 20)) {
    console.log(`  ${formatBytes(bytes).padStart(10)}  ${String(count).padStart(5)} files  ${folder}`);
  }
  if (sortedFolders.length > 20) {
    console.log(`  … and ${sortedFolders.length - 20} more folders`);
  }
  console.log();

  if (largestObject.key) {
    console.log(`Largest single object: ${formatBytes(largestObject.bytes)}`);
    console.log(`  ${largestObject.key}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
