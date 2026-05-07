/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Don't bundle the ffmpeg binary — load it from node_modules at runtime.
    serverComponentsExternalPackages: ["ffmpeg-static"],
  },
  images: {
    // Modern formats — AVIF first (~40% smaller than WebP), WebP fallback,
    // original JPEG/PNG only as last resort. Browsers negotiate via Accept header.
    formats: ["image/avif", "image/webp"],
    // Cache transformed images for a year — Vercel respects this for the optimizer.
    minimumCacheTTL: 31536000,
    // Image widths the optimizer will pre-generate for `sizes`-aware components.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-29aa6546799743b7a432165711f33223.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
