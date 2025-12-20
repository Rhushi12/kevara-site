"use client";

import { MessageSquare } from "lucide-react";
import { useWholesaleInquiryStore } from "@/lib/store";

export default function WholesaleFloatingButton() {
    const { openInquiry } = useWholesaleInquiryStore();

    return (
        <button
            onClick={() => openInquiry("General Inquiry", "")}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] bg-[#0E4D55] text-white p-3 sm:p-4 rounded-full shadow-xl hover:bg-[#0a383f] transition-all hover:scale-105 group flex items-center gap-2"
        >
            <MessageSquare size={22} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                Wholesale Inquiry
            </span>
        </button>
    );
}
