"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductPicker from "@/components/admin/ProductPicker";
import CarouselArrowButton from "@/components/ui/CarouselArrowButton";

interface ShopByOccasionProps {
    data?: {
        title?: string;
        tab1Label?: string;
        tab2Label?: string;
        tab1Products?: string[]; // List of handles
        tab2Products?: string[]; // List of handles
    };
    isEditMode?: boolean;
    onUpdate?: (newData: any) => void;
}

export default function ShopByOccasion({
    data = {
        title: "Shop Essentials",
        tab1Label: "Women",
        tab2Label: "Men",
        tab1Products: [],
        tab2Products: []
    },
    isEditMode = false,
    onUpdate
}: ShopByOccasionProps) {
    const [activeTab, setActiveTab] = useState<"tab1" | "tab2">("tab1");
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const itemsPerPage = 4;

    // Fetch products when active tab or product list changes
    useEffect(() => {
        const handles = activeTab === "tab1" ? data.tab1Products : data.tab2Products;

        if (!handles || handles.length === 0) {
            setProducts([]);
            return;
        }

        setLoading(true);
        // Fetch all products and filter (optimization: could fetch specific handles if API supported it)
        fetch("/api/products")
            .then(res => res.json())
            .then(apiData => {
                if (apiData.products) {
                    // Filter products that match the selected handles
                    const filtered = apiData.products.filter((p: any) =>
                        handles.includes(p.node.handle)
                    );
                    // Sort to match the order of handles
                    const sorted = handles.map(handle =>
                        filtered.find((p: any) => p.node.handle === handle)
                    ).filter(Boolean);

                    setProducts(sorted);
                }
            })
            .catch(err => console.error("Failed to fetch products", err))
            .finally(() => setLoading(false));

    }, [activeTab, data.tab1Products, data.tab2Products]);


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
    const handleTabChange = (tab: "tab1" | "tab2") => {
        setActiveTab(tab);
        setPageIndex(0);
    };

    const visibleProducts = products.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
    );

    return (
        <section className="container mx-auto px-4 pt-12 pb-12 md:py-24 group/section relative">
            {isEditMode && (
                <div className="absolute top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-sm">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Edit2 size={16} /> Edit Section
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500">Section Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => onUpdate?.({ ...data, title: e.target.value })}
                                className="w-full border rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Tab 1 Label</label>
                                <input
                                    type="text"
                                    value={data.tab1Label}
                                    onChange={(e) => onUpdate?.({ ...data, tab1Label: e.target.value })}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Tab 2 Label</label>
                                <input
                                    type="text"
                                    value={data.tab2Label}
                                    onChange={(e) => onUpdate?.({ ...data, tab2Label: e.target.value })}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-2">
                                Products for {activeTab === "tab1" ? data.tab1Label : data.tab2Label}
                            </p>
                            <ProductPicker
                                selectedHandles={activeTab === "tab1" ? (data.tab1Products || []) : (data.tab2Products || [])}
                                onSelectionChange={(handles) => {
                                    if (activeTab === "tab1") {
                                        onUpdate?.({ ...data, tab1Products: handles });
                                    } else {
                                        onUpdate?.({ ...data, tab2Products: handles });
                                    }
                                }}
                                maxSelection={8}
                            />
                        </div>
                    </div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12"
            >
                <h2 className="text-[32px] md:text-5xl font-lora text-slate-900 mb-6 md:mb-8">
                    {data.title}
                </h2>

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    <button
                        onClick={() => handleTabChange("tab1")}
                        className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === "tab1" ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {data.tab1Label}
                        {activeTab === "tab1" && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange("tab2")}
                        className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === "tab2" ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {data.tab2Label}
                        {activeTab === "tab2" && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Carousel Container */}
            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p>No products selected for this category.</p>
                        {isEditMode && <p className="text-sm mt-2">Use the editor to select products.</p>}
                    </div>
                ) : (
                    <>
                        {/* Navigation Arrows */}
                        {products.length > itemsPerPage && (
                            <>


                                <CarouselArrowButton
                                    direction="left"
                                    onClick={prevPage}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 -translate-x-1/2"
                                    aria-label="Previous"
                                />

                                <CarouselArrowButton
                                    direction="right"
                                    onClick={nextPage}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-40 translate-x-1/2"
                                    aria-label="Next"
                                />
                            </>
                        )}

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
                                            key={`${product.node.id}-${index}`}
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
                    </>
                )}
            </div>
        </section>
    );
}
