"use client";

import { motion } from "framer-motion";
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
    return (
        <div className="relative min-h-screen w-full bg-[#0A1A1C] flex items-center justify-center px-4 sm:px-6" style={{ touchAction: 'auto' }}>
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
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
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
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
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
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

            {/* Floating Particles */}
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
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-teal-500/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 border-r-teal-400"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-4 rounded-full border-2 border-transparent border-b-teal-300"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-6 sm:inset-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
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
                    We&apos;ll Be{" "}
                    <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-teal-500 bg-clip-text text-transparent">
                        Right Back
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-base sm:text-lg text-gray-400 mb-4 max-w-md mx-auto px-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    We&apos;re performing a quick update to bring you an even better experience. This won&apos;t take long.
                </motion.p>

                {/* Estimated time note */}
                <motion.p
                    className="text-sm text-teal-400/70 mb-8 sm:mb-10 tracking-wide uppercase"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    Estimated downtime: ~1 hour
                </motion.p>

                {/* Wrench / Gear Icon */}
                <motion.div
                    className="flex items-center justify-center mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    <motion.svg
                        className="w-6 h-6 text-teal-500/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M11.42 15.17l-5.1 5.1a2.12 2.12 0 01-3-3l5.1-5.1m0 0L3.34 8.56a2.12 2.12 0 010-3L6 3l6.59 6.59m-1.17 5.58L15 11.63m0 0l3.41-3.42a2.12 2.12 0 013 0l.17.17a2.12 2.12 0 010 3L18 14.8"
                        />
                    </motion.svg>
                </motion.div>

                {/* Animated Dots */}
                <motion.div
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
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
