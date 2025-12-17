import { NextRequest, NextResponse } from "next/server";

// Define allowed origins (add your production domain here)
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

// API routes that require authentication (POST, PUT, DELETE operations)
const protectedApiPaths = [
    "/api/products/create",
    "/api/products/delete",
    "/api/navigation/update",
    "/api/hero/update",
    "/api/upload",
    "/api/pages",
];

// Paths that should always be accessible (even in maintenance mode)
const MAINTENANCE_PUBLIC_PATHS = [
    '/under-construction',
    '/admin-bypass',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/logo',
    '/og-image',
];

// File extensions that should always be accessible
const PUBLIC_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2'];

// Rate limiting configuration (simple in-memory, use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

    // ========== MAINTENANCE MODE CHECK ==========
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    // Don't apply maintenance mode to API routes
    if (isMaintenanceMode && !pathname.startsWith("/api/")) {
        // Check if the path is always public during maintenance
        const isPublicPath = MAINTENANCE_PUBLIC_PATHS.some(path => pathname.startsWith(path));

        // Check if it's a static file
        const isStaticFile = PUBLIC_EXTENSIONS.some(ext => pathname.endsWith(ext));

        // Check for admin bypass cookie
        const adminBypass = request.cookies.get('admin_bypass');
        const hasAdminBypass = adminBypass?.value === 'true';

        // If not a public path, not a static file, and no admin bypass -> redirect
        if (!isPublicPath && !isStaticFile && !hasAdminBypass) {
            const url = request.nextUrl.clone();
            url.pathname = '/under-construction';
            return NextResponse.redirect(url);
        }
    }
    // ========== END MAINTENANCE MODE CHECK ==========

    // CORS handling for API routes
    if (pathname.startsWith("/api/")) {
        // Check rate limit
        if (!checkRateLimit(ip)) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests" }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": "60",
                    },
                }
            );
        }

        // Handle preflight requests
        if (request.method === "OPTIONS") {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        // Add CORS headers to response
        const response = NextResponse.next();

        if (allowedOrigins.includes(origin)) {
            response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        // Security headers
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes for maintenance mode
        '/((?!_next/static|_next/image).*)',
    ],
};

