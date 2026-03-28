"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function LoyaltyCommandCenter() {
    const router = useRouter();
    const { user } = useAuth();
    const [isReferralMode, setIsReferralMode] = useState(false);
    const [copied, setCopied] = useState(false);

    // Live data from Firestore
    const [points, setPoints] = useState(0);
    const [tier, setTier] = useState("Bronze");
    const [nextTier, setNextTier] = useState("Silver");
    const [nextTierThreshold, setNextTierThreshold] = useState(2000);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic referral code based on user UID
    const referralCode = user?.uid ? user.uid.slice(0, 8).toUpperCase() : "KEVARA";
    const referralLink = `kevara.com/invite/${referralCode}`;

    useEffect(() => {
        if (!user) return;
        const fetchLoyalty = async () => {
            try {
                const loyaltyRef = doc(db, "users", user.uid, "loyalty", "summary");
                const snap = await getDoc(loyaltyRef);
                if (snap.exists()) {
                    const d = snap.data();
                    setPoints(d.points || 0);
                    setTier(d.tier || "Bronze");
                    setNextTier(d.nextTier || "Silver");
                    setNextTierThreshold(d.nextTierThreshold || 2000);
                }
            } catch (err) {
                console.error("[Loyalty] Failed to fetch:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLoyalty();
    }, [user]);

    const progressPercent = nextTierThreshold > 0 ? Math.min(100, (points / nextTierThreshold) * 100) : 0;
    const pointsToNext = Math.max(0, nextTierThreshold - points);

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://${referralLink}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full bg-[#006D77] text-[#FDFBF7] relative overflow-hidden flex flex-col shadow-[0_2px_10px_-3px_rgba(6,81,237,0.15)]">
            {/* Subtle background monogram/texture simulation */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 border-[40px] border-white/[0.02] rounded-full pointer-events-none" />
            
            <AnimatePresence mode="wait">
                {!isReferralMode ? (
                    <motion.div 
                        key="main"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 md:p-10 flex flex-col justify-between h-full relative z-10"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FDFBF7]/60 mb-1">Loyalty Tier</span>
                                <span className="font-prata text-xl text-[#FDFBF7]">{isLoading ? "..." : `${tier}`}</span>
                            </div>
                            <button 
                                onClick={() => router.push('/account/rewards')}
                                className="text-[10px] font-bold uppercase tracking-widest border border-[#FDFBF7]/30 px-4 py-2 hover:bg-[#FDFBF7] hover:text-[#006D77] transition-all flex items-center gap-2"
                            >
                                Rewards <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="space-y-1 mb-10">
                            <p className="text-sm font-lora italic text-[#FDFBF7]/70">Available Balance</p>
                            {isLoading ? (
                                <div className="h-12 w-32 bg-white/10 animate-pulse mt-2" />
                            ) : (
                                <h2 className="text-6xl md:text-7xl font-prata tracking-tight text-[#FDFBF7]">
                                    {points.toLocaleString()}
                                </h2>
                            )}
                        </div>

                        <div className="mt-auto space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]/60">
                                    <span>{tier}</span>
                                    <span>{nextTier} ({(nextTierThreshold / 1000).toFixed(0)}k)</span>
                                </div>
                                <div className="h-[2px] w-full bg-black/20 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-[#FDFBF7]"
                                    />
                                </div>
                                <p className="text-[11px] font-lora italic text-[#FDFBF7]/60 text-right">
                                    {pointsToNext > 0 ? `Earn ${pointsToNext.toLocaleString()} more to unlock ${nextTier}` : `You've reached ${tier}!`}
                                </p>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <button 
                                    onClick={() => setIsReferralMode(true)}
                                    className="w-full flex items-center justify-between group transition-all"
                                >
                                    <div className="text-left">
                                        <p className="font-prata text-lg text-[#FDFBF7] group-hover:text-white transition-colors">Referral Quest</p>
                                        <p className="text-xs font-lora italic text-[#FDFBF7]/60 mt-1">Invite friends, earn 500 points</p>
                                    </div>
                                    <span className="w-8 h-8 flex items-center justify-center border border-[#FDFBF7]/20 rounded-full group-hover:bg-[#FDFBF7] group-hover:text-[#006D77] transition-colors">
                                        <ChevronRight size={14} />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="referral"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-8 md:p-10 flex flex-col h-full relative z-10"
                    >
                        <button 
                            onClick={() => setIsReferralMode(false)}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FDFBF7]/60 hover:text-[#FDFBF7] transition-colors mb-8"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h3 className="text-3xl font-prata mb-3 text-[#FDFBF7]">Refer a Friend</h3>
                        <p className="font-lora italic text-[#FDFBF7]/70 text-base mb-10 leading-relaxed">
                            Share your unique link. They receive an exclusive 10% reduction on their inaugural acquisition, and you collect 500 loyalty points upon completion.
                        </p>
                        
                        <div className="mt-auto">
                            <label className="block text-[10px] font-bold text-[#FDFBF7]/60 uppercase tracking-widest mb-3">Your Unique Link</label>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="w-full sm:flex-1 py-3 px-4 border border-[#FDFBF7]/20 bg-black/10 text-sm font-mono text-[#FDFBF7]/90 truncate text-center sm:text-left selection:bg-white/20">
                                    {referralLink}
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className={`w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${copied ? 'bg-[#FDFBF7] text-[#006D77]' : 'border border-[#FDFBF7]/30 text-[#FDFBF7] hover:bg-[#FDFBF7] hover:text-[#006D77]'}`}
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
