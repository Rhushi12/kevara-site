"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminBypassPage() {
    const { user, isAdmin, signInWithGoogle, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState("");
    const [bypassEnabled, setBypassEnabled] = useState(false);

    // Check if already has bypass cookie
    useEffect(() => {
        const hasbypass = document.cookie.includes("admin_bypass=true");
        if (hasbypass) {
            setBypassEnabled(true);
        }
    }, []);

    // Enable bypass when admin is authenticated
    useEffect(() => {
        if (!loading && user && isAdmin) {
            enableBypass();
        } else if (!loading && user && !isAdmin) {
            setError("You don't have admin privileges. Please contact support.");
        }
    }, [user, isAdmin, loading]);

    const enableBypass = () => {
        // Set cookie for 7 days
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `admin_bypass=true; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
        setBypassEnabled(true);

        // Redirect to home after a short delay
        setTimeout(() => {
            router.push("/");
        }, 1500);
    };

    const handleLogin = async () => {
        setError("");
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Login failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#0A1A1C] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full opacity-20"
                    style={{
                        background: "radial-gradient(circle, #0E4D55 0%, transparent 70%)",
                        filter: "blur(60px)",
                        left: "20%",
                        top: "30%",
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 bg-white/5 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-8 max-w-md w-full text-center"
            >
                {/* Icon */}
                <motion.div
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center"
                    animate={{
                        boxShadow: [
                            "0 0 20px rgba(20, 184, 166, 0.2)",
                            "0 0 40px rgba(20, 184, 166, 0.4)",
                            "0 0 20px rgba(20, 184, 166, 0.2)",
                        ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg
                        className="w-8 h-8 text-teal-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </motion.div>

                <h1 className="text-2xl font-prata text-white mb-2">Admin Access</h1>
                <p className="text-gray-400 mb-8">
                    Sign in to bypass the maintenance page
                </p>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 text-teal-400">
                        <motion.div
                            className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Loading...</span>
                    </div>
                ) : bypassEnabled ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-teal-400 flex flex-col items-center gap-3"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </motion.div>
                        <span className="text-lg">Access Granted!</span>
                        <span className="text-sm text-gray-500">Redirecting to site...</span>
                    </motion.div>
                ) : user && isAdmin ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-teal-400"
                    >
                        Enabling bypass...
                    </motion.div>
                ) : (
                    <>
                        <motion.button
                            onClick={handleLogin}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/15 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Sign in with Google
                        </motion.button>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                    </>
                )}

                <a
                    href="/under-construction"
                    className="inline-block mt-6 text-sm text-gray-500 hover:text-teal-400 transition-colors"
                >
                    ← Back
                </a>
            </motion.div>
        </div>
    );
}
