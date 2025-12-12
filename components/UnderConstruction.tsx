"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import LiquidButton from "@/components/ui/LiquidButton";

export default function UnderConstruction() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-slate-900 p-8">
            <div className="relative mb-12">
                {/* Animated Logo/Text */}
                <div className="flex items-center gap-[0.2em] overflow-hidden">
                    {["C", "O", "M", "I", "N", "G", " ", "S", "O", "O", "N"].map((letter, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            transition={{
                                duration: 0.8,
                                delay: i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="text-3xl md:text-5xl font-lora font-medium tracking-widest"
                        >
                            {letter}
                        </motion.span>
                    ))}
                </div>

                {/* Decorative Line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                    className="absolute -bottom-4 left-0 right-0 h-[1px] bg-slate-900 origin-left"
                />
            </div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-slate-600 text-center max-w-md mb-12 font-figtree"
            >
                We are currently crafting this experience. Please check back later for something extraordinary.
            </motion.p>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <button
                    onClick={() => router.back()}
                    className="px-8 py-3 border border-slate-900 rounded-full hover:bg-slate-900 hover:text-white transition-all duration-300 uppercase tracking-wider text-sm"
                >
                    Go Back
                </button>
            </motion.div>
        </div>
    );
}
