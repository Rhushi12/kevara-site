"use client";

import { useEffect } from "react";
import { useWholesaleInquiryStore } from "@/lib/store";
import WholesaleInquiryModal from "@/components/pdp/WholesaleInquiryModal";

/**
 * Global Wholesale Inquiry Modal
 * 
 * This component listens for:
 * 1. Store state changes (openInquiry/closeInquiry)
 * 2. Hash changes in the URL (#wholesale-inquiry)
 * 
 * Usage: Add `#wholesale-inquiry` as a link to any button to trigger this modal
 */
export default function GlobalWholesaleInquiryModal() {
    const { isOpen, productTitle, productHandle, openInquiry, closeInquiry } = useWholesaleInquiryStore();

    // Listen for hash changes to trigger modal
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === "#wholesale-inquiry") {
                openInquiry();
                // Remove hash from URL after opening (cleaner UX)
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
            }
        };

        // Check initial hash on mount
        handleHashChange();

        // Listen for hash changes
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [openInquiry]);

    // Also handle clicks on links with #wholesale-inquiry
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (anchor) {
                const href = anchor.getAttribute("href");
                if (href === "#wholesale-inquiry") {
                    e.preventDefault();
                    openInquiry();
                }
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [openInquiry]);

    return (
        <WholesaleInquiryModal
            isOpen={isOpen}
            onClose={closeInquiry}
            productTitle={productTitle}
            productHandle={productHandle}
        />
    );
}
