"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Upload, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

interface TimelineItem {
    image: string;
    heading: string;
    description: string;
    year: string;
}

interface AboutTimelineSectionProps {
    data?: {
        sectionHeading?: string;
        items?: TimelineItem[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutTimelineSection({ data = {}, isEditMode = false, onUpdate }: AboutTimelineSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const {
        sectionHeading = "OUR JOURNEY",
        items = [
            {
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                heading: "The Beginning in Aarhus",
                description: "The company was founded in 2010 in Aarhus, Denmark. The philosophy of the company is founded on the legacy of Scandinavian fashion tradition.",
                year: "2010"
            },
            {
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
                heading: "Expanding Horizons",
                description: "In 2015, we expanded to international markets, bringing our Nordic design philosophy to fashion enthusiasts worldwide.",
                year: "2015"
            },
            {
                image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
                heading: "Sustainable Future",
                description: "By 2020, we committed to 100% sustainable materials, leading the industry in eco-conscious fashion practices.",
                year: "2020"
            }
        ]
    } = data;

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        updateField("items", newItems);
    };

    const addItem = () => {
        const currentYear = new Date().getFullYear();
        const newItems = [...items, {
            image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
            heading: "New Milestone",
            description: "Add a description for this milestone in your journey.",
            year: String(currentYear)
        }];
        updateField("items", newItems);
        // Set active to new item
        setTimeout(() => setActiveIndex(newItems.length - 1), 100);
    };

    const deleteItem = (index: number) => {
        if (items.length <= 1) {
            alert("You must have at least one timeline item");
            return;
        }
        const newItems = items.filter((_, idx) => idx !== index);
        updateField("items", newItems);
        if (activeIndex >= newItems.length) {
            setActiveIndex(newItems.length - 1);
        }
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

    const canGoLeft = activeIndex > 0;
    const canGoRight = activeIndex < items.length - 1;

    const goLeft = () => {
        if (canGoLeft) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const goRight = () => {
        if (canGoRight) {
            setActiveIndex(activeIndex + 1);
        }
    };

    // Calculate transform for smooth positioning
    const getTransformX = () => {
        const cardWidth = 320; // mobile
        const gap = 40;
        return -(activeIndex * (cardWidth + gap));
    };

    const getMdTransformX = () => {
        const cardWidth = 843;
        const gap = 60;
        return -(activeIndex * (cardWidth + gap));
    };

    // Touch swipe handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && canGoRight) {
            setActiveIndex(activeIndex + 1);
        }
        if (isRightSwipe && canGoLeft) {
            setActiveIndex(activeIndex - 1);
        }
    };

    // Trackpad/mousepad horizontal scroll gesture handler
    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedDeltaRef = useRef(0);
    const [isWheelLocked, setIsWheelLocked] = useState(false);

    const onWheel = (e: React.WheelEvent) => {
        // Only handle horizontal scroll (trackpad gesture)
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

        e.preventDefault();

        // If locked, ignore all wheel events
        if (isWheelLocked) return;

        // Accumulate delta
        accumulatedDeltaRef.current += e.deltaX;

        // Clear previous timeout
        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);

        // Set timeout to process accumulated delta
        wheelTimeoutRef.current = setTimeout(() => {
            const totalDelta = accumulatedDeltaRef.current;

            // Only trigger if accumulated delta exceeds threshold
            if (Math.abs(totalDelta) > 100) {
                setIsWheelLocked(true);

                if (totalDelta > 0 && canGoRight) {
                    setActiveIndex(prev => Math.min(prev + 1, items.length - 1));
                } else if (totalDelta < 0 && canGoLeft) {
                    setActiveIndex(prev => Math.max(prev - 1, 0));
                }

                // Unlock after animation completes
                setTimeout(() => {
                    setIsWheelLocked(false);
                }, 600);
            }

            // Reset accumulated delta
            accumulatedDeltaRef.current = 0;
        }, 50);
    };

    // Progress percentage
    const progressPercent = items.length > 1 ? (activeIndex / (items.length - 1)) * 100 : 0;

    return (
        <section className="w-full flex justify-center mt-[60px] md:mt-[80px]">
            <div className="w-full max-w-[1374px] px-4">
                {/* Section Heading */}
                <div className="text-center mb-[36px] md:mb-[48px]">
                    {isEditMode ? (
                        <EditableText
                            value={sectionHeading}
                            onSave={(val) => updateField("sectionHeading", val)}
                            isAdmin={true}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#006D77] font-figtree bg-[#006D77]/10 border-b border-[#006D77]/30 px-2 py-1 inline-block"
                        />
                    ) : (
                        <p className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#006D77] font-figtree">
                            {sectionHeading}
                        </p>
                    )}
                </div>

                {/* Timeline Container with Navigation */}
                <div className="relative flex items-center gap-4">
                    {/* Horizontal Carousel */}
                    <div
                        className="flex-1 overflow-hidden"
                    >
                        <motion.div
                            ref={scrollRef}
                            className="flex gap-[40px] md:gap-[60px]"
                            animate={{ x: typeof window !== 'undefined' && window.innerWidth >= 768 ? getMdTransformX() : getTransformX() }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onWheel={onWheel}
                        >
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`flex-shrink-0 transition-all duration-500 ${activeIndex === idx ? 'opacity-100' : 'opacity-40 grayscale'
                                        }`}
                                    style={{ scrollSnapAlign: 'start' }}
                                    onClick={() => setActiveIndex(idx)}
                                >
                                    <div className="w-[320px] md:w-[843px] h-auto md:h-[421px] flex flex-col md:flex-row bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        {/* Left Image */}
                                        <div className="relative w-full md:w-[421px] h-[280px] md:h-[421px] flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.heading}
                                                fill
                                                className="object-cover"
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteItem(idx);
                                                        }}
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

                                        {/* Right Text Container */}
                                        <div className="flex-1 flex items-center justify-center p-6 md:p-0">
                                            <div className="w-full md:w-[320px] md:mx-auto text-center py-6 md:py-[110px]">
                                                {/* Heading */}
                                                <div className="mb-4">
                                                    {isEditMode ? (
                                                        <EditableText
                                                            value={item.heading}
                                                            onSave={(val) => updateItem(idx, "heading", val)}
                                                            isAdmin={true}
                                                            className="text-[20px] md:text-[24px] leading-[24px] md:leading-[28px] tracking-[-0.4px] text-[#1a1a1a] font-lora bg-gray-100 border-b border-gray-300 px-2 py-1 w-full text-center"
                                                        />
                                                    ) : (
                                                        <h3 className="text-[20px] md:text-[24px] leading-[24px] md:leading-[28px] tracking-[-0.4px] text-[#1a1a1a] font-lora">
                                                            {item.heading}
                                                        </h3>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <div className="mt-4">
                                                    {isEditMode ? (
                                                        <EditableText
                                                            value={item.description}
                                                            onSave={(val) => updateItem(idx, "description", val)}
                                                            isAdmin={true}
                                                            multiline={true}
                                                            className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree bg-gray-100 border-b border-gray-300 px-2 py-1 w-full text-center"
                                                        />
                                                    ) : (
                                                        <p className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add Timeline Block Placeholder (Edit Mode) */}
                            {isEditMode && (
                                <motion.div
                                    className="flex-shrink-0 cursor-pointer"
                                    style={{ scrollSnapAlign: 'start' }}
                                    onClick={addItem}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="w-[320px] md:w-[843px] h-[280px] md:h-[421px] flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#006D77] transition-colors rounded-sm bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center gap-3">
                                            <Plus size={40} className="text-gray-400" />
                                            <span className="text-gray-500 text-sm font-medium">Add Timeline Block</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* Navigation Buttons - Stacked on Right */}
                    <div className="hidden md:flex flex-col items-center">
                        <div className="bg-gray-100 rounded-md overflow-hidden shadow-sm">
                            {/* Left Button */}
                            <motion.button
                                onClick={goLeft}
                                disabled={!canGoLeft}
                                className={`w-12 h-12 flex items-center justify-center border-b border-gray-200 transition-all ${canGoLeft
                                    ? 'hover:bg-[#006D77] hover:text-white text-gray-700'
                                    : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                whileHover={canGoLeft ? { scale: 1.05 } : {}}
                                whileTap={canGoLeft ? { scale: 0.95 } : {}}
                            >
                                <ChevronLeft size={20} />
                            </motion.button>

                            {/* Right Button */}
                            <motion.button
                                onClick={goRight}
                                disabled={!canGoRight}
                                className={`w-12 h-12 flex items-center justify-center transition-all ${canGoRight
                                    ? 'hover:bg-[#006D77] hover:text-white text-gray-700'
                                    : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                whileHover={canGoRight ? { scale: 1.05 } : {}}
                                whileTap={canGoRight ? { scale: 0.95 } : {}}
                            >
                                <ChevronRight size={20} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Year Timeline Progress Bar */}
                <div className="mt-8 md:mt-12 max-w-[843px] mx-auto">
                    {/* Progress Bar Background */}
                    <div className="relative h-[2px] bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute left-0 top-0 h-full bg-[#006D77] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>

                    {/* Year Labels */}
                    <div className="flex justify-between mt-4">
                        {items.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`transition-all ${activeIndex === idx ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                                    }`}
                            >
                                {/* Year Label */}
                                {isEditMode ? (
                                    <EditableText
                                        value={item.year}
                                        onSave={(val) => updateItem(idx, "year", val)}
                                        isAdmin={true}
                                        className={`text-[14px] md:text-[16px] font-semibold font-figtree transition-all ${activeIndex === idx ? 'text-[#006D77]' : 'text-gray-400'
                                            } bg-transparent border-b border-dashed border-gray-300 px-1`}
                                    />
                                ) : (
                                    <span
                                        className={`text-[14px] md:text-[16px] font-semibold font-figtree transition-all ${activeIndex === idx ? 'text-[#006D77]' : 'text-gray-400'
                                            }`}
                                    >
                                        {item.year}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section >
    );
}
