"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Background Image */}
            {/* Accent Background Layer (Revealed first) */}
            <div className="absolute inset-0 bg-[#006D77]" />

            {/* Hero Image Container - Slides up to cover accent background */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Custom easeOutQuint-like curve
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop')",
                }}
            >
                {/* Dark Overlay for Readability */}
                <div className="absolute inset-0 bg-black/30" />
            </motion.div>

            {/* Centered Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <div className="max-w-4xl w-full bg-white/20 backdrop-blur-md p-12 rounded-sm shadow-2xl border border-white/30">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-sm md:text-base uppercase tracking-[0.2em] mb-6 text-deep-teal font-figtree font-bold"
                    >
                        New Collection
                    </motion.h2>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-6xl md:text-8xl font-lora mb-8 text-deep-teal leading-tight"
                    >
                        Elevate Your <br />
                        <span className="italic">Everyday Style</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <button className="group relative overflow-hidden bg-deep-teal text-white px-10 py-4 font-figtree tracking-wide transition-all duration-300 hover:shadow-lg hover:bg-slate-900">
                            <span className="relative z-10 flex items-center gap-2 transition-colors duration-300">
                                Shop Now <ArrowRight size={18} />
                            </span>
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
