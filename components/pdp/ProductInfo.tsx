"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useSizeGuideStore } from "@/lib/store";

interface ProductInfoProps {
    title: string;
    price: number;
    originalPrice?: number;
    colors: { name: string; hex: string }[];
    sizes: string[];
    description: string;
}

const ALL_SIZES = ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "XXL"];

export default function ProductInfo({
    title,
    price,
    originalPrice,
    colors,
    sizes,
    description
}: ProductInfoProps) {
    const [selectedColor, setSelectedColor] = useState(colors[0]?.name || "");
    const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
    const { openSizeGuide } = useSizeGuideStore();

    const discountPercentage = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    return (
        <div className="flex flex-col gap-8 sticky top-24">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl md:text-4xl font-lora font-medium text-slate-900 leading-tight">
                        {title}
                    </h1>
                    <button className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-red-500">
                        <Heart size={24} />
                    </button>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-4">
                        <span className="text-2xl font-figtree font-semibold text-slate-900">
                            {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                            }).format(price)}
                        </span>
                        {originalPrice && originalPrice > price && (
                            <>
                                <span className="text-lg text-slate-400 line-through font-figtree">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(originalPrice)}
                                </span>
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded">
                                    {discountPercentage}% OFF
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Color Selection */}
            {colors.length > 0 && (
                <div className="space-y-3">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Color: <span className="text-slate-500 font-normal capitalize">{selectedColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-4">
                        {colors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color.name)}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color.name
                                    ? "border-slate-900 scale-110"
                                    : "border-transparent hover:border-slate-300"
                                    }`}
                            >
                                <div
                                    className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Size Selection */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Size: <span className="text-slate-500 font-normal">{selectedSize}</span>
                    </span>
                    <button
                        onClick={openSizeGuide}
                        className="text-xs text-slate-500 underline hover:text-slate-900"
                    >
                        Size Guide
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`h-10 min-w-[3rem] px-3 rounded border text-sm font-medium transition-all relative overflow-hidden ${selectedSize === size
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions: WhatsApp & Email */}
            <div className="flex flex-col gap-3 pt-4">
                {/* REMOVED WHATSAPP BUTTON */}

                <LiquidButton
                    className="w-full h-12 bg-white text-slate-900 border border-slate-900 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2"
                    variant="secondary"
                    onClick={() => window.location.href = `mailto:contact@kevara.com?subject=Inquiry about ${title}`}
                >
                    <span className="font-medium">Send us an Email</span>
                </LiquidButton>
            </div>
        </div>
    );
}
