"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, CheckSquare } from "lucide-react";

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        images: {
            edges: {
                node: {
                    url: string;
                }
            }[]
        }
    }
}

interface ProductPickerProps {
    selectedHandles: string[];
    onSelectionChange: (handles: string[]) => void;
    maxSelection?: number;
}

export default function ProductPicker({ selectedHandles, onSelectionChange, maxSelection }: ProductPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && products.length === 0) {
            setLoading(true);
            fetch("/api/products")
                .then((res) => res.json())
                .then((data) => {
                    if (data.products) {
                        setProducts(data.products);
                    }
                })
                .catch((err) => console.error("Failed to fetch products", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, products.length]);

    const filteredProducts = products.filter((p) =>
        p.node.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelection = (handle: string) => {
        if (selectedHandles.includes(handle)) {
            onSelectionChange(selectedHandles.filter((h) => h !== handle));
        } else {
            if (maxSelection && selectedHandles.length >= maxSelection) {
                alert(`You can only select up to ${maxSelection} products.`);
                return;
            }
            onSelectionChange([...selectedHandles, handle]);
        }
    };

    const selectAll = () => {
        const allHandles = filteredProducts.map(p => p.node.handle);
        if (maxSelection) {
            onSelectionChange(allHandles.slice(0, maxSelection));
        } else {
            onSelectionChange(allHandles);
        }
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
                {selectedHandles.length > 0
                    ? `Selected ${selectedHandles.length} Product${selectedHandles.length > 1 ? "s" : ""}`
                    : "Select Products"}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-lora font-semibold text-lg">Select Products</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search + Actions */}
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006D77] focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAll}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#006D77] text-white rounded-lg hover:bg-[#005a63] transition-colors"
                                >
                                    <CheckSquare size={14} />
                                    Select All
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading ? (
                                <div className="text-center py-8 text-gray-400">Loading products...</div>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                    const isSelected = selectedHandles.includes(product.node.handle);
                                    return (
                                        <div
                                            key={product.node.id}
                                            onClick={() => toggleSelection(product.node.handle)}
                                            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${isSelected
                                                ? "bg-[#006D77]/5 border-[#006D77]"
                                                : "hover:bg-gray-50 border-transparent"
                                                }`}
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                                {product.node.images.edges[0]?.node.url && (
                                                    <img
                                                        src={product.node.images.edges[0].node.url}
                                                        alt={product.node.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 truncate">
                                                    {product.node.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {product.node.handle}
                                                </p>
                                            </div>
                                            <div
                                                className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected
                                                    ? "bg-[#006D77] border-[#006D77] text-white"
                                                    : "border-gray-300"
                                                    }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-400">No products found</div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="text-sm text-slate-500">
                                {selectedHandles.length} selected
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-[#006D77] text-white px-6 py-2 rounded-lg hover:bg-[#005a63] transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
