import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    onFilterChange: (filters: FilterState) => void;
    collapsedByDefault?: boolean;
    isMobile?: boolean; // Added isMobile prop
}

export interface FilterState {
    categories: string[];
    priceRange: { min: string; max: string };
    sizes: string[];
    colors: string[];
}

export default function FilterSidebar({
    isOpen = true,
    onClose,
    onFilterChange,
    collapsedByDefault = true,
    isMobile = false
}: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState({
        categories: !collapsedByDefault,
        price: !collapsedByDefault,
        sizes: !collapsedByDefault,
        colors: !collapsedByDefault
    });

    const [filters, setFilters] = useState<FilterState>({
        categories: [],
        priceRange: { min: "", max: "" },
        sizes: [],
        colors: []
    });

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleCategory = (cat: string) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const toggleSize = (size: string) => {
        setFilters(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const toggleColor = (color: string) => {
        setFilters(prev => ({
            ...prev,
            colors: prev.colors.includes(color)
                ? prev.colors.filter(c => c !== color)
                : [...prev.colors, color]
        }));
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        setFilters(prev => ({
            ...prev,
            priceRange: { ...prev.priceRange, [type]: value }
        }));
    };

    const clearFilters = () => {
        setFilters({
            categories: [],
            priceRange: { min: "", max: "" },
            sizes: [],
            colors: []
        });
    };

    const categories = ["Shirts", "Pants", "Shorts", "Jackets", "Accessories"];
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const colors = [
        { name: "Black", hex: "#000000" },
        { name: "White", hex: "#FFFFFF" },
        { name: "Blue", hex: "#1E3A8A" },
        { name: "Red", hex: "#B91C1C" },
        { name: "Green", hex: "#065F46" },
        { name: "Beige", hex: "#D4D4D8" }
    ];

    const accordionVariants = {
        hidden: { opacity: 0, height: 0, overflow: "hidden" },
        visible: { opacity: 1, height: "auto", overflow: "hidden" }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-24 left-0 h-[calc(100vh-6rem)] md:h-auto
                ${isMobile ? 'w-full' : 'w-[280px]'} md:w-full
                bg-[#FDFBF7] md:bg-transparent border-r md:border-none
                overflow-y-auto scrollbar-hide
                transition-transform duration-300
                z-50 md:z-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile Close Button (Only show if NOT embedded in drawer - drawer has its own close) */}
                {!isMobile && (
                    <div className="md:hidden flex justify-between items-center p-6 border-b">
                        <h3 className="font-lora text-xl">Filters</h3>
                        <button onClick={onClose} className="p-2">
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="p-6 md:p-0 space-y-8">
                    {/* Filter Heading - Desktop */}
                    <div
                        className="hidden md:block border-b border-gray-200 pb-6"
                        style={{
                            width: "265px"
                        }}
                    >
                        <h2
                            className="font-lora"
                            style={{
                                color: "#1a1a1a",
                                fontSize: "24px",
                                letterSpacing: "-0.4px",
                                lineHeight: "28px"
                            }}
                        >
                            Filter
                        </h2>
                    </div>

                    {/* Categories */}
                    <div className="border-b border-gray-200 pb-6">
                        <button
                            onClick={() => toggleSection("categories")}
                            className="flex justify-between items-center w-full group"
                        >
                            <h3 className="text-[13px] font-bold uppercase tracking-[1px] font-sans">Categories</h3>
                            <motion.div
                                animate={{ rotate: expandedSections.categories ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {expandedSections.categories && (
                                <motion.div
                                    variants={accordionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <ul className="space-y-3 mt-4">
                                        {categories.map((cat) => (
                                            <li key={cat}>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-4 h-4 border border-gray-300 rounded-sm flex items-center justify-center transition-colors ${filters.categories.includes(cat) ? 'bg-[#006D77] border-[#006D77]' : 'bg-white group-hover:border-[#006D77]'}`}>
                                                        {filters.categories.includes(cat) && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={filters.categories.includes(cat)}
                                                        onChange={() => toggleCategory(cat)}
                                                    />
                                                    <span className={`text-[13px] font-sans transition-colors ${filters.categories.includes(cat) ? 'text-[#006D77] font-semibold' : 'text-gray-600 group-hover:text-[#006D77]'}`}>
                                                        {cat}
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Price Range */}
                    <div className="border-b border-gray-200 pb-6">
                        <button
                            onClick={() => toggleSection("price")}
                            className="flex justify-between items-center w-full group"
                        >
                            <h3 className="text-[13px] font-bold uppercase tracking-[1px] font-sans">Price</h3>
                            <motion.div
                                animate={{ rotate: expandedSections.price ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {expandedSections.price && (
                                <motion.div
                                    variants={accordionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="space-y-3 mt-4">
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={filters.priceRange.min}
                                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                                    className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-sm text-[13px] focus:outline-none focus:border-[#006D77] transition-colors bg-white font-sans"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={filters.priceRange.max}
                                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                                    className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-sm text-[13px] focus:outline-none focus:border-[#006D77] transition-colors bg-white font-sans"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sizes */}
                    <div className="border-b border-gray-200 pb-6">
                        <button
                            onClick={() => toggleSection("sizes")}
                            className="flex justify-between items-center w-full group"
                        >
                            <h3 className="text-[13px] font-bold uppercase tracking-[1px] font-sans">Size</h3>
                            <motion.div
                                animate={{ rotate: expandedSections.sizes ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {expandedSections.sizes && (
                                <motion.div
                                    variants={accordionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => toggleSize(size)}
                                                className={`
                                                    min-w-[40px] h-10 px-2 border rounded-sm text-[13px] font-medium transition-all duration-200
                                                    ${filters.sizes.includes(size)
                                                        ? 'border-[#006D77] bg-[#006D77] text-white'
                                                        : 'border-gray-200 text-gray-600 hover:border-[#006D77] hover:text-[#006D77] bg-white'
                                                    }
                                                `}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Colors */}
                    <div className="border-b border-gray-200 pb-6">
                        <button
                            onClick={() => toggleSection("colors")}
                            className="flex justify-between items-center w-full group"
                        >
                            <h3 className="text-[13px] font-bold uppercase tracking-[1px] font-sans">Color</h3>
                            <motion.div
                                animate={{ rotate: expandedSections.colors ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {expandedSections.colors && (
                                <motion.div
                                    variants={accordionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => toggleColor(color.name)}
                                                className="group relative"
                                                title={color.name}
                                            >
                                                <div
                                                    className={`
                                                        w-8 h-8 rounded-full border transition-all duration-300
                                                        ${filters.colors.includes(color.name)
                                                            ? 'scale-110 ring-2 ring-[#006D77] ring-offset-2'
                                                            : 'hover:scale-110 hover:border-[#006D77]'
                                                        }
                                                    `}
                                                    style={{ backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#e5e7eb' : 'transparent' }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="w-full py-3 text-[13px] font-semibold text-[#006D77] uppercase tracking-widest hover:bg-[#006D77]/5 rounded-sm transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            </aside>
        </>
    );
}
