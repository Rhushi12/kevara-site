"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

const COLLECTIONS = [
    {
        id: 1,
        subtitle: "New Season",
        title: "The Comfort \nCollection",
        description: "Experience the perfect blend of style and comfort with our latest collection. Designed for the modern individual who values both aesthetics and ease.",
        image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop",
        buttonText: "Read The Story"
    },
    {
        id: 2,
        subtitle: "Minimalist",
        title: "Urban \nEssentials",
        description: "Clean lines and neutral tones for the city dweller. Versatile pieces that transition seamlessly from work to weekend.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
        buttonText: "Shop Urban"
    },
    {
        id: 3,
        subtitle: "Soft Layers",
        title: "Winter \nWarmth",
        description: "Embrace the chill with our premium wool blends and cashmere sets. Layer up in luxury without compromising on style.",
        image: "https://images.unsplash.com/photo-1485230946086-1d99d529c749?q=80&w=1000&auto=format&fit=crop",
        buttonText: "View Layers"
    },
    {
        id: 4,
        subtitle: "Resort Wear",
        title: "Weekend \nGetaway",
        description: "Lightweight fabrics and breezy silhouettes perfect for your next escape. Pack light, travel in style.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
        buttonText: "Explore Resort"
    }
];

export default function EditorialSection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % COLLECTIONS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const activeCollection = COLLECTIONS[currentSlide];

    return (
        <section className="container mx-auto px-4 py-20 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Large Image - Slides from Left */}
                <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:max-w-none overflow-hidden rounded-lg group">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={activeCollection.id}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                const swipeConfidenceThreshold = 10000;
                                if (swipe < -swipeConfidenceThreshold) {
                                    setCurrentSlide((prev) => (prev + 1) % COLLECTIONS.length);
                                } else if (swipe > swipeConfidenceThreshold) {
                                    setCurrentSlide((prev) => (prev - 1 + COLLECTIONS.length) % COLLECTIONS.length);
                                }
                            }}
                        >
                            <Image
                                src={activeCollection.image}
                                alt={activeCollection.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Functional Progress Bars */}
                    <div className="absolute bottom-12 left-8 right-8 flex gap-4 z-10">
                        {COLLECTIONS.map((_, index) => (
                            <div key={index} className="h-[2px] flex-1 bg-white/30 overflow-hidden">
                                {index === currentSlide && (
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                    />
                                )}
                                {index < currentSlide && (
                                    <div className="h-full w-full bg-white" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Content - Slides from Right */}
                <div className="flex flex-col items-start justify-center text-left lg:pl-12 h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCollection.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="block text-sm uppercase tracking-widest text-slate-500 font-figtree mb-4"
                            >
                                {activeCollection.subtitle}
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-lora text-slate-900 mb-6 leading-tight whitespace-pre-line"
                            >
                                {activeCollection.title}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-slate-900 font-figtree mb-8 leading-relaxed max-w-md"
                            >
                                {activeCollection.description}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <LiquidButton>
                                    {activeCollection.buttonText}
                                </LiquidButton>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
