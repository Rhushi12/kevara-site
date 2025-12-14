"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { X, Search, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import ImageWithLoader from "@/components/ui/ImageWithLoader";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { create } from "zustand";

// Search Store
interface SearchStore {
    isOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
    isOpen: false,
    openSearch: () => set({ isOpen: true }),
    closeSearch: () => set({ isOpen: false }),
}));

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        slug?: string;
        priceRange?: {
            minVariantPrice?: {
                amount: string;
                currencyCode: string;
            };
        };
        images?: {
            edges: {
                node: {
                    url: string;
                    altText?: string;
                };
            }[];
        };
    };
}

export default function SearchPanel() {
    const { isOpen, closeSearch } = useSearchStore();
    const router = useRouter();

    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter & Sort State
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "name">("default");
    const [priceRange, setPriceRange] = useState<"all" | "under-1000" | "1000-5000" | "over-5000">("all");

    // Fetch all products on mount
    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const res = await fetch("/api/products");
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Filter and sort products based on search query
    useEffect(() => {
        let results = products;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(p =>
                p.node.title.toLowerCase().includes(query)
            );
        }

        // Price filter
        if (priceRange !== "all") {
            results = results.filter(p => {
                const price = parseFloat(p.node.priceRange?.minVariantPrice?.amount || "0");
                switch (priceRange) {
                    case "under-1000": return price < 1000;
                    case "1000-5000": return price >= 1000 && price <= 5000;
                    case "over-5000": return price > 5000;
                    default: return true;
                }
            });
        }

        // Sort
        switch (sortBy) {
            case "price-low":
                results = [...results].sort((a, b) =>
                    parseFloat(a.node.priceRange?.minVariantPrice?.amount || "0") -
                    parseFloat(b.node.priceRange?.minVariantPrice?.amount || "0")
                );
                break;
            case "price-high":
                results = [...results].sort((a, b) =>
                    parseFloat(b.node.priceRange?.minVariantPrice?.amount || "0") -
                    parseFloat(a.node.priceRange?.minVariantPrice?.amount || "0")
                );
                break;
            case "name":
                results = [...results].sort((a, b) =>
                    a.node.title.localeCompare(b.node.title)
                );
                break;
        }

        setFilteredProducts(results);
    }, [searchQuery, products, sortBy, priceRange]);

    // GSAP Animation
    const tl = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const preLayers = preLayersRef.current?.querySelectorAll(".search-prelayer");
            const contentItems = contentRef.current?.querySelectorAll(".search-content-item");

            // Initial States
            gsap.set(overlayRef.current, { autoAlpha: 0 });
            gsap.set(panelRef.current, { xPercent: 100 });
            gsap.set(preLayers || [], { xPercent: 100 });
            gsap.set(contentItems || [], { y: 20, autoAlpha: 0 });

            // Build Timeline
            tl.current = gsap.timeline({ paused: true })
                .to(overlayRef.current, { autoAlpha: 1, duration: 0.3 })
                .to(preLayers || [], {
                    xPercent: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power4.out"
                }, "-=0.2")
                .to(panelRef.current, {
                    xPercent: 0,
                    duration: 0.6,
                    ease: "power4.out"
                }, "-=0.4")
                .to(contentItems || [], {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.4,
                    stagger: 0.05,
                    ease: "power2.out"
                }, "-=0.2");
        });

        return () => ctx.revert();
    }, []);

    // Control Animation
    useEffect(() => {
        if (isOpen) {
            tl.current?.play();
        } else {
            tl.current?.reverse();
        }
    }, [isOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            closeSearch();
            // Navigate to search page with query
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleProductClick = (handle: string) => {
        closeSearch();
        router.push(`/products/${handle}`);
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm invisible"
            onClick={closeSearch}
        >
            {/* Pre-layers for staggered effect */}
            <div ref={preLayersRef} className="absolute inset-y-0 right-0 w-full md:w-[480px] pointer-events-none overflow-hidden z-20">
                <div className="search-prelayer absolute inset-0 bg-[#006D77] z-10" />
                <div className="search-prelayer absolute inset-0 bg-[#FDFBF7] z-20" />
            </div>

            {/* Main Panel */}
            <div
                ref={panelRef}
                className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-30 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >

                <div ref={contentRef} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="search-content-item flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-xl font-lora italic text-slate-900">Search</h2>
                        <button
                            onClick={closeSearch}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="search-content-item p-6 border-b border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none text-slate-900"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#006D77] transition-colors"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    {/* Filters & Sort */}
                    <div className="search-content-item px-6 py-4 border-b border-gray-100">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-between w-full text-sm font-medium text-slate-900"
                        >
                            <span>Filter & Sort</span>
                            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {showFilters && (
                            <div className="mt-4 space-y-4">
                                {/* Sort By */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none"
                                    >
                                        <option value="default">Default</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="name">Name: A to Z</option>
                                    </select>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">
                                        Price Range
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: "all", label: "All" },
                                            { value: "under-1000", label: "Under ₹1000" },
                                            { value: "1000-5000", label: "₹1000 - ₹5000" },
                                            { value: "over-5000", label: "Over ₹5000" },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setPriceRange(option.value as typeof priceRange)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${priceRange === option.value
                                                    ? "bg-[#006D77] text-white border-[#006D77]"
                                                    : "border-gray-200 text-slate-600 hover:border-[#006D77]"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="search-content-item flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#006D77]" />
                            </div>
                        ) : searchQuery.trim() === "" ? (
                            <div className="text-center text-gray-400 py-8">
                                <Search size={40} className="mx-auto mb-3 opacity-50" />
                                <p>Start typing to search products</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                <p>No products found for "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <p className="text-sm text-gray-500 col-span-2 mb-2">
                                    {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} found
                                </p>
                                {filteredProducts.slice(0, 8).map((product) => {
                                    const { title, handle, slug, priceRange, images } = product.node;
                                    const price = priceRange?.minVariantPrice?.amount || "0";
                                    const currency = priceRange?.minVariantPrice?.currencyCode || "INR";
                                    const imageUrl = images?.edges?.[0]?.node?.url;
                                    const productSlug = slug || handle;

                                    return (
                                        <button
                                            key={handle}
                                            onClick={() => handleProductClick(productSlug)}
                                            className="group flex flex-col text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                        >
                                            <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-sm overflow-hidden mb-3">
                                                {imageUrl && (
                                                    <ImageWithLoader
                                                        src={imageUrl}
                                                        alt={title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-[#006D77] transition-colors">
                                                    {title}
                                                </h4>
                                                <p className="text-sm text-slate-600 mt-1 font-medium">
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: currency,
                                                    }).format(parseFloat(price))}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredProducts.length > 8 && (
                                    <button
                                        onClick={handleSearch}
                                        className="col-span-2 w-full py-3 text-sm font-medium text-[#006D77] hover:text-[#005a63] transition-colors text-center border-t border-gray-100 mt-2"
                                    >
                                        View all {filteredProducts.length} results →
                                    </button>
                                )}
                            </div>

                        )}
                    </div>

                    {/* View All Button */}
                    {searchQuery.trim() && filteredProducts.length > 0 && (
                        <div className="search-content-item p-6 border-t border-gray-100">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-[#006D77] text-white py-3 rounded-lg font-medium hover:bg-[#005a63] transition-colors"
                            >
                                View All Results
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
