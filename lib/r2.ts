/**
 * Cloudflare R2 client — S3-compatible.
 * Used by the migration script and the admin upload endpoint.
 *
 * CRAFTED By W1C3
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET || "realduck-media";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

if (!endpoint || !accessKeyId || !secretAccessKey) {
  // Don't throw at import time — Next.js may import this file at build before
  // env vars are loaded. Throw only when something tries to use the client.
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 env vars missing. Need R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
    );
  }
  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export function publicUrlFor(key: string): string {
  return `${R2_PUBLIC_URL}/${key.replace(/^\/+/, "")}`;
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrlFor(key);
}

export async function presignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 60 * 5,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
  return { uploadUrl, publicUrl: publicUrlFor(key) };
}

export function contentTypeFor(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
    case "heif":
      return "image/heic";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    case "m4v":
      return "video/x-m4v";
    default:
      return "application/octet-stream";
  }
}
