"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import PremiumImageLoader from "@/components/ui/PremiumImageLoader";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";

interface ScrollFadeBannerProps {
    data?: {
        image?: string;
        image2?: string;
        heading?: string;
        subheading?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
    singleImageOnMobile?: boolean; // New prop
}

export default function ScrollFadeBanner({ data = {}, isEditMode = false, onUpdate, singleImageOnMobile = false }: ScrollFadeBannerProps) {
    const { scrollY } = useScroll();

    // Detect if we're on mobile (under 768px)
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Only apply parallax effects on mobile
    const textOpacity = useTransform(scrollY, [0, 300], isMobile ? [1, 0] : [1, 1]);
    const textY = useTransform(scrollY, [0, 400], isMobile ? [0, -150] : [0, 0]);

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


    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [currentUploadField, setCurrentUploadField] = useState<'image' | 'image2' | null>(null);

    const handleUploadComplete = async (file: File) => {
        if (!currentUploadField) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const data = await res.json();
                updateField(currentUploadField, data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadModalOpen(false);
            setCurrentUploadField(null);
        }
    };

    const openUploadModal = (field: 'image' | 'image2') => {
        setCurrentUploadField(field);
        setUploadModalOpen(true);
    };

    return (
        <section className="sticky top-0 inset-x-0 z-0 w-full flex justify-center overflow-hidden group">
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
                className="relative grid grid-cols-1 md:grid-cols-2 w-full gap-0"
            >
                {/* Left Image - Full width on mobile if single image mode */}
                <motion.div
                    className={`relative group/left w-full overflow-hidden ${singleImageOnMobile ? "h-[60vh] md:h-[528px]" : "h-[528px]"}`}
                >
                    <PremiumImageLoader
                        src={image}
                        alt={heading}
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Left Image Upload Button (Edit Mode) */}
                    {isEditMode && (
                        <button
                            onClick={() => openUploadModal('image')}
                            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30 opacity-0 group-hover/left:opacity-100"
                        >
                            <span className="text-xs font-medium text-black">Change Image 1</span>
                        </button>
                    )}
                </motion.div>

                {/* Right Image - Hidden on mobile if singleImageOnMobile is true */}
                <motion.div
                    className={`relative group/right w-full overflow-hidden ${singleImageOnMobile ? "hidden md:block md:h-[528px]" : "block h-[528px]"}`}
                >
                    <PremiumImageLoader
                        src={image2}
                        alt={heading}
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                        sizes="50vw"
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Right Image Upload Button (Edit Mode) */}
                    {isEditMode && (
                        <button
                            onClick={() => openUploadModal('image2')}
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30 opacity-0 group-hover/right:opacity-100"
                        >
                            <span className="text-xs font-medium text-black">Change Image 2</span>
                        </button>
                    )}
                </motion.div>

                {/* Centered Text Content - Spanning Both Images */}
                <motion.div
                    style={{ opacity: textOpacity, y: textY }}
                    className="absolute inset-0 w-full flex flex-col items-center justify-center text-center px-4 z-10 pointer-events-none"
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
                </motion.div>
            </div>

            <SimpleImageUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUploadComplete}
                title={`Upload Banner Image`}
                aspectRatio={singleImageOnMobile && isMobile ? 3 / 4 : 16 / 9}
            />
        </section >
    );
}
