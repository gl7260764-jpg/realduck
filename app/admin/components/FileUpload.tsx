"use client";

import { useRef, useState } from "react";
import { X, Image as ImageIcon, Video, AlertCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  type?: "image" | "video";
  label?: string;
  compact?: boolean;
  hideUrlInput?: boolean;
  /** Optional slug to organize uploaded files under <slug>/... in R2. */
  slug?: string;
}

export default function FileUpload({
  value,
  onChange,
  type = "image",
  label,
  compact = false,
  hideUrlInput = false,
  slug,
}: FileUploadProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVideo = type === "video";

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Ask our server for a pre-signed PUT URL (small JSON request — fits in Vercel cap).
      const urlRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          slug,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        throw new Error(urlData.error || `Failed to get upload URL (${urlRes.status})`);
      }

      // 2. PUT the file directly to R2 — Vercel never sees the bytes.
      //    Using XHR (not fetch) because we need upload progress events.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`R2 rejected upload (${xhr.status})`));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
        xhr.open("PUT", urlData.uploadUrl);
        // Must match the Content-Type the pre-signed URL was issued for.
        xhr.setRequestHeader("Content-Type", urlData.contentType || "application/octet-stream");
        xhr.send(file);
      });

      // 3. Hand the public URL back to the form.
      setImageError(false);
      setIsLoading(true);
      onChange(urlData.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input so re-selecting the same file works.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleRemove = () => {
    setImageError(false);
    setIsLoading(true);
    setUploadError(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={isVideo ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif"}
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Preview when value exists */}
      {value && !uploading && (
        <div className={`relative ${compact ? "h-28" : "h-40"} w-full rounded-lg overflow-hidden bg-gray-200 border border-gray-300`}>
          {isVideo ? (
            <video
              src={value}
              className="w-full h-full object-cover"
              muted
              playsInline
              onLoadedData={() => setIsLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-xs">Failed to load image</p>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded"
                className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setImageError(true);
                }}
              />
            </>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className={`w-full ${compact ? "h-20" : "h-28"} border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center gap-2 px-4`}>
          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading… {uploadProgress}%</span>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button when no value and not uploading */}
      {!value && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full ${compact ? "h-20" : "h-28"} border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group`}
        >
          <div className="flex flex-col items-center justify-center h-full gap-1.5 px-2">
            <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
              {isVideo ? (
                <Video className="w-5 h-5 text-gray-500" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <p className="text-xs font-medium text-gray-600 text-center">
              Click to upload {isVideo ? "video" : "image"}
            </p>
            <p className="text-[10px] text-gray-400">
              {isVideo ? "MP4, WebM, MOV — any size" : "JPG, PNG, WebP — any size"}
            </p>
          </div>
        </button>
      )}

      {uploadError && (
        <div className="flex items-start gap-1.5 text-[11px] text-red-600">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* URL Input */}
      {!hideUrlInput && (
        <div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5">
            <div className="flex-1 h-px bg-gray-200" />
            <span>or paste URL</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <input
            type="url"
            value={value}
            onChange={(e) => {
              setImageError(false);
              setIsLoading(true);
              onChange(e.target.value);
            }}
            placeholder={`Enter ${type} URL...`}
            className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}
