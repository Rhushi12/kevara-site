"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import LiquidButton from "@/components/ui/LiquidButton";

interface LookbookFeatureProps {
    title?: string;
    subtitle?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
}

export default function LookbookFeature({
    title = "Home Sanctuary <br /> Lookbook",
    subtitle = "Spring Summer 21'",
    image = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
    ctaText = "Discover",
    ctaLink = "/pages/lookbook",
}: LookbookFeatureProps) {
    return (
        <section className="py-24 bg-[#FDFBF7] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="relative max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Image Section (Span 8) */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="md:col-span-8 relative h-[600px] w-full"
                        >
                            <Image
                                src={image}
                                alt={title.replace(/<br\s*\/?>/gi, " ")}
                                fill
                                className="object-cover"
                            />
                        </motion.div>

                        {/* Floating Card Section (Span 4, but overlapping) */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="md:col-span-4 md:-ml-24 z-10"
                        >
                            <div className="bg-[#F5F2EB] p-12 md:p-16 shadow-lg">
                                <span className="block text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
                                    {subtitle}
                                </span>
                                <h2
                                    className="text-4xl font-lora text-slate-900 mb-8 leading-tight"
                                    dangerouslySetInnerHTML={{ __html: title }}
                                />
                                <LiquidButton href={ctaLink}>
                                    {ctaText}
                                </LiquidButton>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
