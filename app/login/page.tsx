"use client";

import Link from "next/link";
// We intentionally remove Navbar/Footer here for a clean landing page feel,
// OR we can keep them. Given "First Visit" landing, clean is often better.
// But user said "whenever a user first opens the site it should open the login page".
// Let's keep it clean but functional.
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoginPage() {
    const { signInWithGoogle, signInWithEmail, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            localStorage.setItem("hasVisited", "true");
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("hasVisited", "true");
        router.push("/");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!email || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmail(email, password);
            localStorage.setItem("hasVisited", "true");
            // router.push("/"); // AuthContext listener will handle redirect
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Image (Hidden on mobile used for premium feel) */}
            <div className="hidden lg:block relative h-full w-full bg-[#0E4D55] overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                    alt="Kevara Fashion"
                    fill
                    className="object-cover opacity-80"
                    priority
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-12 left-12 text-white">
                    <h2 className="text-4xl font-lora italic mb-4">"Elegance is not standing out, but being remembered."</h2>
                    <p className="font-figtree text-white/80 tracking-widest uppercase text-sm">Kevara Collection</p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex flex-col justify-center items-center p-8 bg-[#FDFBF7] relative">
                {/* Skip Button - Absolute Top Right */}
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-6 text-sm text-gray-400 hover:text-[#0E4D55] transition-colors font-medium"
                >
                    Skip to Store →
                </button>

                <div className="w-full max-w-md">
                    <div className="text-center mb-12">
                        <div className="relative w-32 h-10 mx-auto mb-8">
                            <Image
                                src="/aesthetic-logo.png"
                                alt="Kevara"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-lora text-slate-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500 font-figtree">Sign in to access your exclusive curation</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-slate-700 py-3.5 rounded-sm hover:border-[#0E4D55] hover:shadow-sm transition-all duration-300 font-medium text-sm group"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            Continue with Google
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="px-2 bg-[#FDFBF7] text-gray-400">Or email</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email address"
                                className="w-full bg-white border border-gray-200 px-4 py-3.5 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0E4D55] transition-colors rounded-sm"
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                className="w-full bg-white border border-gray-200 px-4 py-3.5 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0E4D55] transition-colors rounded-sm"
                            />
                            <div className="flex justify-end">
                                <Link href="#" className="text-xs text-gray-400 hover:text-[#0E4D55] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#0E4D55] text-white py-3.5 rounded-sm font-medium hover:bg-[#0A3A40] transition-colors shadow-lg shadow-[#0E4D55]/10 mt-2 disabled:opacity-50"
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                        </form>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        New to Kevara?{" "}
                        <Link href="/signup" className="text-[#0E4D55] font-medium hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
