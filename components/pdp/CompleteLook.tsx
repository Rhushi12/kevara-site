"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { RefreshCw, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Product {
    handle: string;
    title: string;
    priceRange: {
        minVariantPrice: {
            amount: string;
            currencyCode: string;
        };
    };
    images: {
        edges: {
            node: {
                url: string;
            };
        }[];
    };
    slug: string;
}

interface CompleteLookProps {
    currentProductHandle?: string;
    initialRelatedIds?: string[];
    availableProducts?: Product[];
}

export default function CompleteLook({
    currentProductHandle,
    initialRelatedIds = [],
    availableProducts = []
}: CompleteLookProps) {
    const { isAdmin } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Initialize displayed products
    useEffect(() => {
        if (availableProducts.length === 0) return;

        let initial: Product[] = [];

        if (initialRelatedIds.length > 0) {
            // Map IDs to products
            initial = initialRelatedIds
                .map(id => availableProducts.find(p => p.handle === id))
                .filter(Boolean) as Product[];
        }

        // If no related products or not enough, fill with defaults (excluding current)
        if (initial.length < 2) {
            const defaults = availableProducts
                .filter(p => p.handle !== currentProductHandle && !initial.find(i => i.handle === p.handle))
                .slice(0, 2 - initial.length);
            initial = [...initial, ...defaults];
        }

        setDisplayedProducts(initial);
    }, [initialRelatedIds, availableProducts, currentProductHandle]);

    const handleReplace = (index: number) => {
        setReplacingIndex(index);
        setIsPickerOpen(true);
        setSearchQuery("");
    };

    const handleSelectProduct = async (product: Product) => {
        if (replacingIndex === null || !currentProductHandle) return;

        const newProducts = [...displayedProducts];
        newProducts[replacingIndex] = product;
        setDisplayedProducts(newProducts);
        setIsPickerOpen(false);

        // Persist to backend
        setIsSaving(true);
        try {
            const relatedIds = newProducts.map(p => p.handle);
            const response = await fetch("/api/products/update-related", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: currentProductHandle,
                    relatedIds
                })
            });

            if (!response.ok) throw new Error("Failed to save");

            // Optional: Show success toast
        } catch (error) {
            console.error("Failed to save related products:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleShuffle = () => {
        if (availableProducts.length < 2) return;

        // Filter out current product and currently displayed products to find new candidates
        const pool = availableProducts.filter(p =>
            p.handle !== currentProductHandle &&
            !displayedProducts.find(dp => dp.handle === p.handle)
        );

        // If pool is too small (e.g. only 3 products total), just use all available excluding current
        const shufflePool = pool.length >= 2
            ? pool
            : availableProducts.filter(p => p.handle !== currentProductHandle);

        // Shuffle
        const shuffled = [...shufflePool].sort(() => 0.5 - Math.random());

        // Take first 2
        setDisplayedProducts(shuffled.slice(0, 2));
    };

    const filteredProducts = availableProducts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        p.handle !== currentProductHandle &&
        !displayedProducts.find(dp => dp.handle === p.handle)
    );

    if (displayedProducts.length === 0) return null;

    return (
        <div className="h-full relative">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#006D77] mb-2">
                        Complete the Look
                    </h2>
                    <h3 className="text-2xl font-lora text-slate-900">
                        Style it with
                    </h3>
                </div>
                {/* User Refresh Button */}
                <button
                    onClick={handleShuffle}
                    className="p-2 text-slate-400 hover:text-[#006D77] transition-colors"
                    title="Shuffle Look"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
                {displayedProducts.map((item, index) => (
                    <div key={`${item.handle}-${index}`} className="relative group">
                        <Link href={`/products/${item.slug}`} className="block">
                            <div className="relative aspect-[3/4] overflow-hidden mb-3 bg-gray-100 rounded-sm">
                                {item.images?.edges?.[0]?.node?.url && (
                                    <Image
                                        src={item.images.edges[0].node.url}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 group-hover:text-[#006D77] transition-colors line-clamp-1">
                                    {item.title}
                                </h4>
                                <span className="text-xs text-slate-500">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: item.priceRange.minVariantPrice.currencyCode }).format(parseFloat(item.priceRange.minVariantPrice.amount))}
                                </span>
                            </div>
                        </Link>

                        {/* Admin Replace Button (Only in Edit Mode) */}
                        {isEditMode && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleReplace(index);
                                }}
                                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:bg-[#006D77] hover:text-white transition-colors z-20"
                                title="Replace Product"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <Link
                    href="/collections/new-arrivals"
                    className="text-xs font-medium text-[#006D77] underline underline-offset-4 hover:text-slate-900 transition-colors"
                >
                    View all matching items
                </Link>
            </div>

            {/* Admin Controls (Fixed Position) */}
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                    {isEditMode ? (
                        <button
                            onClick={() => setIsEditMode(false)}
                            className="bg-[#006D77] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#005a63] transition-colors"
                        >
                            Done Editing
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
                        >
                            Edit Look
                        </button>
                    )}
                </div>
            )}

            {/* Product Picker Modal */}
            {isPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-lora text-lg font-medium">Select Product</h3>
                            <button onClick={() => setIsPickerOpen(false)} className="text-slate-400 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#006D77]"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="grid grid-cols-1 gap-2">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.handle}
                                        onClick={() => handleSelectProduct(product)}
                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors text-left group"
                                    >
                                        <div className="relative w-12 h-16 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                                            {product.images?.edges?.[0]?.node?.url && (
                                                <Image
                                                    src={product.images.edges[0].node.url}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-[#006D77]">
                                                {product.title}
                                            </h4>
                                            <span className="text-xs text-slate-500">
                                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: product.priceRange.minVariantPrice.currencyCode }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No products found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
