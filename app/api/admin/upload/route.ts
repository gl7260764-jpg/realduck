import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { putObject, contentTypeFor } from "@/lib/r2";
import { compressVideo } from "@/lib/videoCompress";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // give ffmpeg up to 2 min on large videos

const HARD_MAX_BYTES = 200 * 1024 * 1024;          // 200 MB intake cap
const VIDEO_COMPRESS_OVER = 8 * 1024 * 1024;       // re-encode any video over 8 MB
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "mkv", "avi", "m4v", "3gp"]);

function isVideoFilename(name: string): boolean {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return VIDEO_EXT.has(ext);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Duck-type the file entry — Node 18 globals don't include `File`.
  const file = formData.get("file") as (Blob & { name?: string }) | null;
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > HARD_MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB; max ${HARD_MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }
  const filename = file.name || "upload.bin";

  // Slug hint for organizing files in R2
  const slugHint = (formData.get("slug") as string | null) || null;
  const safeSlug = slugHint ? slugHint.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) : null;

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const originalIsVideo = isVideoFilename(filename) || (file.type || "").startsWith("video/");

  let uploadBuffer: Uint8Array = originalBuffer;
  let uploadFilename = filename;
  let uploadContentType: string;
  let compressed = false;
  let originalSize = originalBuffer.length;

  if (originalIsVideo && originalBuffer.length > VIDEO_COMPRESS_OVER) {
    try {
      const result = await compressVideo(originalBuffer, filename);
      uploadBuffer = result.buffer;
      uploadFilename = result.filename;
      uploadContentType = result.contentType;
      compressed = true;
    } catch (err) {
      console.error("Video compression failed:", err);
      return NextResponse.json(
        { error: `Compression failed: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 },
      );
    }
  } else {
    const extType = contentTypeFor(uploadFilename);
    uploadContentType =
      extType !== "application/octet-stream"
        ? extType
        : file.type || "application/octet-stream";
  }

  const ext = (uploadFilename.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const random = randomBytes(6).toString("hex");
  const date = new Date().toISOString().slice(0, 10);
  const key = safeSlug
    ? `${safeSlug}/${random}.${ext}`
    : `uploads/${date}/${random}.${ext}`;

  try {
    const url = await putObject(key, uploadBuffer, uploadContentType);
    return NextResponse.json({
      url,
      key,
      size: uploadBuffer.length,
      contentType: uploadContentType,
      compressed,
      originalSize,
      compressedSize: compressed ? uploadBuffer.length : undefined,
      compressionRatio: compressed
        ? `${((1 - uploadBuffer.length / originalSize) * 100).toFixed(1)}%`
        : undefined,
    });
  } catch (error: unknown) {
    console.error("R2 upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
