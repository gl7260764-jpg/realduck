/**
 * Server-side video compression via the bundled `ffmpeg-static` binary.
 *
 * Compresses with H.264 + AAC, scales width to max 1280px, keeps aspect.
 * Output is .mp4 regardless of input format. CRF 28 gives a good
 * "small file, still looks fine for product demos" tradeoff.
 *
 * Returns the compressed buffer + chosen output filename.
 */

import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";
import { randomBytes } from "crypto";

export interface CompressResult {
  buffer: Buffer;
  filename: string;
  contentType: "video/mp4";
}

export async function compressVideo(
  input: Buffer,
  originalName: string,
): Promise<CompressResult> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static binary not found");
  }
  const id = randomBytes(6).toString("hex");
  const ext = (originalName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const inputPath = join(tmpdir(), `vc_in_${id}.${ext}`);
  const outputPath = join(tmpdir(), `vc_out_${id}.mp4`);

  await writeFile(inputPath, input);

  try {
    await new Promise<void>((resolve, reject) => {
      const args = [
        "-y",
        "-i", inputPath,
        // Video: H.264 with CRF 28 + superfast preset (good speed/size balance for web product clips)
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "superfast",
        // Cap longest side at 960px — plenty for product previews, big speedup vs 1280
        "-vf", "scale='if(gt(iw,ih),min(960,iw),-2)':'if(gt(iw,ih),-2,min(960,ih))'",
        // Audio: AAC at 64 kbps mono — fine for product demos, half the bitrate
        "-c:a", "aac",
        "-b:a", "64k",
        "-ac", "1",
        // Faststart so the moov atom is at the start (browser can play before fully downloaded)
        "-movflags", "+faststart",
        // Multi-thread the encoder
        "-threads", "0",
        outputPath,
      ];
      const proc = spawn(ffmpegPath as string, args);
      let stderr = "";
      proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
      });
    });

    const raw = await readFile(outputPath);
    return {
      buffer: Buffer.from(raw),
      filename: originalName.replace(/\.[^.]+$/, "") + ".mp4",
      contentType: "video/mp4",
    };
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
