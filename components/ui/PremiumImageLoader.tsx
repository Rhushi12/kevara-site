"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumImageLoaderProps extends ImageProps {
    containerClassName?: string;
}

export default function PremiumImageLoader({
    className,
    containerClassName,
    onLoad,
    ...props
}: PremiumImageLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative w-full h-full overflow-hidden ${containerClassName || ""}`}>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#FDFBF7]"
                    >
                        <div className="relative p-8">
                            {/* Text Animation */}
                            <div className="flex items-center gap-[0.2em] overflow-hidden">
                                {["K", "E", "V", "A", "R", "A"].map((letter, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ y: "100%" }}
                                        animate={{ y: "0%" }}
                                        transition={{
                                            duration: 1,
                                            delay: i * 0.08,
                                            ease: [0.22, 1, 0.36, 1],
                                            repeat: Infinity,
                                            repeatDelay: 3,
                                            repeatType: "reverse"
                                        }}
                                        className="text-2xl md:text-4xl font-lora font-medium text-slate-900 tracking-widest"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </div>

                            {/* Elegant Line Animation */}
                            <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{
                                    duration: 1.5,
                                    delay: 0.5,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatDelay: 2.5
                                }}
                                className="absolute bottom-4 left-8 right-8 h-[1px] bg-slate-900 origin-left"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Image
                {...props}
                className={`${className || ""} transition-opacity duration-700 ${isLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={(e) => {
                    setIsLoading(false);
                    if (onLoad) onLoad(e);
                }}
            />
        </div>
    );
}
