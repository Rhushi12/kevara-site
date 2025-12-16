"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useOffer } from "@/context/OfferContext";

// Use a module-level variable to track if the offer has been triggered in this page load session.
// This survives component re-renders but resets on hard refresh, which matches requirements.
let hasTriggeredSession = false;

export default function FirstVisitHandler() {
    const pathname = usePathname();
    const { openSidebar } = useOffer();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        if (pathname === "/" && !hasTriggeredSession) {
            hasTriggeredSession = true;

            // Delay opening to allow site to load and preloader to finish
            const timer = setTimeout(() => {
                openSidebar();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [pathname, openSidebar]);

    return null;
}
