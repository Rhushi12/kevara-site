"use client";

import Image from "next/image";

export default function ProductStory() {
    return (
        <section className="relative py-24 bg-[#FDFBF7] overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    {/* Image */}
                    <div className="w-full md:w-1/2">
                        <div className="relative aspect-square md:aspect-[4/5] overflow-hidden rounded-sm">
                            <Image
                                src="https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=1200&auto=format&fit=crop"
                                alt="Woman in nature"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full md:w-1/2 text-center md:text-left">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#006D77] mb-4 block">
                            Our Philosophy
                        </span>
                        <h2 className="text-4xl md:text-5xl font-lora text-slate-900 mb-8 leading-tight">
                            Home Sanctuary
                        </h2>
                        <blockquote className="text-lg md:text-xl text-slate-600 font-light italic mb-8 leading-relaxed">
                            "The label has developed its own contemporary look that avoids trend chasing and focuses instead on practicality, quality, and timeless style."
                        </blockquote>
                        <button className="px-8 py-3 bg-[#4A3B32] text-white text-sm uppercase tracking-widest hover:bg-[#3A2E27] transition-colors">
                            Read Our Story
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F5F2EB] -z-0 hidden md:block" />
        </section>
    );
}
