"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, ChevronRight } from "lucide-react";
import { OrderTrackingBlock } from "@/components/blocks/OrderTrackingBlock";
import { LoyaltyCommandCenter } from "@/components/blocks/LoyaltyCommandCenter";
import ProductCard from "@/components/ProductCard";

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    financialStatus: string;
    fulfillmentStatus: string;
    total: string;
    items: any[];
}

export default function AccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [curatedProducts, setCuratedProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (user?.email) {
            fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setOrders(data.orders || []);
                })
                .catch(err => console.error("Failed to fetch orders:", err));
        }

        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (data.products) setAllProducts(data.products);
            })
            .catch(err => console.error("Failed to fetch curated products:", err));

    }, [user, router]);

    useEffect(() => {
        if (allProducts.length > 0) {
            let recommended = [...allProducts];
            if (orders.length > 0) {
                const purchasedWords = new Set<string>();
                orders.forEach(o => {
                    o.items?.forEach(i => {
                        i.title?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).forEach((w: string) => purchasedWords.add(w));
                    });
                });

                if (purchasedWords.size > 0) {
                    recommended.forEach(p => {
                        let score = 0;
                        const title = p.node?.title?.toLowerCase() || "";
                        purchasedWords.forEach(w => {
                            if (title.includes(w)) score += 1;
                        });
                        p._score = score + Math.random() * 0.5;
                    });
                    recommended.sort((a, b) => (b._score || 0) - (a._score || 0));
                }
            } else {
                recommended.sort(() => 0.5 - Math.random());
            }
            setCuratedProducts(recommended.slice(0, 5));
        }
    }, [orders, allProducts]);

    if (!user) return null;

    const initials = user.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.charAt(0).toUpperCase() || 'U';

    const recentOrder = orders.length > 0 ? orders[0] : null;

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree selection:bg-[#006D77]/20 flex flex-col">
            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24 max-w-7xl flex-1">
                <div className="mb-14 border-b border-black/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-prata tracking-tight mb-3 text-slate-900">
                            My Account
                        </h1>
                        <p className="font-lora text-slate-500 text-lg italic tracking-wide">
                            Welcome back, {user.displayName?.split(' ')[0] || 'User'}
                        </p>
                    </div>
                </div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(180px,auto)] gap-8">
                    
                    {/* User Profile Cell */}
                    <div className="col-span-1 md:col-span-5 lg:col-span-4">
                        <div className="h-full bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-8 flex flex-col">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-24 h-24 bg-[#006D77] text-[#FDFBF7] flex items-center justify-center text-3xl font-prata rounded-full mb-6 mx-auto">
                                    {initials}
                                </div>
                                <h2 className="text-2xl font-prata text-slate-900 text-center">{user.displayName || 'User'}</h2>
                                <p className="text-sm text-slate-500 font-lora italic text-center mt-1">{user.email}</p>
                            </div>

                            <div className="mt-auto space-y-1">
                                <button 
                                    onClick={() => router.push('/account/settings')}
                                    className="w-full flex items-center justify-between py-3 px-2 hover:bg-[#FDFBF7] transition-colors group text-sm"
                                >
                                    <span className="font-semibold tracking-wide text-slate-700 group-hover:text-[#006D77] transition-colors">Account Settings</span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[#006D77] transition-colors" />
                                </button>
                                <div className="h-px bg-slate-100 w-full my-1"></div>
                                <button 
                                    onClick={() => logout()}
                                    className="w-full flex items-center justify-between py-3 px-2 hover:bg-rose-50 transition-colors group text-sm"
                                    aria-label="Sign Out"
                                >
                                    <span className="font-semibold tracking-wide text-slate-700 group-hover:text-rose-600 transition-colors">Sign Out</span>
                                    <LogOut size={16} className="text-slate-300 group-hover:text-rose-600 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty Command Center */}
                    <div className="col-span-1 md:col-span-7 lg:col-span-8">
                        <LoyaltyCommandCenter />
                    </div>

                    {/* Active Order / Logistics block */}
                    {recentOrder ? (
                        <div className="col-span-1 md:col-span-12">
                            <OrderTrackingBlock order={recentOrder} />
                        </div>
                    ) : (
                        <div className="col-span-1 md:col-span-12">
                            <div className="bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-12 text-center">
                                <p className="font-lora italic text-slate-500 text-lg">No Active Orders</p>
                                <p className="text-sm text-slate-400 mt-2 font-figtree">Your recent orders will appear here for easy tracking.</p>
                            </div>
                        </div>
                    )}

                    {/* Saved Payment / Addresses */}
                    <div className="col-span-1 md:col-span-6 lg:col-span-4">
                        <div className="h-full bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-8 flex flex-col">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <h3 className="text-xl font-prata text-slate-900">
                                    Payment
                                </h3>
                                <button onClick={() => router.push('/account/payment')} className="text-[10px] font-bold uppercase tracking-widest text-[#006D77] hover:text-[#004e55] transition-colors">Manage</button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-[#FDFBF7] border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 px-2 py-1 bg-white">Visa</span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 tracking-wide">•••• 4242</p>
                                        <p className="text-xs text-slate-500 font-lora italic mt-0.5">Expires 12/28</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Curated For You AI Block */}
                    <div className="col-span-1 md:col-span-6 lg:col-span-8 overflow-hidden">
                        <div className="h-full bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-8 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-prata text-slate-900">Curated For You</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Algorithmically Selected</p>
                                </div>
                                <button onClick={() => router.push('/collections/all')} className="text-[10px] font-bold uppercase tracking-widest text-[#006D77] hover:text-[#004e55] shrink-0 transition-colors">View All</button>
                            </div>
                            
                            {/* Horizontal Product Carousel */}
                            <div className="flex gap-6 overflow-x-auto pb-4 snap-x relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                                {curatedProducts.length > 0 ? curatedProducts.map((product, i) => (
                                    <div key={product.node?.id || product.id || i} className="w-[180px] snap-start flex-shrink-0 group">
                                        <ProductCard product={product} imageAspectRatio="aspect-[3/4]" />
                                    </div>
                                )) : [1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-[180px] snap-start flex-shrink-0 animate-pulse">
                                        <div className="w-full aspect-[3/4] bg-[#FDFBF7] mb-4" />
                                        <div className="h-4 bg-[#FDFBF7] w-3/4 mb-2 mx-auto" />
                                        <div className="h-3 bg-slate-50 w-1/4 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </main>
    );
}
