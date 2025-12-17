"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

// Fixed particle positions to avoid hydration mismatch (no Math.random())
const PARTICLES = [
    { left: "5%", top: "15%", opacity: 0.6, delay: 0 },
    { left: "15%", top: "75%", opacity: 0.5, delay: 0.5 },
    { left: "25%", top: "35%", opacity: 0.7, delay: 1.0 },
    { left: "35%", top: "85%", opacity: 0.4, delay: 1.5 },
    { left: "45%", top: "25%", opacity: 0.6, delay: 2.0 },
    { left: "55%", top: "65%", opacity: 0.5, delay: 2.5 },
    { left: "65%", top: "45%", opacity: 0.7, delay: 3.0 },
    { left: "75%", top: "20%", opacity: 0.4, delay: 3.5 },
    { left: "85%", top: "70%", opacity: 0.6, delay: 4.0 },
    { left: "92%", top: "40%", opacity: 0.5, delay: 4.5 },
    { left: "10%", top: "50%", opacity: 0.7, delay: 1.2 },
    { left: "80%", top: "90%", opacity: 0.5, delay: 2.2 },
];

export default function UnderConstructionPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // TODO: Connect to email service
            setSubmitted(true);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-[#0A1A1C] flex items-center justify-center px-4 sm:px-6" style={{ touchAction: 'auto' }}>
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large floating orbs */}
                <motion.div
                    className="absolute w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] rounded-full opacity-20"
                    style={{
                        background: "radial-gradient(circle, #0E4D55 0%, transparent 70%)",
                        filter: "blur(60px)",
                    }}
                    animate={{
                        x: ["-20%", "10%", "-20%"],
                        y: ["-10%", "20%", "-10%"],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute right-0 bottom-0 w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] rounded-full opacity-15"
                    style={{
                        background: "radial-gradient(circle, #1A7A85 0%, transparent 70%)",
                        filter: "blur(50px)",
                    }}
                    animate={{
                        x: ["20%", "-10%", "20%"],
                        y: ["10%", "-20%", "10%"],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute left-1/2 top-1/2 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] rounded-full opacity-10"
                    style={{
                        background: "radial-gradient(circle, #2DD4BF 0%, transparent 70%)",
                        filter: "blur(40px)",
                    }}
                    animate={{
                        x: ["-50%", "-30%", "-50%"],
                        y: ["-50%", "-70%", "-50%"],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `
                            linear-gradient(#0E4D55 1px, transparent 1px),
                            linear-gradient(90deg, #0E4D55 1px, transparent 1px)
                        `,
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            {/* Floating Particles - Fixed positions */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {PARTICLES.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-teal-400"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            opacity: particle.opacity,
                        }}
                        animate={{
                            y: [0, -80, 0],
                            opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            delay: particle.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center w-full max-w-lg mx-auto">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-6 sm:mb-8"
                >
                    <Image
                        src="/aesthetic-logo.png"
                        alt="Kevara"
                        width={180}
                        height={60}
                        className="mx-auto h-10 sm:h-12 w-auto object-contain brightness-0 invert"
                        priority
                    />
                </motion.div>

                {/* Animated Loader Ring */}
                <motion.div
                    className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-8 sm:mb-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    {/* Outer ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-teal-500/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Middle ring */}
                    <motion.div
                        className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 border-r-teal-400"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Inner ring */}
                    <motion.div
                        className="absolute inset-4 rounded-full border-2 border-transparent border-b-teal-300"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Center pulse */}
                    <motion.div
                        className="absolute inset-6 sm:inset-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Glow effect */}
                    <motion.div
                        className="absolute inset-5 sm:inset-6 rounded-full blur-md bg-teal-500/40"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>

                {/* Title */}
                <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl font-prata text-white mb-3 sm:mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    Something{" "}
                    <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-teal-500 bg-clip-text text-transparent">
                        Beautiful
                    </span>
                    <br />
                    is Coming
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10 max-w-md mx-auto px-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    We&apos;re crafting something extraordinary. Be the first to experience timeless elegance.
                </motion.p>

                {/* Email Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="relative max-w-md mx-auto px-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    {!submitted ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-full bg-white/5 border border-teal-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all text-sm sm:text-base"
                                    required
                                />
                            </div>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium hover:from-teal-400 hover:to-teal-500 transition-all shadow-lg shadow-teal-500/25 text-sm sm:text-base"
                            >
                                Notify Me
                            </motion.button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2 text-teal-400 py-4"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="text-sm sm:text-base">Thank you! We&apos;ll keep you updated.</span>
                        </motion.div>
                    )}
                </motion.form>

                {/* Animated Dots */}
                <motion.div
                    className="flex items-center justify-center gap-2 mt-8 sm:mt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500"
                            animate={{
                                y: [0, -8, 0],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Admin Bypass Link - Subtle */}
            <motion.a
                href="/admin-bypass"
                className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 text-xs text-gray-600 hover:text-teal-400 transition-colors opacity-50 hover:opacity-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2 }}
            >
                Admin
            </motion.a>
        </div>
    );
}
