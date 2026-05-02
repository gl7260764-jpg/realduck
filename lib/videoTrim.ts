/**
 * Server-side video TRIM (no re-encoding) via the bundled ffmpeg-static binary.
 *
 * Strategy: when an uploaded video exceeds the size budget, calculate what
 * fraction of the original duration fits in the budget and copy just that
 * portion. Streams are copied bit-for-bit (`-c copy`), so quality is
 * IDENTICAL to the original — we just keep less of it. Operation is near
 * instant since no encoding happens.
 *
 * Tradeoff: the user loses video duration, not visual quality.
 */

import { spawn } from "child_process";
import { writeFile, readFile, unlink, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";
import { randomBytes } from "crypto";

export interface TrimResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
  originalDuration: number;
  trimmedDuration: number;
  finalSize: number;
}

async function getDuration(filePath: string): Promise<number> {
  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, ["-hide_banner", "-i", filePath]);
    let stderr = "";
    proc.stderr.on("data", (c) => { stderr += c.toString(); });
    // ffmpeg with no output exits with code 1, but still prints metadata first.
    proc.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (!m) {
        reject(new Error("Could not parse duration"));
        return;
      }
      resolve(parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]));
    });
    proc.on("error", reject);
  });
}

export async function trimVideoToFit(
  input: Buffer,
  originalName: string,
  targetBytes: number,
): Promise<TrimResult> {
  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");
  const id = randomBytes(6).toString("hex");
  const inputExt = (originalName.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const inputPath = join(tmpdir(), `vt_in_${id}.${inputExt}`);
  const outputPath = join(tmpdir(), `vt_out_${id}.mp4`);

  await writeFile(inputPath, input);

  try {
    const originalDuration = await getDuration(inputPath);
    // 95% safety margin so we land comfortably under the budget.
    const ratio = targetBytes / input.length;
    const targetDuration = Math.max(3, Math.floor(originalDuration * ratio * 0.95));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath as string, [
        "-y",
        "-i", inputPath,
        "-t", String(targetDuration),
        "-c", "copy",            // copy streams — no re-encoding
        "-avoid_negative_ts", "make_zero",
        "-movflags", "+faststart",
        outputPath,
      ]);
      let stderr = "";
      proc.stderr.on("data", (c) => { stderr += c.toString(); });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg trim exited ${code}: ${stderr.slice(-500)}`));
      });
    });

    const raw = await readFile(outputPath);
    const { size } = await stat(outputPath);

    return {
      buffer: Buffer.from(raw),
      filename: originalName.replace(/\.[^.]+$/, "") + ".mp4",
      contentType: "video/mp4",
      originalDuration,
      trimmedDuration: targetDuration,
      finalSize: size,
    };
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
