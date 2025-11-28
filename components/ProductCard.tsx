"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";
import { useQuickViewStore } from "@/lib/store";

interface ProductCardProps {
    product: {
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
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const { openQuickView } = useQuickViewStore();
    const { title, priceRange, images, variants } = product.node;
    const price = priceRange.minVariantPrice.amount;
    const currency = priceRange.minVariantPrice.currencyCode;
    const imageUrl = images.edges[0]?.node.url;
    const secondImageUrl = images.edges[1]?.node.url;
    const altText = images.edges[0]?.node.altText || title;

    // Extract colors from variants (Mock logic: assume variant title contains color)
    // In a real app, this would parse options.
    const colors = variants.edges.map((v) => {
        const parts = v.node.title.split("/");
        return parts.length > 1 ? parts[1].trim() : "Default";
    });

    // Map color names to hex codes (Mock logic)
    const getColorHex = (name: string) => {
        const map: Record<string, string> = {
            Blue: "#1E3A8A",
            Red: "#B91C1C",
            Beige: "#D4D4D8",
            Black: "#18181B",
            Grey: "#71717A",
            Brown: "#78350F",
            Default: "#000000",
        };
        return map[name] || "#000000";
    };

    return (
        <div className="group/card relative flex flex-col h-full">
            {/* Image Container */}
            <div className="relative w-full overflow-hidden bg-gray-100 aspect-[3/4] rounded-lg">
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt={altText}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                )}

                {/* Secondary Image (Hover) */}
                {secondImageUrl && (
                    <Image
                        src={secondImageUrl}
                        alt={altText}
                        fill
                        className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                )}

                {/* Quick Add Button - Slide up on hover */}
                {/* Desktop: Quick View Button - Slide up on hover */}
                <div className="hidden md:block absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100 z-20">
                    <LiquidButton
                        className="w-full bg-white text-slate-900 hover:text-slate-900 py-3 flex flex-col items-center justify-center gap-1 rounded shadow-lg border-none"
                        variant="secondary"
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openQuickView(product);
                        }}
                    >
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <ShoppingBag size={18} strokeWidth={1.5} className="mb-1" />
                            <span className="text-[10px] font-bold tracking-widest uppercase leading-none text-center">Quick View</span>
                        </div>
                    </LiquidButton>
                </div>

                {/* Mobile: Quick View Button - Always visible icon */}
                <button
                    className="md:hidden absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg text-slate-900 active:scale-95 transition-transform"
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickView(product);
                    }}
                    aria-label="Quick View"
                >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                </button>
            </div>

            {/* Product Info */}
            <div className="mt-4 space-y-2">
                <h3 className="text-lg font-lora text-gray-900 group-hover/card:text-slate-900 transition-colors">
                    {title}
                </h3>

                {/* Color Swatches */}
                <div className="flex gap-2">
                    {colors.map((color, idx) => (
                        <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: getColorHex(color) }}
                            title={color}
                        />
                    ))}
                </div>

                <p className="text-sm font-figtree text-gray-600">
                    {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: currency,
                    }).format(parseFloat(price))}
                </p>
            </div>
        </div>
    );
}
