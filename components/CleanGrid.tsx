"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        priceRange: {
            minVariantPrice: {
                amount: string;
                currencyCode: string;
            };
        };
        images: {
            edges: {
                node: {
                    url: string;
                    altText: string;
                };
            }[];
        };
        variants: {
            edges: {
                node: {
                    id: string;
                    title: string;
                };
            }[];
        };
    };
}

interface CleanGridProps {
    products: Product[];
}

export default function CleanGrid({ products }: CleanGridProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Duplicate products to ensure we have enough for the carousel
    const carouselProducts = [...products, ...products, ...products];
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

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const visibleProducts = carouselProducts.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
    );

    return (
        <section className="container mx-auto px-4 py-20 group/section overflow-hidden">
            <h2 className="text-4xl md:text-5xl font-lora text-center mb-12 text-slate-900">
                Latest Arrivals
            </h2>

            <div className="relative">
                {/* Navigation Arrows (Reveal on Hover) */}
                <button
                    onClick={prevPage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover/section:opacity-100 group-hover/section:translate-x-0 transition-all duration-300 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white text-slate-900"
                    aria-label="Previous"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextPage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover/section:opacity-100 group-hover/section:translate-x-0 transition-all duration-300 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white text-slate-900"
                    aria-label="Next"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Products Carousel */}
                <div className="overflow-hidden">
                    {/* Mobile: Horizontal Scroll (All Products) */}
                    <div className="md:hidden overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide flex gap-4">
                        {carouselProducts.map((product, index) => (
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
                                        key={product.node.id}
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
            </div>
        </section>
    );
}
