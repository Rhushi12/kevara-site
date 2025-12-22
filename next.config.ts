import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Skip optimization for Shopify CDN - they already serve optimized images
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
    ],
    // Increase minimumCacheTTL for production performance
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
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
            value: "default-src 'self'; connect-src 'self' https://*.r2.dev https://cdn.shopify.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://cdn.shopify.com https://images.unsplash.com https://*.r2.dev; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com;"
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
