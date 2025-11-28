"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

export default function FocalSection() {
    return (
        <section className="relative py-32 overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
                    alt="Focal Background"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-2xl mx-auto text-center text-white">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="block text-sm font-bold tracking-[0.2em] uppercase mb-4"
                    >
                        New Season
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-5xl md:text-6xl font-lora mb-8"
                    >
                        Focal on you
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-lg text-gray-200 mb-10"
                    >
                        Discover pieces designed to highlight your unique style and personality.
                        Crafted with care, worn with confidence.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <LiquidButton href="/collections/all" className="bg-white text-slate-900 hover:bg-gray-100">
                            Explore Collection
                        </LiquidButton>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
