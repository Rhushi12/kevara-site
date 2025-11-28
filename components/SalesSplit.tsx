"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import LiquidButton from "@/components/ui/LiquidButton";

export default function SalesSplit() {
    return (
        <section className="container mx-auto px-4 py-12">
            <div className="flex md:grid md:grid-cols-2 gap-4 md:gap-8 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
                {/* Card 1 */}
                <div className="relative h-[500px] min-w-[85vw] md:min-w-0 md:w-full rounded-2xl overflow-hidden group snap-center">
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full h-full"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=1000&auto=format&fit=crop"
                            alt="Sleeveless Dress"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute bottom-12 left-8 text-white"
                    >
                        <span className="block text-xs font-bold tracking-[0.2em] uppercase mb-2">
                            Inspired by Play
                        </span>
                        <h3 className="text-4xl font-lora mb-8">
                            Sleeveless Dress
                        </h3>
                        <LiquidButton
                            href="/collections/dresses"
                            variant="secondary"
                            className="bg-white text-slate-900 hover:text-slate-900 border-none px-8 py-3 rounded-full"
                        >
                            Shop Save
                        </LiquidButton>
                    </motion.div>
                </div>

                {/* Card 2 */}
                <div className="relative h-[500px] min-w-[85vw] md:min-w-0 md:w-full rounded-2xl overflow-hidden group snap-center">
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full h-full"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                            alt="Boys Comfy Styles"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute bottom-12 left-8 text-white"
                    >
                        <span className="block text-xs font-bold tracking-[0.2em] uppercase mb-2">
                            Buy 1 Get 1 — Holiday Sale!
                        </span>
                        <h3 className="text-4xl font-lora mb-8">
                            Boys Comfy Styles
                        </h3>
                        <LiquidButton
                            href="/collections/sale"
                            variant="secondary"
                            className="bg-white text-slate-900 hover:text-slate-900 border-none px-8 py-3 rounded-full"
                        >
                            Shop Save
                        </LiquidButton>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
