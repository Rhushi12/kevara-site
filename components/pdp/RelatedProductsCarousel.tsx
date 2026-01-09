"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import CarouselArrowButton from "@/components/ui/CarouselArrowButton";

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
                altText?: string;
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
        <div className="pt-12 bg-white">
            <div className="container mx-auto px-4 text-center mb-12">
                <h2 className="text-3xl font-lora text-slate-900">You may also like</h2>
            </div>

            <div className="container mx-auto px-4">
                {/* Carousel Wrapper with relative positioning for arrows */}
                <div className="relative group">
                    {/* Carousel Container */}
                    <div
                        ref={sliderRef}
                        className={`flex items-start gap-6 py-2 overflow-x-auto overflow-y-hidden max-h-[600px] snap-x snap-mandatory touch-manipulation ${isDown ? "cursor-grabbing" : "cursor-grab"
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
                                className="min-w-[280px] md:min-w-[300px] h-fit self-start snap-start flex-shrink-0 select-none"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <ProductCard product={{
                                    node: {
                                        id: product.handle, // Using handle as ID since ID might not be in this flat structure
                                        title: product.title,
                                        handle: product.handle,
                                        slug: product.slug,
                                        priceRange: product.priceRange,
                                        images: product.images,
                                        variants: { edges: [] } // Mock variants if missing
                                    }
                                }} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Navigation Arrows - positioned at image center height */}
                    <CarouselArrowButton
                        direction="left"
                        onClick={() => scroll("left")}
                        className="absolute -left-4 md:-left-6 top-[calc(150px)] -translate-y-1/2 z-40 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Scroll Left"
                    />
                    <CarouselArrowButton
                        direction="right"
                        onClick={() => scroll("right")}
                        className="absolute -right-4 md:-right-6 top-[calc(150px)] -translate-y-1/2 z-40 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Scroll Right"
                    />
                </div>
            </div>
        </div>
    );
}
