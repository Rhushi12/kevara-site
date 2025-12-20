"use client";

import { useState, useCallback } from "react";
import Image, { ImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface ProductImageProps extends Omit<ImageProps, 'onError'> {
    containerClassName?: string;
    showRetryOnError?: boolean;
}

export default function ProductImage({
    className,
    containerClassName,
    src,
    alt,
    priority,
    showRetryOnError = true,
    ...props
}: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Auto-detect CDN images and skip Next.js optimization
    const srcString = typeof src === 'string' ? src : '';
    const isCdnImage = srcString.includes('cdn.shopify') || srcString.includes('.r2.dev');

    const handleRetry = useCallback(() => {
        setHasError(false);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    return (
        <div className={`relative w-full h-full ${containerClassName || ""}`}>
            {/* Loading State - KEVARA Animated Loader */}
            <AnimatePresence>
                {isLoading && !hasError && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#FDFBF7]"
                    >
                        <div className="relative">
                            {/* Animated KEVARA Text */}
                            <div className="flex items-center gap-[0.15em] overflow-hidden">
                                {["K", "E", "V", "A", "R", "A"].map((letter, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: "0%", opacity: 1 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: i * 0.08,
                                            ease: [0.22, 1, 0.36, 1],
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                            repeatType: "reverse"
                                        }}
                                        className="text-lg md:text-2xl font-lora font-medium text-slate-800 tracking-widest"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </div>

                            {/* Animated underline */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.5,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatDelay: 1.5
                                }}
                                className="mt-2 h-[1px] bg-slate-800 origin-left"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error State - Retry Button */}
            <AnimatePresence>
                {hasError && showRetryOnError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 gap-4 p-4"
                    >
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Image failed to load</p>
                            <p className="text-xs text-gray-400">Check your internet connection</p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-[#006D77] text-white text-sm rounded-full hover:bg-[#005a63] transition-colors"
                        >
                            <RefreshCw size={14} />
                            <span>Retry</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image */}
            <Image
                key={retryCount}
                {...props}
                src={src}
                alt={alt}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                unoptimized={isCdnImage}
                className={`${className || ""} transition-opacity duration-500 ${isLoading || hasError ? "opacity-0" : "opacity-100"}`}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
}
