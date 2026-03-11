"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, TrendingUp } from "lucide-react";

interface Product {
    handle: string;
    title: string;
    images: { edges: { node: { url: string; altText: string | null } }[] };
    variants: { edges: { node: { price: { amount: string } } }[] };
    totalVariants?: { count: number };
}

export default function TopProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    // Show first 4 products sorted by title
                    setProducts(data.products?.slice(0, 4) || []);
                }
            } catch (error) {
                console.error("TopProducts fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 h-[400px] flex items-center justify-center animate-pulse">
            <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">Loading Products...</span>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-lora font-medium text-slate-900 tracking-tight">Product Catalog</h3>
                    <p className="text-xs text-slate-500 font-medium">Your active products</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-600" />
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Package size={24} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">No products found</span>
                    </div>
                ) : (
                    products.map((product, index) => {
                        const imgUrl = product.images?.edges?.[0]?.node?.url;
                        const price = product.variants?.edges?.[0]?.node?.price?.amount || "0";
                        const variantCount = product.totalVariants?.count || product.variants?.edges?.length || 0;

                        return (
                            <div key={product.handle || index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="h-12 w-12 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60 relative">
                                    {imgUrl ? (
                                        <Image src={imgUrl} alt={product.title} fill className="object-cover" />
                                    ) : (
                                        <Package className="absolute inset-0 m-auto text-slate-300" size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900 truncate">{product.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium">₹{parseFloat(price).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-slate-900">{variantCount}</span>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                        {variantCount === 1 ? 'Variant' : 'Variants'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <button className="w-full mt-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-colors border-t border-slate-100">
                View All Products
            </button>
        </div>
    );
}
