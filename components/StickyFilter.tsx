"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterSectionProps {
    title: string;
    options: string[];
}

function FilterSection({ title, options }: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b border-gray-200 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left mb-4 group"
            >
                <span className="text-sm font-bold uppercase tracking-widest text-slate-900 group-hover:text-[#006D77] transition-colors">
                    {title}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-3 pb-2">
                            {options.map((option) => (
                                <label key={option} className="flex items-center gap-3 cursor-pointer group/item">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="peer h-4 w-4 appearance-none border border-gray-300 rounded-sm checked:bg-[#006D77] checked:border-[#006D77] transition-colors" />
                                        <svg
                                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors">
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function StickyFilter() {
    return (
        <aside className="w-full sticky top-24 h-fit pr-8 hidden lg:block">
            <h3 className="text-xl font-lora text-slate-900 mb-6">Filters</h3>
            <FilterSection
                title="Category"
                options={["Dresses", "Tops", "Bottoms", "Outerwear", "Accessories"]}
            />
            <FilterSection
                title="Size"
                options={["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "XXL"]}
            />
            <FilterSection
                title="Color"
                options={["Black", "White", "Beige", "Blue", "Green", "Red"]}
            />
            <FilterSection
                title="Price"
                options={["Under $50", "$50 - $100", "$100 - $200", "Over $200"]}
            />
        </aside>
    );
}
