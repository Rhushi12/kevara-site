"use client";

import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

export default function FabricFeature() {
    return (
        <section className="container mx-auto px-4 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Content (Text First) */}
                <div className="flex flex-col items-start justify-center text-left lg:pr-12 order-2 lg:order-1">
                    <span className="text-sm uppercase tracking-widest text-slate-500 font-figtree mb-4">
                        Our Craft
                    </span>
                    <h2 className="text-4xl md:text-5xl font-lora text-deep-teal mb-6 leading-tight">
                        Premium Cotton, <br /> In-House Stitching
                    </h2>
                    <p className="text-slate-900 font-figtree mb-8 leading-relaxed max-w-md">
                        We source only the finest, breathable cotton to ensure maximum comfort
                        and durability. Every piece is stitched in-house by our master
                        tailors, guaranteeing a perfect fit and exceptional quality that
                        lasts.
                    </p>
                    <LiquidButton className="text-xs font-bold tracking-[0.2em] uppercase">
                        Read Our Story
                    </LiquidButton>
                </div>

                {/* Right: Large Image */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm order-1 lg:order-2">
                    <Image
                        src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop"
                        alt="Premium Fabric Texture"
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                </div>
            </div>
        </section>
    );
}
