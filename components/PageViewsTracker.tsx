"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";

/**
 * Invisible component that tracks page views in Firebase Firestore.
 * Add this to your root layout to track all page visits.
 * 
 * Stores data in `page_views` collection with documents like:
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
                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];

                // Reference to today's document
                const viewRef = doc(db, "page_views", today);

                // Increment the view count atomically
                await setDoc(viewRef, {
                    date: today,
                    count: increment(1),
                    updatedAt: serverTimestamp()
                }, { merge: true });

                console.log("[PageViews] Tracked view for", today);
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
