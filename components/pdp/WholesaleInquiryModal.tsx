"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Loader2 } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useToast } from "@/context/ToastContext";

interface WholesaleInquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    productHandle: string;
}

export default function WholesaleInquiryModal({
    isOpen,
    onClose,
    productTitle,
    productHandle
}: WholesaleInquiryModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        requirement: "", // Quantity/Type
        address: "",
        description: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();

    // Ensure we only use portal on client side
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/wholesale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    product_title: productTitle,
                    product_handle: productHandle,
                    date: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Failed to submit inquiry");

            setSuccess(true);
            showToast("Inquiry submitted successfully!", "success");
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ name: "", email: "", phone: "", requirement: "", address: "", description: "" });
            }, 2000);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            showToast("Failed to submit inquiry. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* Backdrop with fade animation */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
                onClick={onClose}
            />

            {/* Modal with slide-up and zoom animation */}
            <div
                className="relative bg-[#FDFBF7] w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 my-auto border border-[#E6E1D6]"
                style={{ animation: 'modalEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes modalEnter {
                        from { 
                            opacity: 0; 
                            transform: translateY(30px) scale(0.95); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                        }
                    }
                    @keyframes successPop {
                        0% { transform: scale(0); opacity: 0; }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-black/5 rounded-full transition-all duration-200 hover:rotate-90"
                >
                    <X size={22} className="text-slate-400 hover:text-slate-600" />
                </button>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center space-y-4">
                        <div
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0E4D55] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#0E4D55]/30"
                            style={{ animation: 'successPop 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        >
                            <Send size={32} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-lora font-bold text-[#0E4D55]">Inquiry Sent!</h3>
                        <p className="text-slate-600 text-sm sm:text-base">We'll get back to you shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-lora font-bold text-slate-900">Wholesale Inquiry</h2>
                            <p className="text-slate-500 text-sm mt-1">Tell us your requirements for <span className="font-semibold text-[#0E4D55]">{productTitle}</span></p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                        placeholder="+91 98765..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Requirements</label>
                                <input
                                    type="text"
                                    value={formData.requirement}
                                    onChange={e => setFormData({ ...formData, requirement: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                    placeholder="e.g. 50 units, Custom Size..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                    placeholder="Delivery Location"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Additional Details</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                    placeholder="Any specific instructions..."
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="pt-3 sm:pt-4">
                                <LiquidButton
                                    type="submit"
                                    className="w-full bg-[#0E4D55] text-white py-3 sm:py-3.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        "Send Inquiry"
                                    )}
                                </LiquidButton>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
