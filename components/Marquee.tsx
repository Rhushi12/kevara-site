"use client";

import { motion } from "framer-motion";

export default function Marquee() {
    const text = "PREMIUM COTTON • MADE IN INDIA • FREE SHIPPING • ";
    const repeatCount = 10; // Repeat enough times to fill screen width

    return (
        <div className="bg-deep-teal py-3 overflow-hidden whitespace-nowrap">
            <motion.div
                className="inline-block"
                animate={{ x: "-50%" }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 20, // Adjust speed here
                }}
            >
                <div className="flex">
                    {Array.from({ length: repeatCount }).map((_, i) => (
                        <span
                            key={i}
                            className="text-white text-xs md:text-sm font-medium tracking-widest px-4 font-figtree uppercase"
                        >
                            {text}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
