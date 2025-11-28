"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
    images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
    const [activeImage, setActiveImage] = useState(images[0]);

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 h-full">
            {/* Thumbnails (Left on Desktop, Bottom on Mobile) */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:h-[600px] no-scrollbar snap-x md:snap-y">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`relative w-20 h-24 md:w-24 md:h-32 shrink-0 border transition-all duration-200 snap-start ${activeImage === img
                                ? "border-[#006D77] opacity-100"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                    >
                        <Image
                            src={img}
                            alt={`Product thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] md:h-[600px] bg-gray-50 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={activeImage}
                            alt="Product Main Image"
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Zoom Icon Placeholder */}
                <button className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white transition-colors">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                        <path d="M11 8v6" />
                        <path d="M8 11h6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
