"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, ShoppingBag } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useQuickViewStore } from "@/lib/store";
import { Product } from "@/lib/store";

interface ProductCardProps {
    product: Product;
    imageAspectRatio?: string;
}

export default function ProductCard({ product, imageAspectRatio = "aspect-[3/4]" }: ProductCardProps) {
    const { openQuickView } = useQuickViewStore();

    if (!product?.node) return null;

    const { title, handle, slug, priceRange, images, variants, video } = product.node;

    const price = priceRange?.minVariantPrice?.amount || "0";
    const currency = priceRange?.minVariantPrice?.currencyCode || "USD";
    const imageUrl = images?.edges?.[0]?.node?.url;
    const secondImageUrl = images?.edges?.[1]?.node?.url;
    const altText = images?.edges?.[0]?.node?.altText || title;

    // Extract colors from variants (Mock logic: assume variant title contains color)
    const colors = variants?.edges?.map((v) => {
        const parts = v.node.title.split("/");
        return parts.length > 1 ? parts[1].trim() : "Default";
    }) || [];

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

    const productSlug = (slug && slug.length > 2) ? slug : (handle && handle.length > 2) ? handle : null;

    if (!productSlug) return null;

    return (
        <div className="group/card relative flex flex-col h-full">
            {/* Image/Video Container */}
            <div className={`relative w-full overflow-hidden bg-gray-100 ${imageAspectRatio} rounded-lg`}>
                <Link href={`/products/${productSlug}`} className="block w-full h-full">

                    {/* Video Layer - Plays by default, hides on hover */}
                    {video && (
                        <div className="absolute inset-0 z-10 transition-opacity duration-300 group-hover/card:opacity-0">
                            <video
                                src={video}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Primary Image - Shows when video is hidden (hover) or if no video */}
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={altText}
                            fill
                            className={`object-cover transition-transform duration-700 group-hover/card:scale-105 ${video ? 'z-0' : 'z-10'}`}
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    )}

                    {/* Secondary Image (Hover) - Only if NO video */}
                    {!video && secondImageUrl && (
                        <Image
                            src={secondImageUrl}
                            alt={altText}
                            fill
                            className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 z-20"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    )}
                </Link>

                {/* Quick View Button - Desktop */}
                <div className="hidden md:block absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100 z-30">
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

                {/* Quick View Button - Mobile */}
                <button
                    className="md:hidden absolute bottom-3 right-3 z-30 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg text-slate-900 active:scale-95 transition-transform"
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
            <div className="mt-4 space-y-2 text-center">
                <Link href={`/products/${productSlug}`}>
                    <h3 className="text-lg font-normal font-figtree text-gray-900 group-hover/card:text-slate-900 transition-colors">
                        {title}
                    </h3>
                </Link>

                {/* Price */}
                <p className="text-sm font-figtree text-black">
                    {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: currency,
                    }).format(parseFloat(price))}
                </p>

                {/* Color Count */}
                {colors.length > 0 && (
                    <p className="text-sm text-gray-500 font-figtree">
                        {colors.length} {colors.length === 1 ? 'color' : 'colors'} available
                    </p>
                )}
            </div>
        </div>
    );
}
