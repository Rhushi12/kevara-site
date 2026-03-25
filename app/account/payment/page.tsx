"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

interface PaymentCard {
    id: string;
    type: string;
    last4: string;
    exp: string;
    isDefault: boolean;
}

type ToastType = { message: string; type: 'success' | 'error' } | null;

export default function PaymentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [cards, setCards] = useState<PaymentCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<ToastType>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!user) return;
        const fetchCards = async () => {
            try {
                const ref = collection(db, "users", user.uid, "paymentMethods");
                const snap = await getDocs(ref);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PaymentCard[];
                setCards(data);
            } catch (err) {
                console.error("[Payment] Failed to fetch:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCards();
    }, [user]);

    const handleRemove = async (cardId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "paymentMethods", cardId));
            setCards(prev => prev.filter(c => c.id !== cardId));
            showToast("Payment method removed.", "success");
        } catch (err) {
            console.error("[Payment] Delete failed:", err);
            showToast("Failed to remove card.", "error");
        }
    };

    const handleAddCard = async () => {
        if (!user) return;
        try {
            const newCard = {
                type: 'Visa',
                last4: String(Math.floor(1000 + Math.random() * 9000)),
                exp: `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${String(Math.floor(25 + Math.random() * 5))}`,
                isDefault: cards.length === 0,
                createdAt: serverTimestamp(),
            };
            const ref = collection(db, "users", user.uid, "paymentMethods");
            const docRef = await addDoc(ref, newCard);
            setCards(prev => [...prev, { id: docRef.id, ...newCard } as PaymentCard]);
            showToast("Payment method added successfully!", "success");
        } catch (err) {
            console.error("[Payment] Add failed:", err);
            showToast("Failed to add payment method.", "error");
        }
    };

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
                        Payment Methods
                    </h1>
                    <p className="font-lora italic text-slate-500 text-lg">
                        Manage your vault of securely saved cards.
                    </p>
                </div>

                <AnimatePresence>
                    {toast && (
                        <motion.div 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className={`mb-10 flex items-center gap-3 p-4 border text-[11px] font-bold uppercase tracking-widest ${toast.type === 'success' ? 'bg-[#FDFBF7] text-[#006D77] border-[#006D77]/20' : 'bg-[#FDFBF7] text-rose-700 border-rose-200'}`}
                        >
                            {toast.message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <div className="bg-white p-8 md:p-12 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-sm">
                        <div className="space-y-4 mb-10">
                            {isLoading ? (
                                [1, 2].map(i => (
                                    <div key={i} className="p-6 border border-slate-100 bg-[#FDFBF7] animate-pulse flex items-center gap-6">
                                        <div className="w-16 h-10 bg-slate-200" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-200 w-32" />
                                            <div className="h-3 bg-slate-100 w-20" />
                                        </div>
                                    </div>
                                ))
                            ) : cards.length === 0 ? (
                                <div className="p-12 text-center bg-[#FDFBF7] border border-slate-100">
                                    <p className="font-prata text-xl text-slate-900 mb-2">Wallet is Empty</p>
                                    <p className="font-lora italic text-slate-500 text-sm">Add a preferred payment method to streamline your next acquisition.</p>
                                </div>
                            ) : (
                                cards.map(card => (
                                    <motion.div key={card.id} layout className="p-6 border border-slate-100 bg-[#FDFBF7] flex items-center justify-between gap-6 group hover:border-[#006D77]/30 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-10 bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                <span className="text-[10px] font-black italic text-[#006D77] uppercase tracking-widest">{card.type}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 tracking-wide flex items-center gap-3">
                                                    •••• {card.last4}
                                                    {card.isDefault && <span className="px-2 py-0.5 bg-slate-900 text-[#FDFBF7] text-[9px] uppercase font-bold tracking-widest">Default</span>}
                                                </p>
                                                <p className="text-xs text-slate-500 font-lora italic mt-1">Expires {card.exp}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemove(card.id)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all rounded-sm"
                                            aria-label="Remove card"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={handleAddCard}
                            className="w-full flex items-center justify-center gap-3 py-5 border border-slate-200 hover:border-[#006D77] hover:text-[#006D77] bg-white text-xs font-bold uppercase tracking-widest transition-all text-slate-500"
                        >
                            <Plus size={14} /> Add New Method
                        </button>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </main>
    );
}
