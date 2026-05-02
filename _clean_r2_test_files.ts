/**
 * Delete test-only files from the R2 bucket — leaves real product/blog
 * uploads alone. The list of prefixes is hard-coded below; only objects
 * starting with one of these prefixes get deleted.
 *
 * Default = dry run; pass --apply to actually delete.
 *
 *   npx tsx ./_clean_r2_test_files.ts          # preview
 *   npx tsx ./_clean_r2_test_files.ts --apply  # delete
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;

const APPLY = process.argv.includes("--apply");

// Folders that exist only because of test/benchmark uploads from this session.
const TEST_PREFIXES = [
  "test-r2-compress/",
  "test-r2-upload/",
  "test-r2-video/",
  "test-r2-realistic/",
  "speed-test/",
  "speed-test-2/",
  "trim-test/",
  "direct-test/",
  "prod-smoke-test/",
];

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

async function listPrefix(prefix: string) {
  const items: { Key: string; Size: number }[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    for (const obj of res.Contents || []) {
      if (obj.Key) items.push({ Key: obj.Key, Size: obj.Size || 0 });
    }
    token = res.NextContinuationToken;
  } while (token);
  return items;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (deleting)" : "DRY RUN"}\n`);

  let totalCount = 0;
  let totalBytes = 0;
  const allKeys: string[] = [];

  for (const prefix of TEST_PREFIXES) {
    const items = await listPrefix(prefix);
    if (items.length === 0) {
      console.log(`  (empty)            ${prefix}`);
      continue;
    }
    const bytes = items.reduce((s, x) => s + x.Size, 0);
    console.log(`  ${formatBytes(bytes).padStart(10)}  ${String(items.length).padStart(4)} files  ${prefix}`);
    totalCount += items.length;
    totalBytes += bytes;
    for (const i of items) allKeys.push(i.Key);
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Total to delete: ${totalCount} files, ${formatBytes(totalBytes)}`);

  if (totalCount === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  if (!APPLY) {
    console.log("\nDry run — no changes made. Re-run with --apply to delete:");
    console.log("  npx tsx ./_clean_r2_test_files.ts --apply");
    return;
  }

  // R2/S3 DeleteObjects supports up to 1000 keys per call.
  const CHUNK = 1000;
  for (let i = 0; i < allKeys.length; i += CHUNK) {
    const batch = allKeys.slice(i, i + CHUNK);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
  console.log(`\n✓ Deleted ${allKeys.length} files. Reclaimed ${formatBytes(totalBytes)}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
