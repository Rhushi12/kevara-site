"use client";

import Link from "next/link";
import Image from "next/image";
import ImageWithLoader from "@/components/ui/ImageWithLoader";

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
    // Extract colors: use explicit colors field if available, otherwise dedupe from variants
    const colors = product.node.colors && product.node.colors.length > 0
        ? product.node.colors.map(c => c.name)
        : Array.from(new Set(variants?.edges?.map((v) => {
            const parts = v.node.title.split("/");
            return parts.length > 1 ? parts[1].trim() : "Default";
        }).filter(c => c !== "Default") || []));

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
        <div className="group/card relative flex flex-col text-center h-auto">
            {/* Image/Video Container */}
            <div className={`relative w-full ${imageAspectRatio} mb-3 overflow-hidden bg-gray-100 rounded-sm`}>
                <Link href={`/products/${productSlug}`} className="absolute inset-0 z-10 block">

                    {/* Video Layer */}
                    {video && (
                        <div className="absolute inset-0 z-10 transition-opacity duration-300 group-hover/card:opacity-0">
                            <video
                                src={video}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    )}

                    {/* Primary Image */}
                    {imageUrl && (
                        <ImageWithLoader
                            src={imageUrl}
                            alt={altText}
                            fill
                            className={`object-cover object-center transition-transform duration-700 group-hover/card:scale-105 ${video ? 'z-0' : 'z-10'}`}
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    )}

                    {/* Secondary Image */}
                    {!video && secondImageUrl && (
                        <ImageWithLoader
                            src={secondImageUrl}
                            alt={altText}
                            fill
                            skipFadeIn={true}
                            className="object-cover object-center absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 z-20"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    )}
                </Link>

                {/* Sale Badge */}
                {/* Mock Compare Price Logic: If price < 100 and NOT a range, assume it was higher */}
                {!price.includes('-') && parseFloat(price) < 100 && (
                    <span className="absolute top-2 left-2 z-20 bg-red-800 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wide md:text-xs">
                        Save 50%
                    </span>
                )}

                {/* Quick Add Button */}
                <button
                    className="absolute bottom-2 right-2 z-30 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickView(product);
                    }}
                    aria-label="Quick Add"
                >
                    <ShoppingBag size={16} strokeWidth={2} className="text-black" />
                </button>
            </div>

            {/* Product Info */}
            <Link href={`/products/${productSlug}`} className="w-full">
                <h3 className="text-sm text-gray-900 font-medium line-clamp-1 md:text-base font-figtree">
                    {title}
                </h3>
            </Link>

            {/* Price */}
            <div className="flex gap-2 items-center justify-center mt-1">
                {!price.includes('-') && parseFloat(price) < 100 && (
                    <span className="text-xs text-red-700 line-through md:text-sm font-figtree">
                        {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: currency,
                        }).format(parseFloat(price) * 2)}
                    </span>
                )}
                <span className="text-sm font-semibold text-gray-900 md:text-base font-figtree">
                    {price.includes('-') ? (
                        <>
                            {price.includes(currency === 'USD' ? '$' : '₹') ? price : `${currency === 'INR' ? '₹' : '$'}${price}`}
                        </>
                    ) : (
                        new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: currency,
                        }).format(parseFloat(price))
                    )}
                </span>
            </div>

            {/* Color Count */}
            {colors.length > 0 && (
                <p className="text-xs text-gray-500 mt-1 md:text-sm font-figtree">
                    {colors.length} {colors.length === 1 ? 'color' : 'colors'} available
                </p>
            )}
        </div>
    );
}
