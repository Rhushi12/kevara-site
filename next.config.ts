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
            value: "default-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.myshopify.com https://*.r2.dev https://*.cloudflarestorage.com https://cdn.shopify.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.shopify.com https://*.firebaseapp.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://cdn.shopify.com https://images.unsplash.com https://*.r2.dev https://*.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com; frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com;"
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
