"use client";

import { useEffect, useRef } from "react";

/**
 * Invisible component that tracks page views via API endpoint.
 * Add this to your root layout to track all page visits.
 * 
 * The API stores data in Firebase `page_views` collection with documents like:
 * {
 *   date: "2024-12-25",
 *   count: 150,
 *   updatedAt: Timestamp
 * }
 */
export default function PageViewsTracker() {
    const tracked = useRef(false);

    useEffect(() => {
        // Only track once per page load (prevents double-tracking with React StrictMode)
        if (tracked.current) return;
        tracked.current = true;

        const trackPageView = async () => {
            try {
                // Call the API endpoint which uses Firebase Admin SDK
                const response = await fetch('/api/page-views', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                } else {
                    console.error("[PageViews] API returned error:", response.status);
                }
            } catch (error) {
                // Silently fail - don't break the user experience
                console.error("[PageViews] Failed to track:", error);
            }
        };

        // Track after a short delay to not block page load
        const timeout = setTimeout(trackPageView, 1000);
        return () => clearTimeout(timeout);
    }, []);

    // This component doesn't render anything
    return null;
}
