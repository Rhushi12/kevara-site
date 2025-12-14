"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithLoaderProps extends ImageProps {
    skipFadeIn?: boolean;
}

export default function ImageWithLoader({ className, skipFadeIn = false, ...props }: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 transition-opacity duration-300">
                    {/* Spinner or empty, the bg covers it */}
                </div>
            )}
            <Image
                {...props}
                className={`${className || ""} ${!skipFadeIn ? `transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}` : ""}`}
                onLoad={() => setIsLoading(false)}
            />
        </>
    );
}
