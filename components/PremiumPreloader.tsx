"use client";

import { motion } from "framer-motion";

export default function PremiumPreloader() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0E4D55]">
            <div className="relative p-8">
                {/* Text Animation */}
                <div className="flex items-center gap-[0.05em] overflow-hidden">
                    {["K", "e", "v", "a", "r", "a"].map((letter, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            transition={{
                                duration: 1,
                                delay: i * 0.08,
                                ease: [0.22, 1, 0.36, 1],
                                repeat: Infinity,
                                repeatDelay: 3,
                                repeatType: "reverse"
                            }}
                            className="text-5xl md:text-7xl lg:text-8xl font-prata font-medium text-white tracking-[-0.04em]"
                        >
                            {letter}
                        </motion.span>
                    ))}
                </div>

                {/* Elegant Line Animation */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 2.5
                    }}
                    className="absolute bottom-4 left-8 right-8 h-[1px] bg-white origin-left"
                />
            </div>
        </div>
    );
}
