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
    imageWidth?: number;
    imageHeight?: number;
}

export default function MenuCarousel({
    images,
    isAdmin,
    onDelete,
    onAdd,
    imageWidth = 180,
    imageHeight = 225
}: MenuCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative group/carousel h-full">
            {/* Scrollable Carousel Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-8 overflow-x-auto h-full items-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        className="relative group shrink-0"
                        style={{ width: `${imageWidth}px` }}
                    >
                        <Link href={img.href} className="block relative">
                            <div
                                className="relative overflow-hidden bg-gray-100 rounded-sm"
                                style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
                            >
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
                            <div className="text-center mt-4">
                                <span className="text-xs font-geist uppercase tracking-[0.2em] text-slate-900">
                                    {img.label}
                                </span>
                            </div>
                        </Link>
                    </div>
                ))}

                {/* Add Collection Placeholder */}
                {isAdmin && onAdd && (
                    <div
                        className="relative group shrink-0 cursor-pointer"
                        style={{ width: `${imageWidth}px` }}
                        onClick={onAdd}
                    >
                        <div
                            className="overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 hover:border-[#006D77] transition-colors flex flex-col items-center justify-center gap-2 group-hover:bg-[#006D77]/5 rounded-sm"
                            style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
                        >
                            <Plus size={24} className="text-gray-400 group-hover:text-[#006D77] transition-colors" />
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#006D77] uppercase tracking-widest">
                                Add
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
