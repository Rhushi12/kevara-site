"use client";

import { useEffect, useState, useRef } from "react";

interface MarqueeItem {
    id: string;
    handle: string;
    text: string;
}

export default function Marquee() {
    const [items, setItems] = useState<MarqueeItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/admin/marquee")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setItems(data);
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    // Default fallback if no metaobjects exist yet
    const displayTexts = items.length > 0
        ? items.map(i => i.text)
        : ["PREMIUM COTTON", "MADE IN INDIA", "FREE SHIPPING ABOVE ₹999", "EASY RETURNS"];

    // Build single continuous string with diamond separators
    const singlePass = displayTexts.map(t => t.toUpperCase()).join("  ◆  ") + "  ◆  ";
    // Repeat enough times for seamless loop
    const repeatCount = 8;

    if (!loaded) return null; // Don't render during SSR flash

    return (
        <div className="relative overflow-hidden bg-[#0E4D55] select-none">
            {/* Subtle top edge accent */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="py-2.5 md:py-3 overflow-hidden whitespace-nowrap">
                <div
                    ref={containerRef}
                    className="inline-flex animate-marquee-scroll"
                >
                    {Array.from({ length: repeatCount }).map((_, i) => (
                        <span
                            key={i}
                            className="text-[11px] md:text-xs font-figtree font-medium tracking-[0.25em] text-white/90 px-1 shrink-0"
                        >
                            {singlePass}
                        </span>
                    ))}
                </div>
            </div>

            {/* Subtle bottom edge accent */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}
