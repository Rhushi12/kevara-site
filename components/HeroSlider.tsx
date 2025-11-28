"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { HERO_SLIDES } from "@/lib/heroData";
import LiquidButton from "@/components/ui/LiquidButton";

interface HeroSliderProps {
    slides?: typeof HERO_SLIDES;
}

export default function HeroSlider({ slides = HERO_SLIDES }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Phase 1: Initial Load Delay (1.5s)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Cycle to next slide
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const activeSlide = slides[currentSlide];

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
            transition: { duration: 0.5, ease: [0.64, 0, 0.78, 0] }, // easeInQuint
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
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.64, 0, 0.78, 0] } }, // easeInQuint
    };

    const fadeInVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.64, 0, 0.78, 0] } }, // easeInQuint
    };

    return (
        <div className="relative h-[85vh] md:h-[calc(100vh-80px)] w-full overflow-hidden bg-[#FDFBF7]">
            <AnimatePresence mode="popLayout" initial={false}>
                {isLoaded && (
                    <motion.div
                        key={activeSlide.id}
                        className="absolute inset-0 w-full h-full"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* Image Layer */}
                        <div className="relative w-full h-full">
                            <Image
                                src={activeSlide.image}
                                alt={activeSlide.heading}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/20" />
                        </div>

                        {/* Text Layer */}
                        <div className={`absolute inset-0 flex items-center ${currentSlide === 0 ? "justify-center px-4" : "justify-start pl-10 md:pl-32"} z-30 pointer-events-none`}>
                            <div className={`${currentSlide === 0 ? "text-center" : "text-left"} text-white max-w-4xl pointer-events-auto`}>
                                <motion.div
                                    variants={textContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    key={`text-${activeSlide.id}`}
                                >
                                    <motion.h2
                                        variants={fadeInVariants}
                                        className="text-[11px] md:text-[13px] leading-[16px] font-bold font-figtree tracking-[0.2em] uppercase mb-4"
                                    >
                                        {activeSlide.subheading}
                                    </motion.h2>
                                    <motion.h1
                                        variants={fadeUpVariants}
                                        className="text-[48px] md:text-[64px] leading-[1.1] md:leading-[64px] font-normal font-lora mb-6 md:mb-8"
                                    >
                                        {activeSlide.heading}
                                    </motion.h1>
                                    <motion.div variants={fadeUpVariants}>
                                        <LiquidButton
                                            href={activeSlide.link}
                                            variant={currentSlide === 0 ? "primary" : "secondary"}
                                            className={currentSlide !== 0 ? "border-none" : ""}
                                        >
                                            {activeSlide.buttonText}
                                        </LiquidButton>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Indicators - Sharp & Thin */}
            {isLoaded && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="h-[2px] w-16 bg-white/30 rounded-none overflow-hidden"
                        >
                            {index === currentSlide && (
                                <motion.div
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
                                        if (index === currentSlide) {
                                            nextSlide();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
