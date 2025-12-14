"use client";

import { auth } from "./firebase";

/**
 * Get the current user's Firebase ID token
 * Returns null if user is not logged in
 */
export async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        console.warn("[authFetch] No user logged in");
        return null;
    }

    try {
        const token = await user.getIdToken();
        return token;
    } catch (error) {
        console.error("[authFetch] Failed to get ID token:", error);
        return null;
    }
}

/**
 * Check if current user has admin flag
 * Admin users have isAdmin: true in their Firebase custom claims or user document
 */
export function isCurrentUserAdmin(): boolean {
    // Check if the admin flag is set in the session
    if (typeof window !== 'undefined') {
        // This is set when user logs in - you can also check Firebase custom claims
        const adminFlag = localStorage.getItem('isAdmin');
        return adminFlag === 'true';
    }
    return false;
}

/**
 * Authenticated fetch wrapper
 * Automatically adds Authorization header with Firebase ID token
 * Only works if user is logged in AND is an admin
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (method, body, etc.)
 * @returns Fetch response
 */
export async function authFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    // Check if user is admin before making request
    if (!isCurrentUserAdmin()) {
        console.warn("[authFetch] User is not admin - request may be rejected");
    }

    const token = await getAuthToken();

    if (!token) {
        // Still make the request, but it will likely fail with 401
        console.warn("[authFetch] No auth token available - request may fail");
        return fetch(url, options);
    }

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Authenticated FormData upload
 * Use this for file uploads that need auth
 */
export async function authUpload(
    url: string,
    formData: FormData
): Promise<Response> {
    const token = await getAuthToken();

    if (!token) {
        throw new Error("Not authenticated - please log in");
    }

    if (!isCurrentUserAdmin()) {
        throw new Error("Not authorized - admin access required");
    }

    return fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            // Don't set Content-Type for FormData - browser sets it with boundary
        },
        body: formData,
    });
}
