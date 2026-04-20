"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { X, Image as ImageIcon, Video, AlertCircle } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  type?: "image" | "video";
  label?: string;
  compact?: boolean;
  hideUrlInput?: boolean;
}

export default function FileUpload({
  value,
  onChange,
  type = "image",
  label,
  compact = false,
  hideUrlInput = false,
}: FileUploadProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleUploadSuccess = (result: any) => {
    if (result.info && result.info.secure_url) {
      setImageError(false);
      setIsLoading(true);
      onChange(result.info.secure_url);
    }
  };

  const handleRemove = () => {
    setImageError(false);
    setIsLoading(true);
    onChange("");
  };

  const isVideo = type === "video";

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Preview when value exists */}
      {value && (
        <div className={`relative ${compact ? 'h-28' : 'h-40'} w-full rounded-lg overflow-hidden bg-gray-200 border border-gray-300`}>
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
              <img
                src={value}
                alt="Uploaded"
                className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
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

      {/* Upload button when no value */}
      {!value && (
        <CldUploadWidget
          uploadPreset="nobu_packs"
          options={{
            maxFiles: 1,
            resourceType: isVideo ? "video" : "image",
            sources: ["local", "camera"],
            clientAllowedFormats: isVideo
              ? ["mp4", "webm", "mov"]
              : ["jpg", "jpeg", "png", "webp", "gif"],
            maxFileSize: isVideo ? 52428800 : 5242880,
          }}
          onSuccess={handleUploadSuccess}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className={`w-full ${compact ? 'h-20' : 'h-28'} border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group`}
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
                  {isVideo ? "MP4, WebM up to 50MB" : "JPG, PNG up to 5MB"}
                </p>
              </div>
            </button>
          )}
        </CldUploadWidget>
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
