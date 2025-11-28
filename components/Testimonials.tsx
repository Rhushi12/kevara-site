"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Testimonials() {
    const testimonials = [
        {
            quote: "The fabric quality is unmatched. Truly feels like a luxury brand.",
            author: "Rahul M.",
        },
        {
            quote: "Elegant designs that fit perfectly. My go-to for evening wear.",
            author: "Priya S.",
        },
        {
            quote: "Fast shipping and beautiful packaging. Highly recommended!",
            author: "Ankit K.",
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <section className="bg-warm-cream py-20 border-t border-gray-200/50">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-2xl md:text-4xl font-lora text-slate-900 italic mb-8 leading-relaxed">
                            &ldquo;{testimonials[currentIndex].quote}&rdquo;
                        </p>
                        <p className="text-sm font-figtree font-bold text-slate-900 tracking-widest uppercase">
                            - {testimonials[currentIndex].author}
                        </p>
                    </motion.div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-slate-900 w-6" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
