"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function FirstVisitHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (loading) return; // Wait for auth check

        // If user is already logged in, they effectively "visited".
        // This prevents the loop: Home -> Login -> Home -> Login
        if (user) {
            // Optional: Auto-mark as visited if they are logged in
            if (!localStorage.getItem("hasVisited")) {
                localStorage.setItem("hasVisited", "true");
            }
            return;
        }

        const hasVisited = localStorage.getItem("hasVisited");

        // Allow list: pages that don't trigger the redirect
        const isAllowedPath =
            pathname.startsWith("/login") ||
            pathname.startsWith("/signup") ||
            pathname.startsWith("/admin");

        if (!hasVisited && !isAllowedPath) {
            router.push("/login");
        }
    }, [pathname, router, user, loading]);

    return null; // This component renders nothing
}
