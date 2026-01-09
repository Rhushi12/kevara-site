"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";
import { MessageCircle, Mail, ChevronDown } from "lucide-react";

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

    const [isColorOpen, setIsColorOpen] = useState(false);
    const [isSizeOpen, setIsSizeOpen] = useState(false);
    const colorDropdownRef = useRef<HTMLDivElement>(null);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const threshold = 800;
            setIsVisible(window.scrollY > threshold);
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
                setIsColorOpen(false);
            }
            if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
                setIsSizeOpen(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const colors = product.colors || [];
    // Filter out "One Size" - it should never be displayed
    const sizes = (product.sizes || []).filter((s: string) => s.toLowerCase() !== 'one size');

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-[60] shadow-lg"
                >
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        {/* Product Info */}
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-shrink">
                            <div className="relative w-12 h-16 bg-gray-100 overflow-hidden rounded-lg hidden md:block flex-shrink-0">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : null}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-lora text-slate-900 font-medium truncate">
                                    {product.title}
                                </h3>
                                {/* Hidden Price */}
                                <span className="text-sm text-slate-900 font-bold hidden">
                                    ${product.price.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Selectors & Actions */}
                        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">

                            {/* Unified Dropdown Container */}
                            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-lg shadow-sm divide-x divide-gray-200 h-10">

                                {/* Color Dropdown */}
                                {colors.length > 0 && (
                                    <div className="relative" ref={colorDropdownRef}>
                                        <button
                                            onClick={() => setIsColorOpen(!isColorOpen)}
                                            className="flex items-center gap-2 px-3 h-full hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-gray-200"
                                                    style={{ backgroundColor: selectedColor?.hex || selectedColor?.value || '#000' }}
                                                />
                                                <span className="text-sm text-slate-700 truncate max-w-[80px]">
                                                    {selectedColor?.name || "Select Color"}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isColorOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isColorOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 mt-2 w-full min-w-[160px] bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden py-1 z-50"
                                                >
                                                    {colors.map((color) => (
                                                        <button
                                                            key={color.name}
                                                            onClick={() => {
                                                                setSelectedColor(color);
                                                                setIsColorOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                        >
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-gray-200"
                                                                style={{ backgroundColor: color.hex || color.value || '#000' }}
                                                            />
                                                            <span className={`text-sm ${selectedColor?.name === color.name ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                                                {color.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Size Dropdown */}
                                {sizes.length > 0 && (
                                    <div className="relative" ref={sizeDropdownRef}>
                                        <button
                                            onClick={() => setIsSizeOpen(!isSizeOpen)}
                                            className="flex items-center gap-2 px-3 h-full hover:bg-gray-50 transition-colors min-w-[100px] justify-between"
                                        >
                                            <span className="text-sm text-slate-700">
                                                {selectedSize || "Size"}
                                            </span>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isSizeOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isSizeOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full right-0 mt-2 w-full min-w-[120px] bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden py-1 z-50"
                                                >
                                                    {sizes.map((size) => (
                                                        <button
                                                            key={size}
                                                            onClick={() => {
                                                                setSelectedSize(size);
                                                                setIsSizeOpen(false);
                                                            }}
                                                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 text-sm transition-colors ${selectedSize === size ? 'font-medium text-slate-900 bg-gray-50' : 'text-slate-600'}`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* REMOVED WHATSAPP BUTTON AS PER REQUEST */}
                            {/* <LiquidButton
                                onClick={() => window.open(`https://wa.me/919876543210?text=I'm interested in ${product.title} (Color: ${selectedColor?.name}, Size: ${selectedSize})`, '_blank')}
                                className="px-4 md:px-6 py-2 md:py-2.5 text-xs h-9 md:h-10 min-w-[140px] uppercase tracking-wider bg-[#25D366] hover:bg-[#128C7E] border-none text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={16} />
                                    <span className="hidden md:inline">WhatsApp</span>
                                </div>
                            </LiquidButton> */}

                            <button
                                onClick={() => window.location.href = `mailto:contact@kevara.com?subject=Inquiry about ${product.title}&body=I'm interested in ${product.title} (Color: ${selectedColor?.name}, Size: ${selectedSize})`}
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
