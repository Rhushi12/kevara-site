"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Product {
    handle: string;
    title: string;
    images: { edges: { node: { url: string } }[] };
    variants: { edges: { node: { price: { amount: string } } }[] };
}

export default function InventoryAlerts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products?includeDrafts=true');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error("Inventory alerts error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 h-[300px] flex items-center justify-center animate-pulse">
            <span className="text-sm font-medium text-slate-300 tracking-widest uppercase font-figtree">Loading...</span>
        </div>
    );

    // Products without images are flagged as needing attention
    const productsNeedingAttention = products.filter(p => {
        const hasImage = p.images?.edges?.length > 0;
        const hasPrice = parseFloat(p.variants?.edges?.[0]?.node?.price?.amount || "0") > 0;
        return !hasImage || !hasPrice;
    });

    const allGood = productsNeedingAttention.length === 0;

    return (
        <div className="group relative bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.08)] hover:-translate-y-1 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-2xl font-kamundi font-medium text-slate-900 tracking-tight">Catalog Health</h3>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">Products needing attention</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${allGood ? 'bg-emerald-50 border-emerald-100/50' : 'bg-amber-50 border-amber-100/50'}`}>
                    {allGood ? (
                        <CheckCircle size={20} className="text-emerald-500" />
                    ) : (
                        <AlertTriangle size={20} className="text-amber-500" />
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-3">
                {allGood ? (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-500">
                        <CheckCircle size={28} className="mb-2" />
                        <span className="text-sm font-semibold text-slate-700">All products look good!</span>
                        <span className="text-xs text-slate-400 mt-1">{products.length} products in catalog</span>
                    </div>
                ) : (
                    productsNeedingAttention.slice(0, 3).map((product, i) => {
                        const imgUrl = product.images?.edges?.[0]?.node?.url;
                        const hasImage = product.images?.edges?.length > 0;
                        const hasPrice = parseFloat(product.variants?.edges?.[0]?.node?.price?.amount || "0") > 0;

                        return (
                            <div key={product.handle || i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="h-10 w-10 rounded bg-slate-200 overflow-hidden relative flex-shrink-0">
                                    {imgUrl && <Image src={imgUrl} alt={product.title} fill className="object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900 truncate">{product.title}</h4>
                                    <p className="text-xs font-bold text-amber-600">
                                        {!hasImage && 'Missing image'}
                                        {!hasImage && !hasPrice && ' • '}
                                        {!hasPrice && 'No price set'}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded">
                                    Fix
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
