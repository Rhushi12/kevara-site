"use client";

import { getAuth } from "firebase/auth";

/**
 * Authenticated fetch wrapper for admin API calls.
 * Automatically attaches the Firebase ID token as a Bearer token.
 * 
 * Usage: Replace `fetch('/api/admin/...')` with `adminFetch('/api/admin/...')`
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Not authenticated. Please sign in.");
    }

    const token = await user.getIdToken();

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    // Set Content-Type for JSON bodies if not already set
    if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
