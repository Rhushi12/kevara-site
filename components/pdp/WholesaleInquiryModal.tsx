"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Loader2 } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useToast } from "@/context/ToastContext";
import { INDIA_STATES, getCitiesForState } from "@/lib/indiaData";

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
        requirementType: "", // Retail Shop, Wholesale (B2B), Online Portal
        requirement: "", // Quantity/Type
        state: "",
        city: "",
        address: "",
        description: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();

    // Get cities based on selected state
    const availableCities = formData.state ? getCitiesForState(formData.state) : [];

    // Reset city when state changes
    const handleStateChange = (newState: string) => {
        setFormData({ ...formData, state: newState, city: "" });
    };

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
                setFormData({ name: "", email: "", phone: "", requirementType: "", requirement: "", state: "", city: "", address: "", description: "" });
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

                            {/* Type of Requirement */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Type of Requirement
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {[
                                        { value: "retail", label: "Retail Shop", icon: "🏪" },
                                        { value: "wholesale", label: "Wholesale (B2B)", icon: "🏭" },
                                        { value: "online", label: "Online Portal", icon: "🌐" }
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center gap-2 p-3 sm:p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${formData.requirementType === option.value
                                                    ? 'border-[#0E4D55] bg-[#0E4D55]/5 ring-1 ring-[#0E4D55]/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="requirementType"
                                                value={option.value}
                                                checked={formData.requirementType === option.value}
                                                onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
                                                className="sr-only"
                                            />
                                            <span className="text-base sm:text-lg">{option.icon}</span>
                                            <span className={`text-sm font-medium ${formData.requirementType === option.value
                                                    ? 'text-[#0E4D55]'
                                                    : 'text-slate-600'
                                                }`}>
                                                {option.label}
                                            </span>
                                            {formData.requirementType === option.value && (
                                                <svg className="w-4 h-4 ml-auto text-[#0E4D55]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Quantity / Details</label>
                                <input
                                    type="text"
                                    value={formData.requirement}
                                    onChange={e => setFormData({ ...formData, requirement: e.target.value })}
                                    className="w-full px-3 py-2.5 sm:py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-2 focus:ring-[#0E4D55]/20 text-sm sm:text-base"
                                    placeholder="e.g. 50 units, Custom Size..."
                                />
                            </div>

                            {/* State and City Dropdowns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        State
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.state}
                                            onChange={e => handleStateChange(e.target.value)}
                                            className="w-full px-3 py-2.5 sm:py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-2 focus:ring-[#0E4D55]/20 appearance-none cursor-pointer text-sm sm:text-base transition-all duration-200 hover:border-slate-300 pr-10"
                                        >
                                            <option value="">Select State</option>
                                            {INDIA_STATES.map((state) => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        City
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            disabled={!formData.state}
                                            className={`w-full px-3 py-2.5 sm:py-2 bg-white border rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-2 focus:ring-[#0E4D55]/20 appearance-none text-sm sm:text-base transition-all duration-200 pr-10 ${!formData.state
                                                ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                                                : 'cursor-pointer border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <option value="">{formData.state ? "Select City" : "Select state first"}</option>
                                            {availableCities.map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className={`w-4 h-4 ${!formData.state ? 'text-slate-300' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {formData.state && availableCities.length > 0 && (
                                        <p className="text-[10px] text-slate-400">{availableCities.length} cities available</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]"
                                    placeholder="Street Address, Pincode"
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
