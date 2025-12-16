import { NextRequest, NextResponse } from "next/server";

export interface AuthResult {
    authenticated: boolean;
    userId?: string;
    email?: string;
    error?: string;
}

/**
 * Check if Firebase Admin credentials are available
 * AND we're in production mode (not development)
 */
function shouldEnforceAuth(): boolean {
    // In development, skip auth even if credentials exist
    if (process.env.NODE_ENV === 'development') {
        return false;
    }

    return !!(
        process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
    );
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
            // Initialize without credentials for development
            admin.default.initializeApp({ projectId });
        }
    }

    return admin.default.auth();
}

/**
 * Verify Firebase ID token from Authorization header
 * Returns authenticated user info or error
 * 
 * NOTE: In development mode, auth is bypassed for easier testing.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
    try {
        const authHeader = request.headers.get("authorization");

        // Skip auth in development mode
        if (!shouldEnforceAuth()) {
            console.log("[Auth] Development mode - auth bypassed");
            return {
                authenticated: true,
                userId: "dev-user",
                email: "dev@localhost",
            };
        }

        if (!authHeader?.startsWith("Bearer ")) {
            return { authenticated: false, error: "Missing or invalid authorization header" };
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            return { authenticated: false, error: "No token provided" };
        }

        const auth = await getFirebaseAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);

        return {
            authenticated: true,
            userId: decodedToken.uid,
            email: decodedToken.email,
        };
    } catch (error: any) {
        console.error("[Auth] Token verification failed:", error.message);
        return { authenticated: false, error: "Invalid or expired token" };
    }
}

/**
 * Middleware helper to require authentication
 * Returns 401 response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return NextResponse.json(
            { error: authResult.error || "Unauthorized" },
            { status: 401 }
        );
    }

    return null; // null means authenticated, proceed
}

/**
 * Check if request is from admin (you can extend this logic)
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return NextResponse.json(
            { error: authResult.error || "Unauthorized" },
            { status: 401 }
        );
    }

    // For now, any authenticated user is considered admin
    // TODO: Add admin role verification via custom claims or email whitelist

    return null;
}

/**
 * Verify a raw ID token string (server-side only)
 */
export async function verifyToken(token: string): Promise<AuthResult> {
    try {
        // Skip auth in development mode
        if (!shouldEnforceAuth()) {
            return {
                authenticated: true,
                userId: "dev-user",
                email: "dev@localhost",
            };
        }

        const auth = await getFirebaseAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);

        return {
            authenticated: true,
            userId: decodedToken.uid,
            email: decodedToken.email,
        };
    } catch (error: any) {
        console.error("[Auth] Token verification failed:", error.message);
        return { authenticated: false, error: "Invalid or expired token" };
    }
}
