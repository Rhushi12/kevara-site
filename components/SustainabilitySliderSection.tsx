"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

interface SliderItem {
    image: string;
    label: string;
    heading: string;
    description: string;
}

interface SustainabilitySliderSectionProps {
    data?: {
        items?: SliderItem[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilitySliderSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilitySliderSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const {
        items = [
            {
                image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                label: "RESPONSIBLE MATERIALS",
                heading: "Crafted With Care",
                description: "We source only the finest sustainable fabrics, from organic cotton to recycled polyester. Each material is carefully selected to minimize environmental impact while maximizing comfort and durability."
            },
            {
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
                label: "ETHICAL PRODUCTION",
                heading: "Made With Purpose",
                description: "Our manufacturing partners share our values. We ensure fair wages, safe working conditions, and transparent supply chains in every step of our production process."
            },
            {
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                label: "CIRCULAR FASHION",
                heading: "Designed To Last",
                description: "Every piece is designed for longevity, not fast fashion. We create timeless styles that transcend seasons, reducing waste and promoting a more sustainable wardrobe."
            }
        ]
    } = data;

    const SLIDE_DURATION = 5000; // 5 seconds per slide

    // Auto-advance slides
    useEffect(() => {
        if (isEditMode) return;

        const timer = setTimeout(() => {
            nextSlide();
        }, SLIDE_DURATION);

        return () => clearTimeout(timer);
    }, [currentIndex, isEditMode]);

    const nextSlide = () => {
        if (items.length > 0) {
            setIsAnimating(true);
            setCurrentIndex((prev) => (prev + 1) % items.length);
            setTimeout(() => setIsAnimating(false), 1200);
        }
    };

    const goToSlide = (index: number) => {
        if (index !== currentIndex) {
            setIsAnimating(true);
            setCurrentIndex(index);
            setTimeout(() => setIsAnimating(false), 1200);
        }
    };

    const updateItem = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate({ ...data, items: newItems });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const uploadData = await res.json();
                updateItem(index, 'image', uploadData.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingIndex(null);
        }
    };

    const activeItem = items[currentIndex];

    // Image reveal animation (slide from right to left like HeroSlider)
    const imageVariants: Variants = {
        initial: {
            clipPath: "inset(0 0 0 100%)", // Start fully hidden from left
        },
        animate: {
            clipPath: "inset(0 0 0 0%)", // Reveal from left to right
            transition: { duration: 0.8, ease: [0.7, 0, 0.84, 0] },
        },
        exit: {
            clipPath: "inset(0 100% 0 0)", // Wipe to left
            transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] },
        },
    };

    // Label reveal animation (slower)
    const labelRevealVariants: Variants = {
        hidden: {
            y: "100%",
            opacity: 0
        },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.7, 0, 0.84, 0]
            }
        },
    };

    // Heading reveal animation (slower, comes after label)
    const headingRevealVariants: Variants = {
        hidden: {
            y: "100%",
            opacity: 0
        },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.9,
                delay: 0.2,
                ease: [0.7, 0, 0.84, 0]
            }
        },
    };

    // Description opacity fade in (after headings complete)
    const descriptionVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.8,
                delay: 1.1, // After heading animation completes (0.2 + 0.9)
                ease: "easeOut"
            }
        },
    };

    return (
        <section className="w-full flex justify-center bg-[#F0F9F9]">
            <div className="w-full max-w-[1374px] h-auto md:h-[669px] flex flex-col md:flex-row relative">
                {/* Left: Image Slider */}
                <div
                    className="relative flex-shrink-0 rounded-sm overflow-hidden"
                    style={{
                        width: '509px',
                        height: '509px',
                        marginTop: '80px',
                        marginLeft: '107px'
                    }}
                >
                    {/* Teal Background for Reveal */}
                    <div className="absolute inset-0 bg-[#006D77] z-0" />

                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={currentIndex}
                            className="absolute inset-0 z-10"
                            variants={imageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <Image
                                src={activeItem.image}
                                alt={activeItem.heading}
                                fill
                                className="object-cover"
                            />

                            {/* Upload Overlay (Edit Mode) */}
                            {isEditMode && (
                                <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                                    <Upload size={14} />
                                    <span className="text-xs font-medium text-black">Change</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, currentIndex)}
                                        className="hidden"
                                        disabled={uploadingIndex === currentIndex}
                                    />
                                </label>
                            )}

                            {uploadingIndex === currentIndex && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                                    <div className="bg-white px-4 py-2 rounded-lg">
                                        <p className="text-xs font-medium text-black">Uploading...</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right: Text Content - Fixed 201px from top */}
                <div
                    className="flex-1 flex justify-center px-8 md:px-0"
                    style={{ paddingTop: '201px' }}
                >
                    <div className="w-full max-w-[576px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`text-${currentIndex}`}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="flex flex-col items-center text-center"
                            >
                                {/* Small Label with underline reveal */}
                                <div className="overflow-hidden mb-6">
                                    <motion.div variants={labelRevealVariants}>
                                        {isEditMode ? (
                                            <EditableText
                                                value={activeItem.label}
                                                onSave={(val) => updateItem(currentIndex, "label", val)}
                                                isAdmin={true}
                                                className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree text-center bg-gray-100 border-b border-gray-300 px-2 py-1"
                                            />
                                        ) : (
                                            <span
                                                className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree"
                                            >
                                                {activeItem.label}
                                            </span>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Main Heading with underline reveal (slower) */}
                                <div className="overflow-hidden mb-6 pb-2">
                                    <motion.div variants={headingRevealVariants}>
                                        {isEditMode ? (
                                            <EditableText
                                                value={activeItem.heading}
                                                onSave={(val) => updateItem(currentIndex, "heading", val)}
                                                isAdmin={true}
                                                className="text-[36px] leading-[40px] tracking-[-0.8px] text-[#1a1a1a] font-lora text-center bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                                            />
                                        ) : (
                                            <h2
                                                className="text-[36px] leading-[40px] tracking-[-0.8px] text-[#1a1a1a] font-lora"
                                            >
                                                {activeItem.heading}
                                            </h2>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Description with fade in (after headings) */}
                                <motion.div variants={descriptionVariants} className="mb-8">
                                    {isEditMode ? (
                                        <EditableText
                                            value={activeItem.description}
                                            onSave={(val) => updateItem(currentIndex, "description", val)}
                                            isAdmin={true}
                                            multiline={true}
                                            className="text-[15px] leading-[26px] text-[#1a1a1a] font-figtree text-center bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                                        />
                                    ) : (
                                        <p className="text-[15px] leading-[26px] text-[#1a1a1a] font-figtree">
                                            {activeItem.description}
                                        </p>
                                    )}
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress Bar */}
                        <div className="flex gap-3 justify-center mt-8">
                            {items.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className="h-[2px] w-16 bg-gray-200 rounded-none overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors"
                                    aria-label={`Go to slide ${index + 1}`}
                                >
                                    {index === currentIndex && !isEditMode && (
                                        <motion.div
                                            key={`progress-${currentIndex}`}
                                            ref={progressRef}
                                            className="h-full bg-[#006D77]"
                                            initial={{ width: "0%" }}
                                            animate={{
                                                width: "100%",
                                                transition: {
                                                    duration: SLIDE_DURATION / 1000,
                                                    ease: "linear",
                                                },
                                            }}
                                        />
                                    )}
                                    {(index !== currentIndex || isEditMode) && (
                                        <div
                                            className={`h-full ${index === currentIndex ? 'bg-[#006D77]' : 'bg-transparent'}`}
                                            style={{ width: index === currentIndex ? '100%' : '0%' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
