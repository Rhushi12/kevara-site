import { NextRequest, NextResponse } from "next/server";

export interface AuthResult {
    authenticated: boolean;
    userId?: string;
    email?: string;
    isAdmin?: boolean;
    error?: string;
}

// ---- Admin whitelist cache ----
let adminEmailsCache: string[] | null = null;
let adminCacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch admin emails from Firestore (with caching)
 */
async function getAdminEmails(): Promise<string[]> {
    const now = Date.now();
    if (adminEmailsCache && now < adminCacheExpiry) {
        return adminEmailsCache;
    }

    try {
        const { db } = await import("@/lib/firebase-admin");
        const adminsDoc = await db.collection("settings").doc("admins").get();

        if (adminsDoc.exists) {
            adminEmailsCache = adminsDoc.data()?.emails || [];
        } else {
            // Fallback to env variable
            const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "rhushimanumehta@gmail.com")
                .split(",")
                .map((e: string) => e.trim().toLowerCase());
            adminEmailsCache = envAdmins;
        }
        adminCacheExpiry = now + CACHE_TTL;
    } catch (error) {
        console.error("[Auth] Failed to fetch admin list:", error);
        // Fallback to env variable on error
        adminEmailsCache = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "rhushimanumehta@gmail.com")
            .split(",")
            .map((e: string) => e.trim().toLowerCase());
    }

    return adminEmailsCache!;
}

/**
 * Get Firebase Admin auth instance (lazy initialization)
 */
async function getFirebaseAdminAuth() {
    const admin = await import("firebase-admin");

    if (admin.default.apps.length === 0) {
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (clientEmail && privateKey) {
            admin.default.initializeApp({
                credential: admin.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } else {
            throw new Error("[Auth] Firebase Admin credentials are not configured. Cannot verify tokens.");
        }
    }

    return admin.default.auth();
}

/**
 * Verify Firebase ID token from Authorization header.
 * ALWAYS enforces authentication — no dev mode bypass.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return { authenticated: false, error: "Missing or invalid authorization header" };
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            return { authenticated: false, error: "No token provided" };
        }

        const auth = await getFirebaseAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);

        // Check admin status
        const adminEmails = await getAdminEmails();
        const isAdmin = !!decodedToken.email && adminEmails.includes(decodedToken.email.toLowerCase());

        return {
            authenticated: true,
            userId: decodedToken.uid,
            email: decodedToken.email,
            isAdmin,
        };
    } catch (error: any) {
        console.error("[Auth] Token verification failed:", error.message);
        return { authenticated: false, error: "Invalid or expired token" };
    }
}

/**
 * Middleware helper to require any authenticated user.
 * Returns 401 response if not authenticated.
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return NextResponse.json(
            { error: authResult.error || "Unauthorized" },
            { status: 401 }
        );
    }

    return null;
}

/**
 * Middleware helper to require an ADMIN user.
 * Verifies the Firebase token AND checks the user's email against
 * the admin whitelist stored in Firestore settings/admins.
 * Returns 401 if not authenticated, 403 if not an admin.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return NextResponse.json(
            { error: authResult.error || "Unauthorized" },
            { status: 401 }
        );
    }

    if (!authResult.isAdmin) {
        return NextResponse.json(
            { error: "Forbidden — admin access required" },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Verify a raw ID token string (server-side only)
 */
export async function verifyToken(token: string): Promise<AuthResult> {
    try {
        const auth = await getFirebaseAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const adminEmails = await getAdminEmails();
        const isAdmin = !!decodedToken.email && adminEmails.includes(decodedToken.email.toLowerCase());

        return {
            authenticated: true,
            userId: decodedToken.uid,
            email: decodedToken.email,
            isAdmin,
        };
    } catch (error: any) {
        console.error("[Auth] Token verification failed:", error.message);
        return { authenticated: false, error: "Invalid or expired token" };
    }
}

/**
 * Helper to extract verified auth result and attach to the response.
 * Useful when the handler needs the verified user info.
 */
export async function getVerifiedAdmin(request: NextRequest): Promise<{ error: NextResponse | null; auth: AuthResult }> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return {
            error: NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 }),
            auth: authResult,
        };
    }

    if (!authResult.isAdmin) {
        return {
            error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }),
            auth: authResult,
        };
    }

    return { error: null, auth: authResult };
}
