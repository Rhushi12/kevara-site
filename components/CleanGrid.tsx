"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductPicker from "@/components/admin/ProductPicker";
import CarouselArrowButton from "@/components/ui/CarouselArrowButton";

interface CleanGridProps {
    data?: {
        title?: string;
        products?: string[]; // List of handles
    };
    isEditMode?: boolean;
    onUpdate?: (newData: any) => void;
    // Fallback for direct usage (if any)
    products?: any[];
}

export default function CleanGrid({
    data = {
        title: "Latest Arrivals",
        products: []
    },
    isEditMode = false,
    onUpdate,
    products: propProducts
}: CleanGridProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [products, setProducts] = useState<any[]>(propProducts || []);
    const [loading, setLoading] = useState(false);

    // Fetch products if data.products is provided
    useEffect(() => {
        if (propProducts) return; // Use prop products if provided (legacy support)

        const handles = data.products;
        if (!handles || handles.length === 0) {
            setProducts([]);
            return;
        }

        setLoading(true);
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

    }, [data.products, propProducts]);

    // Duplicate products to ensure we have enough for the carousel if needed
    // For manual selection, we might want to just show what's selected, but let's keep carousel logic
    const carouselProducts = products.length > 0 ? [...products, ...products, ...products] : [];
    const itemsPerPage = 4;
    const totalPages = Math.ceil(carouselProducts.length / itemsPerPage);

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

    const visibleProducts = carouselProducts.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
    );

    return (
        <section className="container mx-auto px-4 py-20 group/section relative">
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

                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-2">
                                Selected Products
                            </p>
                            <ProductPicker
                                selectedHandles={data.products || []}
                                onSelectionChange={(handles) => {
                                    onUpdate?.({ ...data, products: handles });
                                }}
                                maxSelection={12}
                            />
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-4xl md:text-5xl font-lora text-center mb-12 text-slate-900">
                {data.title}
            </h2>

            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p>No products selected.</p>
                        {isEditMode && <p className="text-sm mt-2">Use the editor to select products.</p>}
                    </div>
                ) : (
                    <>
                        {/* Navigation Arrows (Reveal on Hover) */}
                        {carouselProducts.length > itemsPerPage && (
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

                        {/* Products Carousel */}
                        <div className="overflow-hidden">
                            {/* Mobile: Horizontal Scroll (All Products) */}
                            <div
                                className="md:hidden overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide flex gap-4 touch-pan-x"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {products.map((product, index) => (
                                    <motion.div
                                        key={`${product.node.id}-mobile-${index}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="w-[85vw] shrink-0 snap-center"
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Desktop: Paginated Grid */}
                            <div className="hidden md:block overflow-hidden">
                                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                    <motion.div
                                        key={pageIndex}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "tween", ease: "easeInOut", duration: 0.5 },
                                            opacity: { duration: 0.2 },
                                        }}
                                        className="grid grid-cols-4 gap-8 w-full"
                                    >
                                        {visibleProducts.map((product, index) => (
                                            <motion.div
                                                key={`${product.node.id}-${index}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                            >
                                                <ProductCard product={product} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
