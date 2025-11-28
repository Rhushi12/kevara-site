"use client";

import { useState } from "react";
import { Star, Heart, Share2 } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

interface ProductInfoProps {
    title: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    colors: { name: string; value: string }[];
    sizes: string[];
}

export default function ProductInfo({
    title,
    price,
    originalPrice,
    rating,
    reviews,
    colors,
    sizes,
}: ProductInfoProps) {
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [selectedSize, setSelectedSize] = useState(sizes[0]);

    return (
        <div className="flex flex-col gap-6 sticky top-24">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-lora text-slate-900 mb-2">
                    {title}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-medium text-[#006D77]">
                            ${price.toFixed(2)}
                        </span>
                        {originalPrice && (
                            <span className="text-sm text-slate-400 line-through">
                                ${originalPrice.toFixed(2)}
                            </span>
                        )}
                        {originalPrice && (
                            <span className="text-xs bg-[#006D77] text-white px-2 py-0.5 rounded-full">
                                SAVE {(100 - (price / originalPrice) * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                className={
                                    i < Math.floor(rating)
                                        ? "fill-[#006D77] text-[#006D77]"
                                        : "text-gray-300"
                                }
                            />
                        ))}
                        <span className="text-xs text-slate-500 ml-1">
                            ({reviews} reviews)
                        </span>
                    </div>
                </div>
            </div>

            {/* Color Selector */}
            <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                    Color: <span className="text-slate-900">{selectedColor.name}</span>
                </span>
                <div className="flex gap-3">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor.name === color.name
                                ? "border-[#006D77] p-0.5"
                                : "border-transparent"
                                }`}
                        >
                            <div
                                className="w-full h-full rounded-full border border-gray-200"
                                style={{ backgroundColor: color.value }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Size Selector */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Size: <span className="text-slate-900">{selectedSize}</span>
                    </span>
                    <button className="text-xs text-slate-500 underline hover:text-[#006D77]">
                        Size Guide
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`w-12 h-10 flex items-center justify-center text-sm border transition-all ${selectedSize === size
                                ? "border-[#006D77] bg-[#006D77] text-white"
                                : "border-gray-200 text-slate-600 hover:border-[#006D77]"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-4">
                <LiquidButton
                    onClick={() => console.log("Added to cart")}
                    className="w-full py-4 text-sm uppercase tracking-widest"
                >
                    Add to Cart
                </LiquidButton>
                <button className="w-full py-4 text-sm uppercase tracking-widest bg-[#4A3B32] text-white hover:bg-[#3A2E27] transition-colors">
                    Buy it Now
                </button>
            </div>

            {/* Footer Meta */}
            <div className="flex items-center justify-between pt-4">
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#006D77] transition-colors">
                        <Share2 size={16} /> Share
                    </button>
                    <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#006D77] transition-colors">
                        <Heart size={16} /> Save
                    </button>
                </div>
                <span className="text-xs text-slate-400">Free shipping on orders over $150</span>
            </div>
        </div>
    );
}
