"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import PremiumImageLoader from "@/components/ui/PremiumImageLoader";
import { OFFER_SLIDES } from "@/lib/offerData";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import DimensionBadge from "@/components/admin/DimensionBadge";
import { authUpload } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";

interface OfferSliderProps {
    slides?: typeof OFFER_SLIDES;
    isEditMode?: boolean;
    onUpdate?: (slides: typeof OFFER_SLIDES) => void;
}

export default function OfferSlider({ slides = OFFER_SLIDES, isEditMode = false, onUpdate }: OfferSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { showToast } = useToast();

    // Initial Load Delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 300); // Faster than hero
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
            heading: "New Offer Heading",
            subheading: "New Offer Subheading",
            buttonText: "Shop Now",
            link: "/collections/all",
        };
        onUpdate([...slides, newSlide]);
        setCurrentSlide(slides.length);
    };

    const removeCurrentSlide = () => {
        if (!onUpdate || slides.length <= 1) return;
        const newSlides = slides.filter((_, index) => index !== currentSlide);
        onUpdate(newSlides);
        setCurrentSlide(0);
    };

    const slideVariants: Variants = {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.8 } },
        exit: { opacity: 0, transition: { duration: 0.5 } },
    };

    const textContainerVariants: Variants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.1, delayChildren: 0.3 },
        },
    };

    const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    if (!activeSlide) return null;

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#FDFBF7]">
            {isEditMode && (
                <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs transition-colors"
                    >
                        Change Image
                    </button>
                    <button
                        onClick={addNewSlide}
                        className="bg-[#006D77] text-white px-4 py-2 rounded-full text-xs transition-colors shadow-lg"
                    >
                        + Add Slide
                    </button>
                    {slides.length > 1 && (
                        <button
                            onClick={removeCurrentSlide}
                            className="bg-red-500/80 text-white px-4 py-2 rounded-full text-xs transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSlide.id}
                    className="absolute inset-0 w-full h-full"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <div className="relative w-full h-full">
                        {activeSlide.image ? (
                            <PremiumImageLoader
                                src={activeSlide.image}
                                alt={activeSlide.heading}
                                fill
                                className="object-cover"
                                priority
                                quality={90}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-800" />
                        )}
                        <DimensionBadge isAdmin={isEditMode} />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Text Layer */}
                    <div className={`absolute inset-0 flex items-center ${activeSlide.alignment === "center" ? "justify-center text-center px-8" : activeSlide.alignment === "right" ? "justify-end text-right pr-10" : "justify-start text-left pl-10"} z-30`}>
                        <div className="max-w-xl text-white">
                            <motion.div
                                variants={textContainerVariants}
                                initial="hidden"
                                animate="visible"
                                key={`text-${activeSlide.id}`}
                                className="flex flex-col gap-4"
                            >
                                <motion.div variants={fadeUpVariants}>
                                    {isEditMode ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-1 bg-black/50 rounded p-1 mb-2 self-start">
                                                <button onClick={() => updateSlide("alignment", "left")} className={`p-1 text-[10px] rounded ${activeSlide.alignment === "left" || !activeSlide.alignment ? "bg-white text-black" : "text-white"}`}>L</button>
                                                <button onClick={() => updateSlide("alignment", "center")} className={`p-1 text-[10px] rounded ${activeSlide.alignment === "center" ? "bg-white text-black" : "text-white"}`}>C</button>
                                                <button onClick={() => updateSlide("alignment", "right")} className={`p-1 text-[10px] rounded ${activeSlide.alignment === "right" ? "bg-white text-black" : "text-white"}`}>R</button>
                                            </div>
                                            <EditableText
                                                value={activeSlide.subheading}
                                                onSave={(val) => updateSlide("subheading", val)}
                                                isAdmin={true}
                                                className="text-xs font-bold font-figtree tracking-widest uppercase bg-transparent text-white border-b border-white/20"
                                            />
                                        </div>
                                    ) : (
                                        <h3 className="text-xs font-bold font-figtree tracking-widest uppercase">
                                            {activeSlide.subheading}
                                        </h3>
                                    )}
                                </motion.div>

                                <motion.div variants={fadeUpVariants}>
                                    {isEditMode ? (
                                        <EditableText
                                            value={activeSlide.heading}
                                            onSave={(val) => updateSlide("heading", val)}
                                            isAdmin={true}
                                            className="text-4xl md:text-5xl font-lora font-normal bg-transparent text-white border-b border-white/20"
                                        />
                                    ) : (
                                        <h2 className="text-4xl md:text-5xl font-lora font-normal text-white">
                                            {activeSlide.heading}
                                        </h2>
                                    )}
                                </motion.div>

                                <motion.div variants={fadeUpVariants}>
                                    {isEditMode ? (
                                        <div className="flex flex-col gap-2">
                                            <EditableText
                                                value={activeSlide.buttonText}
                                                onSave={(val) => updateSlide("buttonText", val)}
                                                isAdmin={true}
                                                className="bg-transparent text-white border-b border-white/20 w-32"
                                            />
                                            <EditableText
                                                value={activeSlide.link}
                                                onSave={(val) => updateSlide("link", val)}
                                                isAdmin={true}
                                                className="bg-transparent text-white border-b border-white/20 text-xs w-48"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            <LiquidButton href={activeSlide.link} variant="secondary">
                                                {activeSlide.buttonText}
                                            </LiquidButton>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/50"}`}
                        />
                    ))}
                </div>
            )}

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
                aspectRatio={9 / 16} // Vertical focus for sidebar
            />
        </div>
    );
}
