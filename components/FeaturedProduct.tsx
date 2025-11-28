"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

interface FeaturedProductProps {
    product?: {
        title: string;
        price: string;
        images: string[];
        collection?: string;
        rating?: number;
        reviews?: number;
    };
}

export default function FeaturedProduct({
    product = {
        title: "Aubrey 8072 Maxi Dress",
        price: "$130.00",
        images: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop"
        ],
        collection: "Spring Collection",
        rating: 5,
        reviews: 12
    }
}: FeaturedProductProps) {
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState("Purple");

    const sizes = ["XS", "S", "M", "L", "XL"];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Thumbnails (Span 1) */}
                    <div className="hidden md:flex flex-col gap-4 md:col-span-1">
                        {product.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative aspect-[3/4] w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                                <Image
                                    src={img}
                                    alt={`Thumbnail ${i}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Image (Span 6) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-6 relative aspect-[3/4] bg-gray-100"
                    >
                        <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                        />
                        <button className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </motion.div>

                    {/* Product Details (Span 5) */}
                    <div className="md:col-span-5 flex flex-col justify-center">
                        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
                            {product.collection}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-lora text-slate-900 mb-2">
                            {product.title}
                        </h2>
                        <div className="text-xl text-slate-900 mb-4">{product.price}</div>

                        <div className="flex items-center gap-1 mb-6">
                            {[...Array(product.rating)].map((_, i) => (
                                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-xs text-slate-500 ml-2">({product.reviews} Reviews)</span>
                        </div>

                        <div className="mb-6">
                            <span className="text-xs font-bold uppercase block mb-3">Color: {selectedColor}</span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedColor("Purple")}
                                    className={`w-8 h-8 rounded-full bg-purple-200 border-2 ${selectedColor === "Purple" ? "border-[#006D77]" : "border-transparent"}`}
                                />
                                <button
                                    onClick={() => setSelectedColor("White")}
                                    className={`w-8 h-8 rounded-full bg-white border-2 border-gray-200 ${selectedColor === "White" ? "border-[#006D77]" : ""}`}
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between mb-3">
                                <span className="text-xs font-bold uppercase">Size: {selectedSize}</span>
                                <button className="text-xs underline text-slate-500">Size Guide</button>
                            </div>
                            <div className="flex gap-3">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-12 h-10 flex items-center justify-center border text-sm transition-colors ${selectedSize === size
                                                ? "border-[#006D77] bg-[#006D77] text-white"
                                                : "border-gray-200 hover:border-[#006D77]"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <LiquidButton
                                className="w-full bg-[#E0F2F1] text-[#006D77] hover:bg-[#B2DFDB]"
                                onClick={() => console.log("Add to Cart")}
                            >
                                Add to Cart
                            </LiquidButton>
                            <LiquidButton
                                className="w-full"
                                onClick={() => console.log("Buy it Now")}
                            >
                                Buy it Now
                            </LiquidButton>
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                            *Free shipping on orders over $200
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
