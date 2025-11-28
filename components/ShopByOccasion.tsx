"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

// Mock Data
const MOCK_PRODUCTS = {
    women: [
        {
            node: {
                id: "w1",
                title: "Femlig 8092 Short Sleeved Shirt",
                handle: "femlig-shirt",
                priceRange: { minVariantPrice: { amount: "70.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v1", title: "Default / Red" } }, { node: { id: "v2", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "w2",
                title: "Django 8045 Shorts",
                handle: "django-shorts",
                priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop", altText: "Shorts" } }, { node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Shorts Detail" } }] },
                variants: { edges: [{ node: { id: "v3", title: "Default / Navy" } }, { node: { id: "v4", title: "Default / Beige" } }, { node: { id: "v5", title: "Default / Black" } }] },
            },
        },
        {
            node: {
                id: "w3",
                title: "Stean 7348 Pullover",
                handle: "stean-pullover",
                priceRange: { minVariantPrice: { amount: "40.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop", altText: "Pullover" } }, { node: { url: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1000&auto=format&fit=crop", altText: "Pullover Detail" } }] },
                variants: { edges: [{ node: { id: "v6", title: "Default / Beige" } }, { node: { id: "v7", title: "Default / Grey" } }] },
            },
        },
        {
            node: {
                id: "w4",
                title: "Lional 6050 Lightweight Jacket",
                handle: "lional-jacket",
                priceRange: { minVariantPrice: { amount: "45.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1551028919-ac7675cf5063?q=80&w=1000&auto=format&fit=crop", altText: "Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop", altText: "Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v8", title: "Default / Black" } }, { node: { id: "v9", title: "Default / Navy" } }] },
            },
        },
        {
            node: {
                id: "w5",
                title: "Summer Breeze Dress",
                handle: "summer-dress",
                priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop", altText: "Dress" } }, { node: { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", altText: "Dress Detail" } }] },
                variants: { edges: [{ node: { id: "v10", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "w6",
                title: "Classic Denim Jacket",
                handle: "denim-jacket",
                priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=1000&auto=format&fit=crop", altText: "Denim Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1516257984-b1b4d8c9230c?q=80&w=1000&auto=format&fit=crop", altText: "Denim Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v11", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "w7",
                title: "Silk Blouse",
                handle: "silk-blouse",
                priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=1000&auto=format&fit=crop", altText: "Blouse" } }, { node: { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop", altText: "Blouse Detail" } }] },
                variants: { edges: [{ node: { id: "v12", title: "Default / Cream" } }] },
            },
        },
        {
            node: {
                id: "w8",
                title: "Pleated Skirt",
                handle: "pleated-skirt",
                priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop", altText: "Skirt" } }, { node: { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", altText: "Skirt Detail" } }] },
                variants: { edges: [{ node: { id: "v13", title: "Default / Black" } }] },
            },
        },
    ],
    men: [
        {
            node: {
                id: "m1",
                title: "Classic Oxford Shirt",
                handle: "oxford-shirt",
                priceRange: { minVariantPrice: { amount: "60.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", altText: "Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v14", title: "Default / White" } }] },
            },
        },
        {
            node: {
                id: "m2",
                title: "Slim Fit Chinos",
                handle: "slim-chinos",
                priceRange: { minVariantPrice: { amount: "55.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop", altText: "Chinos" } }, { node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Chinos Detail" } }] },
                variants: { edges: [{ node: { id: "v15", title: "Default / Khaki" } }] },
            },
        },
        {
            node: {
                id: "m3",
                title: "Merino Wool Sweater",
                handle: "merino-sweater",
                priceRange: { minVariantPrice: { amount: "80.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=1000&auto=format&fit=crop", altText: "Sweater" } }, { node: { url: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1000&auto=format&fit=crop", altText: "Sweater Detail" } }] },
                variants: { edges: [{ node: { id: "v16", title: "Default / Navy" } }] },
            },
        },
        {
            node: {
                id: "m4",
                title: "Leather Bomber Jacket",
                handle: "bomber-jacket",
                priceRange: { minVariantPrice: { amount: "150.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop", altText: "Jacket" } }, { node: { url: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop", altText: "Jacket Detail" } }] },
                variants: { edges: [{ node: { id: "v17", title: "Default / Brown" } }] },
            },
        },
        {
            node: {
                id: "m5",
                title: "Casual Linen Shirt",
                handle: "linen-shirt",
                priceRange: { minVariantPrice: { amount: "50.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1000&auto=format&fit=crop", altText: "Linen Shirt" } }, { node: { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop", altText: "Linen Shirt Detail" } }] },
                variants: { edges: [{ node: { id: "v18", title: "Default / Blue" } }] },
            },
        },
        {
            node: {
                id: "m6",
                title: "Tailored Trousers",
                handle: "tailored-trousers",
                priceRange: { minVariantPrice: { amount: "90.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1507680434567-5739c8a92437?q=80&w=1000&auto=format&fit=crop", altText: "Trousers" } }, { node: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", altText: "Trousers Detail" } }] },
                variants: { edges: [{ node: { id: "v19", title: "Default / Grey" } }] },
            },
        },
        {
            node: {
                id: "m7",
                title: "Polo Shirt",
                handle: "polo-shirt",
                priceRange: { minVariantPrice: { amount: "45.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=1000&auto=format&fit=crop", altText: "Polo" } }, { node: { url: "https://images.unsplash.com/photo-1625910515337-17d7993ca1ef?q=80&w=1000&auto=format&fit=crop", altText: "Polo Detail" } }] },
                variants: { edges: [{ node: { id: "v20", title: "Default / Green" } }] },
            },
        },
        {
            node: {
                id: "m8",
                title: "Denim Jeans",
                handle: "denim-jeans",
                priceRange: { minVariantPrice: { amount: "70.00", currencyCode: "USD" } },
                images: { edges: [{ node: { url: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=1000&auto=format&fit=crop", altText: "Jeans" } }, { node: { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop", altText: "Jeans Detail" } }] },
                variants: { edges: [{ node: { id: "v21", title: "Default / Blue" } }] },
            },
        },
    ],
};

export default function ShopByOccasion() {
    const [activeTab, setActiveTab] = useState<"women" | "men">("women");
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const itemsPerPage = 4;
    const products = MOCK_PRODUCTS[activeTab];
    const totalPages = Math.ceil(products.length / itemsPerPage);

    const nextPage = () => {
        setDirection(1);
        setPageIndex((prev) => (prev + 1) % totalPages);
    };

    const prevPage = () => {
        setDirection(-1);
        setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
        }),
    };

    // Reset page when tab changes
    const handleTabChange = (tab: "women" | "men") => {
        setActiveTab(tab);
        setPageIndex(0);
    };

    const visibleProducts = products.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
    );

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    return (
        <section className="container mx-auto px-4 pt-12 pb-12 md:py-24 group/section overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12"
            >
                <h2 className="text-[32px] md:text-5xl font-lora text-slate-900 mb-6 md:mb-8">
                    Shop Essentials
                </h2>

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    {(["women", "men"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Navigation Arrows (Reveal on Hover) */}
                <button
                    onClick={prevPage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover/section:opacity-100 group-hover/section:translate-x-0 transition-all duration-300 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white text-slate-900 hidden md:block"
                    aria-label="Previous"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextPage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover/section:opacity-100 group-hover/section:translate-x-0 transition-all duration-300 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white text-slate-900 hidden md:block"
                    aria-label="Next"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Products Grid - Mobile Scroll / Desktop Grid */}
                <div className="overflow-x-auto md:overflow-hidden pb-8 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={`${activeTab}-${pageIndex}`}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "tween", ease: "easeInOut", duration: 0.5 },
                                opacity: { duration: 0.2 },
                            }}
                            className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 w-max md:w-full"
                        >
                            {visibleProducts.map((product, index) => (
                                <motion.div
                                    key={product.node.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="w-[85vw] md:w-auto snap-center shrink-0"
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
