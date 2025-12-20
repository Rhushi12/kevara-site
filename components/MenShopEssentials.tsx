"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";

interface MenShopEssentialsProps {
    data?: any[]; // Array of tabs
    isEditMode?: boolean;
    onUpdate?: (data: any[]) => void;
}

export default function MenShopEssentials({ data = [], isEditMode = false, onUpdate }: MenShopEssentialsProps) {
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Default tabs if data is empty
    const tabs = data.length > 0 ? data : [
        { title: "Shirts", products: [] },
        { title: "Trousers", products: [] },
        { title: "Jackets", products: [] }
    ];

    const activeTab = tabs[activeTabIndex];

    const updateTabTitle = (index: number, newTitle: string) => {
        if (!onUpdate) return;
        const newTabs = [...tabs];
        newTabs[index] = { ...newTabs[index], title: newTitle };
        onUpdate(newTabs);
    };

    return (
        <section className="container mx-auto px-4 pt-12 pb-12 md:py-24 group/section overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12"
            >
                <h2 className="text-[32px] md:text-5xl font-lora text-slate-900 mb-4">
                    Refined for the Gentleman
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-8">
                    Discover our latest collection of premium menswear. Tailored for comfort and style, designed for the modern man.
                </p>

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    {tabs.map((tab: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setActiveTabIndex(index)}
                            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTabIndex === index ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {isEditMode ? (
                                <EditableText
                                    value={tab.title}
                                    onSave={(val) => updateTabTitle(index, val)}
                                    isAdmin={true}
                                    className="bg-transparent border-b border-gray-300"
                                />
                            ) : (
                                tab.title
                            )}
                            {activeTabIndex === index && (
                                <motion.div
                                    layoutId="activeTabUnderlineMen"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Products Grid */}
            <div
                className="overflow-x-auto md:overflow-hidden pb-8 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide touch-pan-x"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTabIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 w-max md:w-full"
                    >
                        {activeTab.products && activeTab.products.length > 0 ? (
                            activeTab.products.map((product: any, index: number) => (
                                <motion.div
                                    key={product.id || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="w-[85vw] md:w-auto snap-center shrink-0"
                                >
                                    <ProductCard product={{ node: product }} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-4 text-center py-12 text-gray-400">
                                No products found in this collection.
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex justify-center mt-12">
                <LiquidButton href="/collections/men">
                    View All
                </LiquidButton>
            </div>
        </section>
    );
}
