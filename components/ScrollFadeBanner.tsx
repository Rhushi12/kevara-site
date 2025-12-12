"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import EditableText from "@/components/admin/EditableText";

interface ScrollFadeBannerProps {
    data?: {
        image?: string;
        image2?: string;
        heading?: string;
        subheading?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function ScrollFadeBanner({ data = {}, isEditMode = false, onUpdate }: ScrollFadeBannerProps) {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const [isLoaded, setIsLoaded] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=688&h=528&fit=crop",
        image2 = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=688&h=528&fit=crop",
        heading = "NEW COLLECTION",
        subheading = "Discover the latest trends"
    } = data;

    // Initial load animation - same timing as homepage (0.5s delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const [isUploading, setIsUploading] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<1 | 2 | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageField: 'image' | 'image2') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadingIndex(imageField === 'image' ? 1 : 2);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                updateField(imageField, data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            setUploadingIndex(null);
        }
    };

    return (
        <section className="relative overflow-hidden group">
            {/* Teal Background Layer - Animates away when loaded (same as homepage) */}
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        className="absolute inset-0 z-20 bg-[#006D77]"
                        initial={{ clipPath: "inset(0 0 0 0%)" }}
                        exit={{
                            clipPath: "inset(0 100% 0 0)",
                            transition: { duration: 0.8, ease: [0.7, 0, 0.84, 0] }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Two Image Grid */}
            <div
                className="relative grid grid-cols-1 md:grid-cols-2 mx-auto"
                style={{
                    maxWidth: "1376px",
                    gap: "0px"
                }}
            >
                {/* Left Image */}
                <div
                    className="relative group/left"
                    style={{ width: "688px", height: "528px", maxWidth: "100%" }}
                >
                    <Image
                        src={image}
                        alt={heading}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Left Image Upload Button (Edit Mode) */}
                    {isEditMode && (
                        <label className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30 opacity-0 group-hover/left:opacity-100">
                            <span className="text-xs font-medium text-black">Change Image 1</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'image')}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    )}

                    {isUploading && uploadingIndex === 1 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                            <div className="bg-white px-4 py-2 rounded-lg">
                                <p className="text-xs font-medium text-black">Uploading...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Image */}
                <div
                    className="relative group/right"
                    style={{ width: "688px", height: "528px", maxWidth: "100%" }}
                >
                    <Image
                        src={image2}
                        alt={heading}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Right Image Upload Button (Edit Mode) */}
                    {isEditMode && (
                        <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30 opacity-0 group-hover/right:opacity-100">
                            <span className="text-xs font-medium text-black">Change Image 2</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'image2')}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    )}

                    {isUploading && uploadingIndex === 2 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                            <div className="bg-white px-4 py-2 rounded-lg">
                                <p className="text-xs font-medium text-black">Uploading...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Centered Text Content - Spanning Both Images */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10 pointer-events-none"
                >
                    {isEditMode ? (
                        <div className="pointer-events-auto">
                            <EditableText
                                value={subheading}
                                onSave={(val) => updateField("subheading", val)}
                                isAdmin={true}
                                className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-white/90 mb-4 bg-white/10 border-b border-white/30 px-4 py-2"
                            />
                            <EditableText
                                value={heading}
                                onSave={(val) => updateField("heading", val)}
                                isAdmin={true}
                                className="text-4xl md:text-6xl lg:text-7xl font-lora text-white mb-6 bg-white/10 border-b border-white/30 px-4 py-2"
                            />
                        </div>
                    ) : (
                        <AnimatePresence>
                            {isLoaded && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    className="flex flex-col items-center"
                                    variants={{
                                        hidden: {},
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.1,
                                                delayChildren: 0.3
                                            }
                                        }
                                    }}
                                >
                                    <motion.p
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] }
                                            }
                                        }}
                                        className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-white/90 mb-4"
                                    >
                                        {subheading}
                                    </motion.p>
                                    <motion.h1
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] }
                                            }
                                        }}
                                        className="text-4xl md:text-6xl lg:text-7xl font-lora text-white mb-6"
                                    >
                                        {heading}
                                    </motion.h1>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </section>
    );
}
