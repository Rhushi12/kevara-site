"use client";

import { Quote } from "lucide-react";

export default function QuoteSection() {
    return (
        <section className="py-24 bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 max-w-4xl text-center">
                <div className="flex justify-center mb-8">
                    <Quote size={48} className="text-gray-200 fill-gray-100" />
                </div>

                <blockquote className="text-2xl md:text-3xl font-lora text-slate-900 leading-relaxed mb-10">
                    "The label has developed its own contemporary look that avoids trend chasing and focuses instead on practicality, quality, and timeless style."
                </blockquote>

                <div className="flex justify-center">
                    <span className="text-sm font-bold tracking-widest uppercase border-b-2 border-slate-900 pb-1">
                        HIGHSNOBIETY
                    </span>
                </div>
            </div>
        </section>
    );
}
