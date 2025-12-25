import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "pub-bc73237650a24175b763c871869b4cf9.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
    // Aggressive caching for production
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              // Default fallback
              "default-src 'self'",
              // API connections - Firebase, Shopify, Cloudflare R2
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.myshopify.com https://*.shopify.com https://*.r2.dev https://*.cloudflarestorage.com https://cdn.shopify.com https://www.google.com",
              // Scripts - Firebase, Google APIs, blob for dynamic scripts
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.shopify.com https://*.firebaseapp.com https://apis.google.com https://www.gstatic.com",
              // Styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images - all sources used including user uploads
              "img-src 'self' blob: data: https: http:",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Frames for auth popups and embedded videos
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://www.youtube.com https://youtube.com https://*.youtube.com",
              // Who can frame this site
              "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com",
              // Media (video/audio)
              "media-src 'self' blob: https://*.r2.dev https://*.cloudflarestorage.com https://cdn.shopify.com",
              // Web workers
              "worker-src 'self' blob:"
            ].join("; ")
          }
          // Note: COOP/COEP headers for ffmpeg.wasm removed - they block cross-origin resources
          // Video compression will show a message if SharedArrayBuffer is unavailable
        ]
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
