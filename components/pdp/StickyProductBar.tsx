"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

interface StickyProductBarProps {
    product: {
        title: string;
        price: number;
        image: string;
    };
}

export default function StickyProductBar({ product }: StickyProductBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show bar when scrolled past 800px (approx height of main product section)
            const threshold = 800;
            setIsVisible(window.scrollY > threshold);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-16 md:top-20 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-40 shadow-sm"
                >
                    <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                        {/* Product Info */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-16 bg-gray-100 overflow-hidden rounded-sm hidden md:block">
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-lora text-slate-900 font-medium">
                                    {product.title}
                                </h3>
                                <span className="text-xs text-[#006D77] font-bold">
                                    ${product.price.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {/* Size Selector (Simplified for bar) */}
                            <div className="hidden md:flex gap-2">
                                {["XS", "S", "M", "L", "XL"].map((size) => (
                                    <button
                                        key={size}
                                        className="w-8 h-8 flex items-center justify-center text-xs border border-gray-200 text-slate-600 hover:border-[#006D77] transition-colors rounded-sm"
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>

                            <LiquidButton
                                onClick={() => console.log("Added to cart from sticky bar")}
                                className="px-8 py-3 text-xs h-10 min-w-[140px]"
                            >
                                Add to Cart
                            </LiquidButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
