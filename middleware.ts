import { NextRequest, NextResponse } from "next/server";

// Define allowed origins for CORS
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://kevara.in",
    "https://www.kevara.in",
    process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

// Valid production domains
const VALID_DOMAINS = [
    "kevara.in",
    "www.kevara.in",
    "localhost:3000",
    "localhost:3001",
];

// API routes that require authentication
const protectedApiPaths = [
    "/api/products/create",
    "/api/products/delete",
    "/api/navigation/update",
    "/api/hero/update",
    "/api/upload",
    "/api/pages",
];

// Paths accessible during maintenance mode
const MAINTENANCE_PUBLIC_PATHS = [
    '/under-construction',
    '/admin-bypass',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/logo',
    '/og-image',
];

// Static file extensions
const PUBLIC_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2'];

// Rate limiting (simple in-memory, use Redis for production at scale)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 500; // Increased from 100 to 500 to support shared office IPs (NAT)

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

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get("host") || request.nextUrl.hostname;
    const origin = request.headers.get("origin") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

    // ========== DOMAIN VALIDATION ==========
    // Extract just the domain (remove port if present for localhost)
    const domain = hostname.replace(/:\d+$/, "") + (hostname.includes(":") ? ":" + hostname.split(":")[1] : "");
    const cleanDomain = hostname.includes("localhost") ? hostname : hostname.replace(/:\d+$/, "");

    // Allow Vercel preview deployments and valid production domains
    const isValidDomain =
        VALID_DOMAINS.some(d => cleanDomain === d || cleanDomain.endsWith("." + d)) ||
        cleanDomain.endsWith(".vercel.app") ||
        cleanDomain.includes("localhost");

    // For Vercel, we should allow their deployment URLs
    // No strict domain blocking - Vercel handles domain configuration

    // ========== MAINTENANCE MODE CHECK ==========
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceMode && !pathname.startsWith("/api/")) {
        const isPublicPath = MAINTENANCE_PUBLIC_PATHS.some(path => pathname.startsWith(path));
        const isStaticFile = PUBLIC_EXTENSIONS.some(ext => pathname.endsWith(ext));
        const adminBypass = request.cookies.get('admin_bypass');
        const hasAdminBypass = adminBypass?.value === 'true';

        if (!isPublicPath && !isStaticFile && !hasAdminBypass) {
            const url = request.nextUrl.clone();
            url.pathname = '/under-construction';
            return NextResponse.redirect(url);
        }
    }

    // Redirect /under-construction to home if maintenance is off
    if (!isMaintenanceMode && pathname === '/under-construction') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // ========== CORS & API HANDLING ==========
    if (pathname.startsWith("/api/")) {
        // Rate limiting
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
        // response.headers.set("X-Frame-Options", "DENY"); // Managed by CSP in next.config.ts
        response.headers.set("X-XSS-Protection", "1; mode=block");

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
