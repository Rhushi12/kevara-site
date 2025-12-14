"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function FirstVisitHandler() {
    const router = useRouter();
    const pathname = usePathname();
    // We can access auth state if needed, but "First Visit" is usually independent of auth
    // (i.e. even if not logged in, we force them to login screen once).
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const hasVisited = localStorage.getItem("hasVisited");

        // Allow list: pages that don't trigger the redirect
        const isAllowedPath =
            pathname.startsWith("/login") ||
            pathname.startsWith("/signup") ||
            pathname.startsWith("/admin");

        if (!hasVisited && !isAllowedPath) {
            router.push("/login");
        }
    }, [pathname, router]);

    return null; // This component renders nothing
}
