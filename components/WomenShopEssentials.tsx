"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import LiquidButton from "@/components/ui/LiquidButton";

// Mock Data for Women's Essentials
const WOMEN_ESSENTIALS_PRODUCTS = {
    dresses: [
        {
            node: {
                id: "d1",
                title: "Aubrey 8072 Maxi Dress",
                handle: "aubrey-maxi-dress",
                priceRange: { minVariantPrice: { amount: "130.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Dress" } }, { node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Dress Detail" } }] },
                variants: { edges: [{ node: { id: "v1", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "d2",
                title: "Summer Breeze Dress",
                handle: "summer-breeze-dress",
                priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop", altText: "Dress" } }, { node: { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", altText: "Dress Detail" } }] },
                variants: { edges: [{ node: { id: "v2", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "d3",
                title: "Floral Midi Dress",
                handle: "floral-midi-dress",
                priceRange: { minVariantPrice: { amount: "125.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop", altText: "Dress" } }, { node: { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", altText: "Dress Detail" } }] },
                variants: { edges: [{ node: { id: "v3", title: "Default / Floral" } }] },
            },
        },
        {
            node: {
                id: "d4",
                title: "Evening Silk Gown",
                handle: "evening-silk-gown",
                priceRange: { minVariantPrice: { amount: "250.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", altText: "Gown" } }, { node: { url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop", altText: "Gown Detail" } }] },
                variants: { edges: [{ node: { id: "v4", title: "Default / Red" } }] },
            },
        },
    ],
    shirts: [
        {
            node: {
                id: "s1",
                title: "Classic White Shirt",
                handle: "classic-white-shirt",
                priceRange: { minVariantPrice: { amount: "80.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v5", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "s2",
                title: "Linen Blouse",
                handle: "linen-blouse",
                priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=1000&auto=format&fit=crop", altText: "Blouse" } }, { node: { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop", altText: "Blouse Detail" } }] },
                variants: { edges: [{ node: { id: "v6", title: "Default / Beige" } }] },
            },
        },
        {
            node: {
                id: "s3",
                title: "Striped Cotton Shirt",
                handle: "striped-cotton-shirt",
                priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1551028919-ac7675cf5063?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v7", title: "Default / Striped" } }] },
            },
        },
        {
            node: {
                id: "s4",
                title: "Silk Button Up",
                handle: "silk-button-up",
                priceRange: { minVariantPrice: { amount: "150.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v8", title: "Default / Black" } }] },
            },
        },
    ],
    shorts: [
        {
            node: {
                id: "sh1",
                title: "Denim Shorts",
                handle: "denim-shorts",
                priceRange: { minVariantPrice: { amount: "60.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop", altText: "Shorts" } }, { node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Shorts Detail" } }] },
                variants: { edges: [{ node: { id: "v9", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "sh2",
                title: "Linen Shorts",
                handle: "linen-shorts",
                priceRange: { minVariantPrice: { amount: "70.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=1000&auto=format&fit=crop", altText: "Shorts" } }, { node: { url: "https://images.unsplash.com/photo-1516257984-b1b4d8c9230c?q=80&w=1000&auto=format&fit=crop", altText: "Shorts Detail" } }] },
                variants: { edges: [{ node: { id: "v10", title: "Default / Beige" } }] },
            },
        },
        {
            node: {
                id: "sh3",
                title: "High Waisted Shorts",
                handle: "high-waisted-shorts",
                priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop", altText: "Shorts" } }, { node: { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", altText: "Shorts Detail" } }] },
                variants: { edges: [{ node: { id: "v11", title: "Default / Black" } }] },
            },
        },
        {
            node: {
                id: "sh4",
                title: "Pleated Shorts",
                handle: "pleated-shorts",
                priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1507680434567-5739c8a92437?q=80&w=1000&auto=format&fit=crop", altText: "Shorts" } }, { node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Shorts Detail" } }] },
                variants: { edges: [{ node: { id: "v12", title: "Default / White" } }] },
            },
        },
    ],
};

export default function WomenShopEssentials() {
    const [activeTab, setActiveTab] = useState<"dresses" | "shirts" | "shorts">("dresses");

    const products = WOMEN_ESSENTIALS_PRODUCTS[activeTab];

    return (
        <section className="container mx-auto px-4 pt-12 pb-12 md:py-24 group/section overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12"
            >
                <h2 className="text-[32px] md:text-5xl font-lora text-slate-900 mb-4">
                    Dress up in the heat
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-8">
                    SS21 Series of Comfortable textures. With luxurious, natural-looking makeup, we find reasons for the face. New textures and colors bring new inspiration to your everyday life.
                </p>

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    {(["dresses", "shirts", "shorts"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabUnderlineWomen"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Products Grid */}
            <div className="overflow-x-auto md:overflow-hidden pb-8 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 w-max md:w-full"
                    >
                        {products.map((product, index) => (
                            <motion.div
                                key={product.node.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="w-[85vw] md:w-auto snap-center shrink-0"
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex justify-center mt-12">
                <LiquidButton href="/collections/women">
                    View All
                </LiquidButton>
            </div>
        </section>
    );
}
