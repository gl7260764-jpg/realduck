import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { presignedPutUrl, contentTypeFor } from "@/lib/r2";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issues a short-lived pre-signed PUT URL so the browser can upload
 * directly to R2 — bypassing Vercel's 4.5 MB body cap on Hobby.
 *
 * Body: { filename: string; contentType?: string; slug?: string }
 * Returns: { uploadUrl, publicUrl, key, contentType }
 *
 * The browser MUST PUT the file with the same Content-Type header that's
 * returned here, or R2 rejects the signature.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { filename?: string; contentType?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const filename = body.filename || "upload.bin";
  const slugHint = body.slug || null;
  const safeSlug = slugHint ? slugHint.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) : null;

  const ext = (filename.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const random = randomBytes(6).toString("hex");
  const date = new Date().toISOString().slice(0, 10);
  const key = safeSlug
    ? `${safeSlug}/${random}.${ext}`
    : `uploads/${date}/${random}.${ext}`;

  // Trust the extension first, fall back to client-supplied type.
  const extType = contentTypeFor(filename);
  const contentType =
    extType !== "application/octet-stream"
      ? extType
      : body.contentType || "application/octet-stream";

  try {
    const { uploadUrl, publicUrl } = await presignedPutUrl(key, contentType, 60 * 10);
    return NextResponse.json({ uploadUrl, publicUrl, key, contentType });
  } catch (error: unknown) {
    console.error("upload-url error:", error);
    const message = error instanceof Error ? error.message : "Failed to sign upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
