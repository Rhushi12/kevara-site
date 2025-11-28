"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
    {
        id: 1,
        title: "Outerwear",
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/outerwear",
    },
    {
        id: 2,
        title: "T-shirts",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/t-shirts",
    },
    {
        id: 3,
        title: "Skirts",
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/skirts",
    },
    {
        id: 4,
        title: "Dresses",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/dresses",
    },
    {
        id: 5,
        title: "Pants",
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/pants",
    },
    {
        id: 6,
        title: "Accessories",
        image: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/accessories",
    },
];

export default function ShopCategory() {
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const itemsPerPage = 3; // Show 3 items at a time for larger cards
    const totalPages = Math.ceil(CATEGORIES.length / itemsPerPage);

    const nextPage = () => {
        setDirection(1);
        setPageIndex((prev) => (prev + 1) % totalPages);
    };

    const prevPage = () => {
        setDirection(-1);
        setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const visibleCategories = CATEGORIES.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
    );

    // Handle edge case where last page has fewer items
    if (visibleCategories.length < itemsPerPage && CATEGORIES.length > itemsPerPage) {
        const remaining = itemsPerPage - visibleCategories.length;
        visibleCategories.push(...CATEGORIES.slice(0, remaining));
    }

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

    return (
        <section className="bg-[#006D77] py-24 overflow-hidden group/section">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 px-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { staggerChildren: 0.2 }
                            }
                        }}
                        className="text-left"
                    >
                        <motion.h2
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="text-sm font-bold tracking-[0.2em] text-white uppercase mb-4"
                        >
                            Discover
                        </motion.h2>
                        <motion.h3
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="text-4xl md:text-5xl font-lora text-white"
                        >
                            Shop Women
                        </motion.h3>
                    </motion.div>

                    {/* Navigation Arrows - Top Right */}
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <button
                            onClick={prevPage}
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full border border-white/20 transition-colors"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextPage}
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full border border-white/20 transition-colors"
                            aria-label="Next"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="relative max-w-7xl mx-auto">
                    {/* Mobile: Horizontal Scroll (All Categories) */}
                    <div className="md:hidden overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide flex gap-4">
                        {CATEGORIES.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="w-[85vw] shrink-0 snap-center relative aspect-[3/4] group cursor-pointer overflow-hidden rounded-lg"
                            >
                                <Image
                                    src={category.image}
                                    alt={category.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 85vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                                    <h3 className="text-3xl font-lora mb-2 text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        {category.title}
                                    </h3>
                                    <p className="text-sm font-medium tracking-widest uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                        Shop Now
                                    </p>
                                </div>
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
                                    x: { type: "tween", ease: "easeInOut", duration: 0.6 },
                                    opacity: { duration: 0.3 },
                                }}
                                className="grid grid-cols-3 gap-6"
                            >
                                {visibleCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={category.link}
                                        className="group/card relative block aspect-[3/4] overflow-hidden rounded-lg cursor-pointer"
                                    >
                                        {/* Image - Zoom Out Reveal */}
                                        <motion.div
                                            initial={{ scale: 1.2, opacity: 0 }}
                                            whileInView={{ scale: 1, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="w-full h-full"
                                        >
                                            <Image
                                                src={category.image}
                                                alt={category.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                            />
                                        </motion.div>

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/20 transition-colors duration-300" />

                                        {/* Text Content - Centered */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                            <motion.h4
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5, duration: 0.5 }}
                                                className="text-3xl md:text-4xl font-lora text-white mb-4 drop-shadow-md transform transition-transform duration-300 group-hover/card:-translate-y-2"
                                            >
                                                {category.title}
                                            </motion.h4>

                                            {/* Button - Reveals on Hover */}
                                            <div className="overflow-hidden h-0 group-hover/card:h-auto transition-all duration-300 opacity-0 group-hover/card:opacity-100">
                                                <span className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-white uppercase border-b border-white pb-1">
                                                    Shop Now <ArrowRight size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
