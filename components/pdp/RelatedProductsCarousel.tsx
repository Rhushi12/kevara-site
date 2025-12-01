"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
    handle: string;
    title: string;
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
            };
        }[];
    };
    slug: string;
}

interface RelatedProductsCarouselProps {
    products: Product[];
}

export default function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const scroll = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const scrollAmount = current.clientWidth / 2; // Scroll half screen width
            current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;
        setIsDown(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDown(false);
    };

    const handleMouseUp = () => {
        setIsDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    if (products.length === 0) return null;

    return (
        <div className="py-24 bg-white">
            <div className="container mx-auto px-4 text-center mb-12">
                <h2 className="text-3xl font-lora text-slate-900">You may also like</h2>
            </div>

            <div className="container mx-auto px-4 relative group">
                {/* Carousel Container */}
                <div
                    ref={sliderRef}
                    className={`flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 ${isDown ? "cursor-grabbing" : "cursor-grab"
                        }`}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{
                        scrollBehavior: isDown ? "auto" : "smooth",
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {products.map((product, index) => (
                        <motion.div
                            key={product.handle}
                            className="min-w-[calc(50%-12px)] md:min-w-[calc(25%-18px)] snap-start flex-shrink-0 select-none"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link href={`/products/${product.slug}`} className="block group/card" draggable={false}>
                                <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-sm">
                                    {product.images?.edges?.[0]?.node?.url && (
                                        <Image
                                            src={product.images.edges[0].node.url}
                                            alt={product.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                            draggable={false}
                                        />
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-slate-900 group-hover/card:text-[#006D77] transition-colors">
                                    {product.title}
                                </h3>
                                <span className="text-xs text-slate-500">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: product.priceRange.minVariantPrice.currencyCode,
                                    }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Navigation Arrows (Visible on Hover) */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 p-3 rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#006D77] hover:text-white z-10 disabled:opacity-0"
                    aria-label="Scroll Left"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 p-3 rounded-full shadow-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#006D77] hover:text-white z-10"
                    aria-label="Scroll Right"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
