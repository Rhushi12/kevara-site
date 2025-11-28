"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import LiquidButton from "@/components/ui/LiquidButton";

// Mock Data for Men's Essentials
const MEN_ESSENTIALS_PRODUCTS = {
    shirts: [
        {
            node: {
                id: "ms1",
                title: "Oxford Cotton Shirt",
                handle: "oxford-cotton-shirt",
                priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v1", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "ms2",
                title: "Linen Button Down",
                handle: "linen-button-down",
                priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v2", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "ms3",
                title: "Casual Denim Shirt",
                handle: "casual-denim-shirt",
                priceRange: { minVariantPrice: { amount: "90.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1551028919-ac7675cf5063?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v3", title: "Default / Denim" } }] },
            },
        },
        {
            node: {
                id: "ms4",
                title: "Slim Fit Dress Shirt",
                handle: "slim-fit-dress-shirt",
                priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v4", title: "Default / Black" } }] },
            },
        },
    ],
    trousers: [
        {
            node: {
                id: "mt1",
                title: "Slim Chino Trousers",
                handle: "slim-chino-trousers",
                priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Trousers" } }, { node: { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop", altText: "Trousers Detail" } }] },
                variants: { edges: [{ node: { id: "v5", title: "Default / Beige" } }] },
            },
        },
        {
            node: {
                id: "mt2",
                title: "Wool Blend Trousers",
                handle: "wool-blend-trousers",
                priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1507680434567-5739c8a92437?q=80&w=1000&auto=format&fit=crop", altText: "Trousers" } }, { node: { url: "https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=1000&auto=format&fit=crop", altText: "Trousers Detail" } }] },
                variants: { edges: [{ node: { id: "v6", title: "Default / Grey" } }] },
            },
        },
        {
            node: {
                id: "mt3",
                title: "Relaxed Fit Linen Pants",
                handle: "relaxed-fit-linen-pants",
                priceRange: { minVariantPrice: { amount: "100.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1516257984-b1b4d8c9230c?q=80&w=1000&auto=format&fit=crop", altText: "Pants" } }, { node: { url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop", altText: "Pants Detail" } }] },
                variants: { edges: [{ node: { id: "v7", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "mt4",
                title: "Cargo Pants",
                handle: "cargo-pants",
                priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", altText: "Pants" } }, { node: { url: "https://images.unsplash.com/photo-1507680434567-5739c8a92437?q=80&w=1000&auto=format&fit=crop", altText: "Pants Detail" } }] },
                variants: { edges: [{ node: { id: "v8", title: "Default / Olive" } }] },
            },
        },
    ],
    jackets: [
        {
            node: {
                id: "mj1",
                title: "Classic Denim Jacket",
                handle: "classic-denim-jacket",
                priceRange: { minVariantPrice: { amount: "140.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop", altText: "Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=1000&auto=format&fit=crop", altText: "Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v9", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "mj2",
                title: "Leather Biker Jacket",
                handle: "leather-biker-jacket",
                priceRange: { minVariantPrice: { amount: "250.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1000&auto=format&fit=crop", altText: "Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1551028919-ac7675cf5063?q=80&w=1000&auto=format&fit=crop", altText: "Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v10", title: "Default / Black" } }] },
            },
        },
        {
            node: {
                id: "mj3",
                title: "Bomber Jacket",
                handle: "bomber-jacket",
                priceRange: { minVariantPrice: { amount: "130.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop", altText: "Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=1000&auto=format&fit=crop", altText: "Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v11", title: "Default / Green" } }] },
            },
        },
        {
            node: {
                id: "mj4",
                title: "Wool Overcoat",
                handle: "wool-overcoat",
                priceRange: { minVariantPrice: { amount: "280.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=1000&auto=format&fit=crop", altText: "Coat" } }, { node: { url: "https://images.unsplash.com/photo-1507680434567-5739c8a92437?q=80&w=1000&auto=format&fit=crop", altText: "Coat Detail" } }] },
                variants: { edges: [{ node: { id: "v12", title: "Default / Camel" } }] },
            },
        },
    ],
};

export default function MenShopEssentials() {
    const [activeTab, setActiveTab] = useState<"shirts" | "trousers" | "jackets">("shirts");

    const products = MEN_ESSENTIALS_PRODUCTS[activeTab];

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
                    Refined for the Gentleman
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-8">
                    Discover our latest collection of premium menswear. Tailored for comfort and style, designed for the modern man.
                </p>

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    {(["shirts", "trousers", "jackets"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabUnderlineMen"
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
                <LiquidButton href="/collections/men">
                    View All
                </LiquidButton>
            </div>
        </section>
    );
}
