"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiquidButton from "@/components/ui/LiquidButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
    const { signInWithGoogle, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Signup failed", error);
        }
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-grow flex items-center justify-center py-24 px-4">
                <div className="w-full max-w-md bg-white p-8 md:p-12 shadow-sm border border-gray-100">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-lora font-bold text-slate-900 mb-3">Create Account</h1>
                        <p className="text-sm text-gray-500 font-figtree">
                            Please fill in the information below:
                        </p>
                    </div>

                    <div className="mb-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-slate-700 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                            Continue with Google
                        </button>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6">
                        <div>
                            <input
                                type="text"
                                placeholder="First Name"
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#006D77] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Last Name"
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#006D77] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#006D77] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#006D77] transition-colors"
                            />
                        </div>

                        <LiquidButton
                            type="submit"
                            className="w-full bg-[#006D77] text-white py-3 font-medium hover:bg-[#005a63]"
                        >
                            Create my account
                        </LiquidButton>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 font-figtree">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#006D77] font-medium hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
