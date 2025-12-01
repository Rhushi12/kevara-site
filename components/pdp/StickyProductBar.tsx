"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";
import { MessageCircle, Mail } from "lucide-react";

interface StickyProductBarProps {
    product: {
        title: string;
        price: number;
        image: string;
        colors?: { name: string; value: string; hex?: string }[];
        sizes?: string[];
    };
}

export default function StickyProductBar({ product }: StickyProductBarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);
    const [selectedSize, setSelectedSize] = useState(
        product.sizes?.find(s => ["XS", "S", "M", "L", "XL", "XXL"].includes(s)) || product.sizes?.[0]
    );

    useEffect(() => {
        const handleScroll = () => {
            // Show bar when scrolled past 800px (approx height of main product section)
            const threshold = 800;
            setIsVisible(window.scrollY > threshold);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const colors = product.colors || [];
    const sizes = product.sizes || [];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-16 md:top-20 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40 shadow-lg"
                >
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        {/* Product Info */}
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-shrink">
                            <div className="relative w-12 h-16 bg-gray-100 overflow-hidden rounded-lg hidden md:block flex-shrink-0">
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-lora text-slate-900 font-medium truncate">
                                    {product.title}
                                </h3>
                                <span className="text-sm text-slate-900 font-bold">
                                    ${product.price.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Selectors & Actions */}
                        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                            {/* Color Selector */}
                            {colors.length > 0 && (
                                <div className="hidden lg:flex gap-2 items-center">
                                    {colors.slice(0, 5).map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor?.name === color.name
                                                ? "border-slate-900 ring-2 ring-offset-1 ring-slate-900"
                                                : "border-gray-300 hover:border-slate-500"
                                                }`}
                                            title={color.name}
                                        >
                                            <div
                                                className="w-full h-full rounded-full"
                                                style={{ backgroundColor: color.value || color.hex || '#000000' }}
                                            />
                                        </button>
                                    ))}
                                    {colors.length > 5 && (
                                        <span className="text-xs text-slate-500">+{colors.length - 5}</span>
                                    )}
                                </div>
                            )}

                            {/* Size Selector - Show all standard sizes */}
                            <div className="hidden md:flex gap-1.5">
                                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                                    const isAvailable = sizes.includes(size);
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => isAvailable && setSelectedSize(size)}
                                            disabled={!isAvailable}
                                            className={`relative w-9 h-9 flex items-center justify-center text-xs font-medium border transition-all ${selectedSize === size
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : isAvailable
                                                    ? "border-gray-300 text-slate-700 hover:border-slate-900"
                                                    : "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                                                }`}
                                        >
                                            {size}
                                            {!isAvailable && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-full h-0.5 bg-gray-300 rotate-45" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <LiquidButton
                                onClick={() => window.open(`https://wa.me/?text=I'm interested in ${product.title}`, '_blank')}
                                className="px-4 md:px-6 py-2 md:py-2.5 text-xs h-9 md:h-10 min-w-[140px] uppercase tracking-wider bg-[#25D366] hover:bg-[#128C7E] border-none text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={16} />
                                    <span className="hidden md:inline">WhatsApp</span>
                                </div>
                            </LiquidButton>

                            <button
                                onClick={() => window.location.href = `mailto:?subject=Inquiry about ${product.title}`}
                                className="px-4 py-2 h-9 md:h-10 border border-[#4A3B32] text-[#4A3B32] hover:bg-[#4A3B32] hover:text-white transition-colors uppercase text-xs tracking-wider flex items-center gap-2"
                            >
                                <Mail size={16} />
                                <span className="hidden md:inline">Email</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
