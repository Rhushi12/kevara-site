"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { X, Plus } from "lucide-react";

interface MenuCarouselProps {
    images: { label: string; src: string; href: string }[];
    isAdmin?: boolean;
    onDelete?: (index: number) => void;
    onAdd?: () => void;
}

export default function MenuCarousel({ images, isAdmin, onDelete, onAdd }: MenuCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className="relative group shrink-0 snap-start"
                    style={{ width: "calc((100% - 48px) / 3)" }}
                >
                    <Link href={img.href} className="block relative">
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 mb-3 rounded-sm">
                            <Image
                                src={img.src}
                                alt={img.label}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                            {/* Delete Button Overlay */}
                            {isAdmin && onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(idx);
                                    }}
                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-600 z-10"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-geist uppercase tracking-[0.2em] text-[#006D77]">
                                {img.label}
                            </span>
                        </div>
                    </Link>
                </div>
            ))}

            {/* Add Collection Placeholder */}
            {isAdmin && onAdd && (
                <div
                    className="relative group shrink-0 snap-start cursor-pointer"
                    style={{ width: "calc((100% - 48px) / 3)" }}
                    onClick={onAdd}
                >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 mb-3 rounded-sm border-2 border-dashed border-gray-300 hover:border-[#006D77] transition-colors flex flex-col items-center justify-center gap-2 group-hover:bg-[#006D77]/5">
                        <Plus size={32} className="text-gray-400 group-hover:text-[#006D77] transition-colors" />
                        <span className="text-xs font-bold text-gray-400 group-hover:text-[#006D77] uppercase tracking-widest">
                            Add Collection
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
