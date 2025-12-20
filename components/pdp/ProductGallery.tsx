"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ProductImage from "@/components/ui/ProductImage";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ChevronLeft, ChevronRight, Play } from "lucide-react";

interface ProductGalleryProps {
    images: {
        edges: {
            node: {
                url: string;
                altText: string;
            };
        }[];
    };
    video?: string | null;
}

export default function ProductGallery({ images, video }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Combine images and video into a single media list
    const mediaList = [
        ...(images?.edges?.map((edge) => ({
            type: 'image',
            url: edge.node.url,
            alt: edge.node.altText || "Product image"
        })) || []),
        ...(video ? [{
            type: 'video',
            url: video,
            alt: "Product Video"
        }] : [])
    ];

    // Auto-select first item if available
    useEffect(() => {
        if (mediaList.length > 0) {
            setSelectedIndex(0);
        }
    }, [images, video]);

    if (!mediaList.length) return null;

    const nextMedia = () => {
        setSelectedIndex((prev) => (prev + 1) % mediaList.length);
    };

    const prevMedia = () => {
        setSelectedIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    };

    const selectedMedia = mediaList[selectedIndex];

    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-4 sticky top-24">
                {/* Thumbnails (Left Side on Desktop) */}
                <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-12rem)] scrollbar-hide">
                    {mediaList.map((media, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            onClick={() => setSelectedIndex(index)}
                            className={`relative w-20 h-24 md:w-24 md:h-32 flex-shrink-0 border-2 transition-all overflow-hidden bg-gray-100 ${selectedIndex === index
                                ? "border-slate-900 opacity-100"
                                : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            {media.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Play size={24} className="text-slate-900" fill="currentColor" />
                                </div>
                            ) : (
                                <Image
                                    src={media.url}
                                    alt={media.alt}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Main Media Display */}
                <motion.div
                    className="flex-1 relative aspect-[3/4] bg-gray-100 overflow-hidden group"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            {selectedMedia.type === 'video' ? (
                                <video
                                    src={selectedMedia.url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ProductImage
                                    src={selectedMedia.url}
                                    alt={selectedMedia.alt}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    containerClassName="absolute inset-0"
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Zones */}
                    <div
                        className="absolute inset-y-0 left-0 w-1/4 cursor-[w-resize] z-10"
                        onClick={prevMedia}
                        title="Previous"
                    />
                    <div
                        className="absolute inset-y-0 right-0 w-1/4 cursor-[e-resize] z-10"
                        onClick={nextMedia}
                        title="Next"
                    />

                    {/* Zoom Button (Only for Images) */}
                    {selectedMedia.type === 'image' && (
                        <button
                            onClick={() => setIsLightboxOpen(true)}
                            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform z-20"
                        >
                            <ZoomIn size={20} />
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Lightbox Modal (Only for Images) */}
            <AnimatePresence>
                {isLightboxOpen && selectedMedia.type === 'image' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                        >
                            <ChevronLeft size={48} />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                        >
                            <ChevronRight size={48} />
                        </button>

                        <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <Image
                                src={selectedMedia.url}
                                alt="Zoomed View"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
