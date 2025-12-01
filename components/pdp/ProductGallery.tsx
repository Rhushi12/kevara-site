"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
    images: {
        edges: {
            node: {
                url: string;
                altText: string;
            };
        }[];
    };
}

export default function ProductGallery({ images }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const imageList = images?.edges?.map((edge) => edge.node) || [];

    // Auto-select first image if available
    useEffect(() => {
        if (imageList.length > 0) {
            setSelectedImage(0);
        }
    }, [images]);

    if (!imageList.length) return null;

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % imageList.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-4 sticky top-24">
                {/* Thumbnails (Left Side on Desktop) */}
                <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-12rem)] scrollbar-hide">
                    {imageList.map((image, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            onClick={() => setSelectedImage(index)}
                            className={`relative w-20 h-24 md:w-24 md:h-32 flex-shrink-0 border-2 transition-all ${selectedImage === index
                                ? "border-slate-900 opacity-100"
                                : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={image.altText || `Product thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="96px"
                            />
                        </motion.button>
                    ))}
                </div>

                {/* Main Image */}
                <motion.div
                    className="flex-1 relative aspect-[3/4] bg-gray-100 overflow-hidden group"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={imageList[selectedImage]?.url}
                                alt={imageList[selectedImage]?.altText || "Product image"}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Zones */}
                    <div
                        className="absolute inset-y-0 left-0 w-1/2 cursor-[w-resize] z-10"
                        onClick={prevImage}
                        title="Previous Image"
                    />
                    <div
                        className="absolute inset-y-0 right-0 w-1/2 cursor-[e-resize] z-10"
                        onClick={nextImage}
                        title="Next Image"
                    />

                    {/* Zoom Button */}
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform z-20"
                    >
                        <ZoomIn size={20} />
                    </button>
                </motion.div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
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
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        >
                            <ChevronLeft size={48} />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        >
                            <ChevronRight size={48} />
                        </button>

                        <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <Image
                                src={imageList[selectedImage]?.url}
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
