"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithLoaderProps extends ImageProps {
    skipFadeIn?: boolean;
}

export default function ImageWithLoader({ className, skipFadeIn = false, src, priority, ...props }: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Auto-detect Shopify CDN images and skip Next.js optimization (they're already optimized)
    const srcString = typeof src === 'string' ? src : '';
    const isShopifyCdn = srcString.includes('cdn.shopify');

    return (
        <>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 transition-opacity duration-300">
                    {/* Skeleton placeholder */}
                </div>
            )}
            <Image
                {...props}
                src={src}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                unoptimized={isShopifyCdn}
                className={`${className || ""} ${!skipFadeIn ? `transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}` : ""}`}
                onLoad={() => setIsLoading(false)}
            />
        </>
    );
}
