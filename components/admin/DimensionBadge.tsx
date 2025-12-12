"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize2 } from "lucide-react";

interface DimensionBadgeProps {
    isAdmin?: boolean;
    className?: string;
}

export default function DimensionBadge({ isAdmin = false, className = "" }: DimensionBadgeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!isAdmin) return;

        const updateDimensions = () => {
            const parent = containerRef.current?.parentElement;
            if (parent) {
                setDimensions({
                    width: Math.round(parent.offsetWidth),
                    height: Math.round(parent.offsetHeight)
                });
            }
        };

        updateDimensions();

        // Update on resize
        const resizeObserver = new ResizeObserver(updateDimensions);
        const parent = containerRef.current?.parentElement;
        if (parent) {
            resizeObserver.observe(parent);
        }

        return () => resizeObserver.disconnect();
    }, [isAdmin]);

    if (!isAdmin || !dimensions) return <div ref={containerRef} className="hidden" />;

    return (
        <div
            ref={containerRef}
            className={`absolute bottom-2 right-2 z-30 flex items-center gap-1.5 px-2 py-1 
                bg-black/60 backdrop-blur-md text-white text-[10px] font-mono rounded-md
                shadow-lg border border-white/10 pointer-events-none ${className}`}
        >
            <Maximize2 size={10} className="opacity-70" />
            <span>{dimensions.width} × {dimensions.height}</span>
        </div>
    );
}
