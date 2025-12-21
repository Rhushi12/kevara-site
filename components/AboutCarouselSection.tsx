"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Upload, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";

interface CarouselImage {
    src: string;
    caption: string;
}

interface AboutCarouselSectionProps {
    data?: {
        heading?: string;
        images?: CarouselImage[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutCarouselSection({ data = {}, isEditMode = false, onUpdate }: AboutCarouselSectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const {
        heading = "EXPLORE OUR PORTFOLIO",
        images = [
            { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop", caption: "SS24 - Runway" },
            { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop", caption: "The Studio" },
            { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop", caption: "Craft Store" }
        ]
    } = data;

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const updateImageCaption = (index: number, caption: string) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], caption };
        updateField("images", newImages);
    };

    const addImage = () => {
        const newImages = [...images, {
            src: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
            caption: "New Image"
        }];
        updateField("images", newImages);
    };

    const deleteImage = (index: number) => {
        if (images.length <= 1) {
            alert("You must have at least one image");
            return;
        }
        const newImages = images.filter((_, idx) => idx !== index);
        updateField("images", newImages);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const uploadData = await res.json();
                const newImages = [...images];
                newImages[index] = { ...newImages[index], src: uploadData.url };
                updateField("images", newImages);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingIndex(null);
        }
    };

    const checkScrollPosition = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScrollPosition();
        container.addEventListener('scroll', checkScrollPosition);
        window.addEventListener('resize', checkScrollPosition);

        return () => {
            container.removeEventListener('scroll', checkScrollPosition);
            window.removeEventListener('resize', checkScrollPosition);
        };
    }, [images]);

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 396 + 60; // Image width + gap
        const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    };

    return (
        <section className="w-full mt-12 md:mt-20">
            <div
                className="relative w-full min-h-[600px] md:min-h-[771px] bg-[#003840] overflow-hidden"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Small Heading */}
                <div className="pt-[60px] md:pt-[80px] text-center">
                    {isEditMode ? (
                        <EditableText
                            value={heading}
                            onSave={(val) => updateField("heading", val)}
                            isAdmin={true}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-white font-figtree bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                        />
                    ) : (
                        <p className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-white font-figtree">
                            {heading}
                        </p>
                    )}
                </div>

                {/* Carousel Container */}
                <div className="relative mt-[36px] md:mt-[48px] px-4 md:px-12">
                    {/* Left Arrow */}
                    <AnimatePresence>
                        {isHovered && canScrollLeft && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                onClick={() => scroll('left')}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            >
                                <ChevronLeft size={24} className="text-[#003840]" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Right Arrow */}
                    <AnimatePresence>
                        {isHovered && canScrollRight && (
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                onClick={() => scroll('right')}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            >
                                <ChevronRight size={24} className="text-[#003840]" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Images */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-[40px] md:gap-[60px] overflow-x-auto scrollbar-hide pb-4 touch-pan-y"
                        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                    >
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                className="flex-shrink-0 flex flex-col items-center"
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                {/* Image */}
                                <div className="relative w-[280px] h-[350px] md:w-[396px] md:h-[495px] rounded-lg overflow-hidden group">
                                    <Image
                                        src={img.src}
                                        alt={img.caption}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* Upload Overlay (Edit Mode) */}
                                    {isEditMode && (
                                        <>
                                            <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                                                <Upload size={14} />
                                                <span className="text-xs font-medium text-black">Change</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, idx)}
                                                    className="hidden"
                                                    disabled={uploadingIndex === idx}
                                                />
                                            </label>
                                            <button
                                                onClick={() => deleteImage(idx)}
                                                className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm p-2 rounded-full shadow-lg cursor-pointer hover:bg-red-600 transition-colors z-30"
                                            >
                                                <X size={14} className="text-white" />
                                            </button>
                                        </>
                                    )}

                                    {uploadingIndex === idx && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                                            <div className="bg-white px-4 py-2 rounded-lg">
                                                <p className="text-xs font-medium text-black">Uploading...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Caption */}
                                <div className="mt-[20px] md:mt-[28px] text-center">
                                    {isEditMode ? (
                                        <EditableText
                                            value={img.caption}
                                            onSave={(val) => updateImageCaption(idx, val)}
                                            isAdmin={true}
                                            className="text-[15px] leading-[26px] text-white font-figtree bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                                        />
                                    ) : (
                                        <span className="text-[15px] leading-[26px] text-white font-figtree">
                                            {img.caption}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add Image Placeholder (Edit Mode) */}
                        {isEditMode && (
                            <div
                                className="flex-shrink-0 flex flex-col items-center cursor-pointer"
                                style={{ scrollSnapAlign: 'start' }}
                                onClick={addImage}
                            >
                                <div className="relative w-[280px] h-[350px] md:w-[396px] md:h-[495px] rounded-lg overflow-hidden border-2 border-dashed border-white/40 hover:border-white/80 transition-colors bg-white/5 hover:bg-white/10 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Plus size={40} className="text-white/60" />
                                        <span className="text-white/60 text-sm font-medium">Add Image</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
