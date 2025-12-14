"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LiquidButton from "@/components/ui/LiquidButton";

export default function AccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <main className="min-h-screen bg-[#FDFBF7] flex flex-col font-figtree">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-2xl mx-auto bg-white p-6 md:p-12 border border-gray-100 shadow-sm">
                    <h1 className="text-3xl md:text-4xl font-lora font-light text-slate-900 mb-2">
                        My Account
                    </h1>
                    <p className="text-gray-500 mb-12">Manage your account settings and preferences.</p>

                    <div className="space-y-8">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-[#0E4D55] text-white flex items-center justify-center text-2xl font-lora">
                                {user.displayName?.charAt(0) || "U"}
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-slate-900">{user.displayName || "User"}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-6 border border-gray-100 rounded hover:border-[#006D77] transition-colors cursor-pointer group">
                                <h3 className="font-medium text-slate-900 mb-2 group-hover:text-[#006D77]">Order History</h3>
                                <p className="text-sm text-gray-500">View your past orders and returns.</p>
                            </div>
                            <div className="p-6 border border-gray-100 rounded hover:border-[#006D77] transition-colors cursor-pointer group">
                                <h3 className="font-medium text-slate-900 mb-2 group-hover:text-[#006D77]">Address Book</h3>
                                <p className="text-sm text-gray-500">Manage your shipping addresses.</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button
                                onClick={() => logout()}
                                className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
