"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import PremiumImageLoader from "@/components/ui/PremiumImageLoader";
import { HERO_SLIDES } from "@/lib/heroData";
import LiquidButton from "@/components/ui/LiquidButton";

import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import DimensionBadge from "@/components/admin/DimensionBadge";
import { authUpload } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";

interface HeroSliderProps {
    slides?: typeof HERO_SLIDES;
    isEditMode?: boolean;
    onUpdate?: (slides: typeof HERO_SLIDES) => void;
    mobileHeight?: string;
}

export default function HeroSlider({ slides = HERO_SLIDES, isEditMode = false, onUpdate, mobileHeight = "h-[85vh]" }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { showToast } = useToast();

    // Phase 1: Initial Load Delay (0.5s)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Cycle to next slide
    const nextSlide = () => {
        if (slides.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }
    };

    const activeSlide = slides[currentSlide] || slides[0];

    // Handle updates
    const updateSlide = (field: string, value: string) => {
        if (!onUpdate) return;
        const newSlides = [...slides];
        newSlides[currentSlide] = { ...newSlides[currentSlide], [field]: value };
        onUpdate(newSlides);
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authUpload('/api/upload', formData);
            const data = await res.json();

            if (!data.success) throw new Error("Upload failed");

            const previewUrl = URL.createObjectURL(file);
            const imageUrl = data.url || previewUrl;

            const newSlides = [...slides];
            newSlides[currentSlide] = { ...newSlides[currentSlide], image: imageUrl, image_id: data.fileId };
            onUpdate(newSlides);
            setIsUploadModalOpen(false);
        } catch (error) {
            console.error("Upload failed:", error);
            showToast("Failed to upload image", "error");
        }
    };

    const addNewSlide = () => {
        if (!onUpdate) return;
        const newSlide = {
            id: Date.now(),
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
            heading: "New Slide Heading",
            subheading: "New Subheading",
            buttonText: "Shop Now",
            link: "/collections/all",
        };
        onUpdate([...slides, newSlide]);
        // Move to the new slide
        setCurrentSlide(slides.length);
    };

    const removeCurrentSlide = () => {
        if (!onUpdate || slides.length <= 1) return;
        const newSlides = slides.filter((_, index) => index !== currentSlide);
        onUpdate(newSlides);
        setCurrentSlide(0);
    };

    const slideVariants: Variants = {
        initial: {
            zIndex: 0,
            clipPath: "inset(0 0 0 0%)", // Fully visible
        },
        animate: {
            zIndex: 0,
            clipPath: "inset(0 0 0 0%)",
            transition: { duration: 0.5, ease: "easeIn" }, // Start slow, accelerate out
        },
        exit: {
            zIndex: 10,
            clipPath: "inset(0 100% 0 0)", // Wipe from Right to Left (hide right side)
            transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] }, // easeInQuint
        },
    };

    // Task 2: Focal Typography & Layout
    const textContainerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.5, // Shortened delay
            },
        },
    };

    const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 20 }, // Fade Up (Bottom to Top)
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] } }, // easeInQuint
    };

    const fadeInVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] } }, // easeInQuint
    };

    if (!activeSlide) return null;

    return (
        <div className={`relative ${mobileHeight} md:h-screen w-full overflow-hidden bg-[#FDFBF7]`}>
            {/* ... controls ... */}
            {isEditMode && (
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    {/* ... buttons ... */}
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm transition-colors"
                    >
                        Change Image
                    </button>
                    <button
                        onClick={addNewSlide}
                        className="bg-[#006D77] hover:bg-[#005a63] text-white px-4 py-2 rounded-full text-sm transition-colors shadow-lg"
                    >
                        + Add Slide
                    </button>
                    {slides.length > 1 && (
                        <button
                            onClick={removeCurrentSlide}
                            className="bg-red-500/80 hover:bg-red-600/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm transition-colors"
                        >
                            Remove Slide
                        </button>
                    )}
                </div>
            )}

            {/* Teal Background Layer - Animates away when first slide loads */}
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

            <AnimatePresence mode="popLayout" initial={false}>
                {isLoaded && (
                    <motion.div
                        key={activeSlide.id}
                        className="absolute inset-0 w-full h-full"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = Math.abs(offset.x) * velocity.x;
                            const swipeConfidenceThreshold = 10000;
                            if (swipe < -swipeConfidenceThreshold) {
                                nextSlide();
                            } else if (swipe > swipeConfidenceThreshold) {
                                setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
                            }
                        }}
                        style={{ x: 0 }} // Ensure no residual transform
                    >
                        {/* Image Layer */}
                        <div className="relative w-full h-full">
                            {activeSlide.image && typeof activeSlide.image === 'string' && activeSlide.image.trim() !== "" ? (
                                <PremiumImageLoader
                                    src={activeSlide.image}
                                    alt={activeSlide.heading || "Hero Slide"}
                                    fill
                                    className="object-cover"
                                    priority
                                    quality={100}
                                    sizes="100vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                                    No Image
                                </div>
                            )}
                            <DimensionBadge isAdmin={isEditMode} />
                        </div>

                        {/* Text Layer */}
                        <div className={`absolute inset-0 flex items-center ${activeSlide.alignment === "center" ? "justify-center text-center px-4" : activeSlide.alignment === "right" ? "justify-end text-right pr-10 md:pr-32" : "justify-start text-left pl-10 md:pl-32"} z-30 pointer-events-none`}>
                            <div className={`text-white max-w-4xl pointer-events-auto ${activeSlide.alignment === "center" ? "items-center" : activeSlide.alignment === "right" ? "items-end" : "items-start"} flex flex-col`}>
                                <motion.div
                                    variants={textContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    key={`text-${activeSlide.id}`}
                                    className={`flex flex-col ${activeSlide.alignment === "center" ? "items-center" : activeSlide.alignment === "right" ? "items-end" : "items-start"}`}
                                >
                                    <motion.div variants={fadeInVariants} className="mb-4">
                                        {isEditMode ? (
                                            <div className="flex flex-col gap-2">
                                                {/* Alignment Controls */}
                                                <div className="flex gap-1 bg-black/50 rounded p-1 mb-2 self-start">
                                                    <button onClick={() => updateSlide("alignment", "left")} className={`p-1 rounded ${activeSlide.alignment === "left" || !activeSlide.alignment ? "bg-white text-black" : "text-white"}`}>L</button>
                                                    <button onClick={() => updateSlide("alignment", "center")} className={`p-1 rounded ${activeSlide.alignment === "center" ? "bg-white text-black" : "text-white"}`}>C</button>
                                                    <button onClick={() => updateSlide("alignment", "right")} className={`p-1 rounded ${activeSlide.alignment === "right" ? "bg-white text-black" : "text-white"}`}>R</button>
                                                </div>
                                                <EditableText
                                                    value={activeSlide.subheading}
                                                    onSave={(val) => updateSlide("subheading", val)}
                                                    isAdmin={true}
                                                    className="text-[11px] md:text-[13px] leading-[16px] font-bold font-figtree tracking-[0.2em] uppercase bg-transparent text-white border-b border-white/20"
                                                />
                                            </div>
                                        ) : (
                                            <h2 className="text-[11px] md:text-[13px] leading-[16px] font-bold font-figtree tracking-[0.2em] uppercase">
                                                {activeSlide.subheading}
                                            </h2>
                                        )}
                                    </motion.div>

                                    <motion.div variants={fadeUpVariants} className="mb-6 md:mb-8">
                                        {isEditMode ? (
                                            <EditableText
                                                value={activeSlide.heading}
                                                onSave={(val) => updateSlide("heading", val)}
                                                isAdmin={true}
                                                className="text-[36px] md:text-6xl font-normal font-lora bg-transparent text-white border-b border-white/20"
                                            />
                                        ) : (
                                            <h1 className="text-[36px] md:text-6xl font-normal font-lora text-white mb-4">
                                                {activeSlide.heading}
                                            </h1>
                                        )}
                                    </motion.div>

                                    <motion.div variants={fadeUpVariants} className="flex gap-4">
                                        {isEditMode ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex gap-2">
                                                    <EditableText
                                                        value={activeSlide.buttonText}
                                                        onSave={(val) => updateSlide("buttonText", val)}
                                                        isAdmin={true}
                                                        className="bg-transparent text-white border-b border-white/20 min-w-[100px]"
                                                        placeholder="Primary Btn"
                                                    />
                                                    <EditableText
                                                        value={activeSlide.link}
                                                        onSave={(val) => updateSlide("link", val)}
                                                        isAdmin={true}
                                                        className="bg-transparent text-white border-b border-white/20 min-w-[100px] text-xs"
                                                        placeholder="Primary Link"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <EditableText
                                                        value={activeSlide.secondaryButtonText || ""}
                                                        onSave={(val) => updateSlide("secondaryButtonText", val)}
                                                        isAdmin={true}
                                                        className="bg-transparent text-white border-b border-white/20 min-w-[100px]"
                                                        placeholder="Secondary Btn"
                                                    />
                                                    <EditableText
                                                        value={activeSlide.secondaryButtonLink || ""}
                                                        onSave={(val) => updateSlide("secondaryButtonLink", val)}
                                                        isAdmin={true}
                                                        className="bg-transparent text-white border-b border-white/20 min-w-[100px] text-xs"
                                                        placeholder="Secondary Link"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <LiquidButton
                                                    href={activeSlide.link}
                                                    onClick={() => {
                                                        if (!activeSlide.link) {
                                                            const newSlug = `page-${Date.now()}`;
                                                            const newUrl = `/pages/${newSlug}`;
                                                            updateSlide("link", newUrl);
                                                            window.open(newUrl, '_blank');
                                                        }
                                                    }}
                                                    variant="secondary"
                                                    className="border-none text-sm md:text-base px-6 py-2 md:px-8 md:py-3"
                                                >
                                                    {activeSlide.buttonText}
                                                </LiquidButton>

                                                {activeSlide.secondaryButtonText && (
                                                    <LiquidButton
                                                        href={activeSlide.secondaryButtonLink}
                                                        onClick={() => {
                                                            if (!activeSlide.secondaryButtonLink) {
                                                                const newSlug = `page-${Date.now()}`;
                                                                const newUrl = `/pages/${newSlug}`;
                                                                updateSlide("secondaryButtonLink", newUrl);
                                                                window.open(newUrl, '_blank');
                                                            }
                                                        }}
                                                        variant="secondary"
                                                        className="border-none text-sm md:text-base px-6 py-2 md:px-8 md:py-3"
                                                    >
                                                        {activeSlide.secondaryButtonText}
                                                    </LiquidButton>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Indicators - Sharp & Thin (Clickable) */}
            {
                isLoaded && slides.length > 1 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                onClick={() => setCurrentSlide(index)}
                                className="h-[2px] w-16 bg-white/30 rounded-none overflow-hidden cursor-pointer hover:bg-white/50 transition-colors"
                                aria-label={`Go to slide ${index + 1}`}
                            >
                                {index === currentSlide && (
                                    <motion.div
                                        key={`progress-${currentSlide}-${slides.length}`}
                                        className="h-full bg-white"
                                        initial={{ width: "0%" }}
                                        animate={{
                                            width: "100%",
                                            transition: {
                                                duration: 5,
                                                ease: "linear",
                                            },
                                        }}
                                        onAnimationComplete={() => {
                                            if (index === currentSlide && !isEditMode) {
                                                nextSlide();
                                            }
                                        }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )
            }

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
                aspectRatio={16 / 9}
            />
        </div >
    );
}
