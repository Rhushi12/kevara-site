"use client";

import { Heart } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

export default function VideoPromo() {
    return (
        <section className="container mx-auto px-4 py-20">
            <div className="relative h-[600px] w-full rounded-2xl overflow-hidden">
                {/* Background Video */}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source
                        src="https://videos.pexels.com/video-files/3205916/3205916-hd_1920_1080_25fps.mp4"
                        type="video/mp4"
                    />
                    {/* Fallback Image if video fails */}
                    <img
                        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop"
                        alt="Fashion Promo"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </video>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
                    <div className="mb-6 animate-fade-in-up">
                        <Heart className="w-12 h-12 text-white" strokeWidth={1.5} />
                    </div>

                    <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4 animate-fade-in-up delay-100">
                        Trendy Collection
                    </span>

                    <h2 className="text-4xl md:text-6xl font-lora font-medium mb-8 leading-tight max-w-3xl animate-fade-in-up delay-200">
                        Connect. Communicate. <br /> Collaborate.
                    </h2>

                    <div className="animate-fade-in-up delay-300">
                        <LiquidButton
                            href="/collections/all"
                            variant="secondary"
                            className="bg-white text-slate-900 hover:text-slate-900 border-none"
                        >
                            Shop Collection
                        </LiquidButton>
                    </div>
                </div>
            </div>
        </section>
    );
}
