"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

export default function ImageWithLoader({ className, ...props }: ImageProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#006D77] rounded-full animate-spin" />
                </div>
            )}
            <Image
                {...props}
                className={`${className || ""} transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"
                    }`}
                onLoad={() => setIsLoading(false)}
            />
        </>
    );
}
