"use client";

import { useOffer } from "@/context/OfferContext";
import { useAuth } from "@/context/AuthContext";
import { Tag } from "lucide-react";

export default function AdminOfferButton() {
    const { openSidebar } = useOffer();
    const { isAdmin } = useAuth();

    if (!isAdmin) return null;

    return (
        <button
            onClick={() => openSidebar(true)}
            className="fixed bottom-6 left-6 z-40 bg-[#0E4D55] text-white p-4 rounded-full shadow-xl hover:bg-[#0a383f] transition-all hover:scale-105 group flex items-center gap-2"
        >
            <Tag size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                Add Discount
            </span>
        </button>
    );
}
