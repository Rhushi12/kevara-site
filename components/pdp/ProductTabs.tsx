"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";

const tabs = [
    { id: "description", label: "Description" },
    { id: "sustainability", label: "Sustainability" },
    { id: "shipping", label: "Shipping & Returns" },
];

export default function ProductTabs() {
    const [activeTab, setActiveTab] = useState("description");

    return (
        <div className="mt-12 md:mt-0">
            {/* Tab Headers */}
            <div className="flex gap-8 border-b border-gray-100 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 text-sm uppercase tracking-widest transition-colors relative whitespace-nowrap ${activeTab === tab.id
                                ? "text-[#006D77]"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                    {activeTab === "description" && (
                        <motion.div
                            key="description"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 text-slate-600 font-light leading-relaxed"
                        >
                            <p>
                                With a jumpsuit like this beauty, your entire outfit is covered just by adding accessories according to the occasion. The Evry 7027 Jumpsuit features a relaxed fit with a defined waist, offering both comfort and a flattering silhouette.
                            </p>
                            <p>
                                Crafted from our signature eco-friendly blend, it breathes well and moves with you. Perfect for those busy days that turn into evenings out.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-4">
                                <li>Relaxed fit with adjustable waist tie</li>
                                <li>Button-down front closure</li>
                                <li>Two functional chest pockets</li>
                                <li>Machine washable</li>
                            </ul>
                        </motion.div>
                    )}

                    {activeTab === "sustainability" && (
                        <motion.div
                            key="sustainability"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 text-slate-600 font-light leading-relaxed"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <ShieldCheck className="text-[#006D77] shrink-0" size={24} />
                                <div>
                                    <h4 className="font-medium text-slate-900 mb-1">Ethically Sourced</h4>
                                    <p className="text-sm">We partner with factories that pay fair wages and ensure safe working conditions.</p>
                                </div>
                            </div>
                            <p>
                                This garment is made from 100% organic cotton, grown without the use of harmful chemicals or pesticides. By choosing organic, you're supporting healthier soil and water conservation.
                            </p>
                        </motion.div>
                    )}

                    {activeTab === "shipping" && (
                        <motion.div
                            key="shipping"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 text-slate-600 font-light leading-relaxed"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <Truck className="text-[#006D77] shrink-0" size={20} />
                                    <div>
                                        <h4 className="font-medium text-slate-900 mb-1">Free Shipping</h4>
                                        <p className="text-sm">On all orders over $150. Standard shipping takes 3-5 business days.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="text-[#006D77] shrink-0" size={20} />
                                    <div>
                                        <h4 className="font-medium text-slate-900 mb-1">Easy Returns</h4>
                                        <p className="text-sm">30-day return policy. Items must be unworn and in original packaging.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
