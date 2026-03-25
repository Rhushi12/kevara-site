"use client";
import React, { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ToastType = { message: string; type: 'success' | 'error' } | null;

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastType>(null);

    const nameRef = useRef<HTMLInputElement>(null);
    const currentPassRef = useRef<HTMLInputElement>(null);
    const newPassRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            const newName = nameRef.current?.value?.trim();
            const currentPass = currentPassRef.current?.value;
            const newPass = newPassRef.current?.value;

            if (newName && newName !== user.displayName) {
                await updateProfile(user, { displayName: newName });
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { displayName: newName, updatedAt: serverTimestamp() });
            }

            if (newPass && newPass.length > 0) {
                if (newPass.length < 6) {
                    showToast("Password must be at least 6 characters.", "error");
                    setIsSaving(false);
                    return;
                }
                if (!currentPass) {
                    showToast("Please enter your current password to set a new one.", "error");
                    setIsSaving(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user.email!, currentPass);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPass);
                if (currentPassRef.current) currentPassRef.current.value = "";
                if (newPassRef.current) newPassRef.current.value = "";
            }

            showToast("Settings updated successfully.", "success");
        } catch (error: any) {
            console.error("[Settings] Update failed:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showToast("Current password is incorrect.", "error");
            } else if (error.code === 'auth/requires-recent-login') {
                showToast("Session expired. Please log out and log back in to change your password.", "error");
            } else {
                showToast(error.message || "Failed to update settings.", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree selection:bg-[#006D77]/20 flex flex-col">
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
                        Account Settings
                    </h1>
                    <p className="font-lora italic text-slate-500 text-lg">
                        Manage your personal information and security preferences.
                    </p>
                </div>

                {/* Toast Notification */}
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
                    <form onSubmit={handleSave} className="space-y-12">
                        
                        <div className="space-y-8 bg-white p-8 md:p-12 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-sm">
                            <h2 className="text-2xl font-prata border-b border-black/5 pb-4">Personal Details</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                                    <input ref={nameRef} type="text" defaultValue={user?.displayName || ''} className="w-full bg-transparent border-b border-slate-200 py-3 text-sm focus:outline-none focus:border-[#006D77] transition-colors" placeholder="Enter your full name" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                    <input type="email" defaultValue={user?.email || ''} readOnly className="w-full bg-slate-50 border-b border-slate-200 px-3 py-3 text-sm text-slate-400 cursor-not-allowed" />
                                    <p className="text-[11px] font-lora italic text-slate-400 mt-2">Email address cannot be changed directly. Contact support if needed.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 bg-white p-8 md:p-12 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-sm">
                            <h2 className="text-2xl font-prata border-b border-black/5 pb-4">Security</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Password</label>
                                    <input ref={currentPassRef} type="password" placeholder="Required to change password" className="w-full bg-transparent border-b border-slate-200 py-3 text-sm focus:outline-none focus:border-[#006D77] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">New Password</label>
                                    <input ref={newPassRef} type="password" placeholder="Min 6 characters" className="w-full bg-transparent border-b border-slate-200 py-3 text-sm focus:outline-none focus:border-[#006D77] transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isSaving} className="px-10 py-4 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors disabled:opacity-70 disabled:cursor-wait">
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
            <Footer />
        </main>
    );
}
