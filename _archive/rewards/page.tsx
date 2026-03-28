"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface RewardEntry {
    id: string;
    type: 'earned' | 'redeemed';
    amount: number;
    reason: string;
    date: string;
}

interface LoyaltyData {
    points: number;
    tier: string;
    nextTier: string;
    nextTierThreshold: number;
}

export default function RewardsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loyalty, setLoyalty] = useState<LoyaltyData>({ points: 0, tier: 'Bronze', nextTier: 'Silver', nextTierThreshold: 2000 });
    const [history, setHistory] = useState<RewardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchRewards = async () => {
            try {
                // Fetch loyalty summary
                const loyaltyRef = doc(db, "users", user.uid, "loyalty", "summary");
                const loyaltySnap = await getDoc(loyaltyRef);
                if (loyaltySnap.exists()) {
                    const d = loyaltySnap.data();
                    setLoyalty({
                        points: d.points || 0,
                        tier: d.tier || 'Bronze',
                        nextTier: d.nextTier || 'Silver',
                        nextTierThreshold: d.nextTierThreshold || 2000,
                    });
                }

                // Fetch transaction history
                const histRef = collection(db, "users", user.uid, "loyalty", "summary", "transactions");
                const q = query(histRef, orderBy("createdAt", "desc"), limit(20));
                const histSnap = await getDocs(q);
                const entries: RewardEntry[] = histSnap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        type: data.type,
                        amount: data.amount,
                        reason: data.reason,
                        date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
                    };
                });
                setHistory(entries);
            } catch (err) {
                console.error("[Rewards] Fetch failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRewards();
    }, [user]);

    const progressPercent = loyalty.nextTierThreshold > 0 ? Math.min(100, (loyalty.points / loyalty.nextTierThreshold) * 100) : 0;
    const pointsToNext = Math.max(0, loyalty.nextTierThreshold - loyalty.points);

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree flex flex-col selection:bg-[#006D77]/20">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24 max-w-3xl flex-1">
                <button 
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#006D77] hover:text-[#004e55] transition-colors mb-12"
                >
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>
                
                <div className="mb-12 border-b border-black/5 pb-8">
                    <h1 className="text-4xl md:text-5xl font-prata tracking-tight mb-3 text-slate-900">
                        Kevara Insider
                    </h1>
                    <p className="font-lora italic text-slate-500 text-lg">
                        Your private ledger of loyalty points and elite benefits.
                    </p>
                </div>

                <div className="mb-12">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                        <div className="bg-[#006D77] text-[#FDFBF7] border-none flex flex-col relative overflow-hidden shadow-[0_2px_15px_-3px_rgba(6,81,237,0.1)] rounded-sm">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 border-[40px] border-white/[0.02] rounded-full pointer-events-none" />
                            
                            <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 border-b border-white/10">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-bold text-[#FDFBF7]/60 uppercase tracking-widest mb-2">Available Balance</p>
                                    {isLoading ? (
                                        <div className="h-12 w-40 bg-white/10 animate-pulse mx-auto md:mx-0 mt-2" />
                                    ) : (
                                        <h2 className="text-6xl md:text-7xl font-prata tracking-tighter text-[#FDFBF7]">
                                            {loyalty.points.toLocaleString()}
                                        </h2>
                                    )}
                                </div>
                                <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                                    <div className="text-[10px] font-bold text-[#FDFBF7]/60 uppercase tracking-widest mb-2">Current Tier</div>
                                    <div className="font-prata text-2xl text-[#FDFBF7] mb-6">{loyalty.tier}</div>
                                    <button 
                                        onClick={() => alert("Exclusive redemption concierge opening soon.")} 
                                        className="w-full md:w-auto px-8 py-3 bg-[#FDFBF7] text-[#006D77] text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
                                    >
                                        Redeem Rewards
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 md:p-12 relative z-10 space-y-4">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#FDFBF7]/60">
                                    <span>{loyalty.tier} Tier</span>
                                    <span>{loyalty.nextTier} ({(loyalty.nextTierThreshold / 1000).toFixed(0)}k)</span>
                                </div>
                                <div className="h-[1px] w-full bg-black/20 overflow-hidden relative">
                                    <div className="absolute top-0 bottom-0 left-0 bg-[#FDFBF7] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className="text-[11px] font-lora italic text-[#FDFBF7]/60 text-center md:text-right">
                                    {pointsToNext > 0 ? `Accomplish ${pointsToNext.toLocaleString()} more points to unlock ${loyalty.nextTier} status.` : `You've achieved the highest echelon.`}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 md:p-12 rounded-sm">
                        <h3 className="text-2xl font-prata text-slate-900 border-b border-black/5 pb-4 mb-8">Transaction Ledger</h3>
                        <div className="space-y-0">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="py-6 border-b border-black/5 animate-pulse flex items-center gap-6">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-200 w-48" />
                                            <div className="h-3 bg-slate-100 w-24" />
                                        </div>
                                    </div>
                                ))
                            ) : history.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="font-prata text-xl text-slate-900 mb-2">No Ledger Entries</p>
                                    <p className="font-lora italic text-slate-500 text-sm">Your points acquisition history will be meticulously recorded here.</p>
                                </div>
                            ) : (
                                history.map((item, i) => (
                                    <div key={item.id} className={`py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${i !== history.length - 1 ? 'border-b border-black/5' : ''}`}>
                                        <div className="flex-1">
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-[#006D77] mb-1">{item.reason}</p>
                                            <p className="text-xs font-lora italic text-slate-400">{item.date}</p>
                                        </div>
                                        <div className={`text-sm font-bold tracking-widest ${item.type === 'earned' ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {item.type === 'earned' ? '+' : '-'}{item.amount.toLocaleString()} pts
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </main>
    );
}
