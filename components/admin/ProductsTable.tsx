"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Search,
    Trash2,
    Edit,
    MoreVertical,
    Check,
    X,
    Filter,
    Download,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

interface Product {
    id: string;
    handle: string;
    title: string;
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
    status?: string;
    sizes?: string[];
    colors?: { name: string; hex: string }[];
}

export default function ProductsTable() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                // Flatten the nested node structure from the API
                setProducts((data.products || []).map((p: any) => p.node || p));
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts.map(p => p.handle));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (handle: string) => {
        if (selectedProducts.includes(handle)) {
            setSelectedProducts(selectedProducts.filter(id => id !== handle));
        } else {
            setSelectedProducts([...selectedProducts, handle]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedProducts }),
            });

            if (res.ok) {
                setProducts(products.filter(p => !selectedProducts.includes(p.handle)));
                setSelectedProducts([]);
            } else {
                alert("Failed to delete products");
            }
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'DRAFT') => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedProducts, status }),
            });

            if (res.ok) {
                setProducts(products.map(p =>
                    selectedProducts.includes(p.handle) ? { ...p, status } : p
                ));
                setSelectedProducts([]);
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Status update failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        (product.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.handle || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>

                {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-medium text-gray-600 mr-2">
                            {selectedProducts.length} selected
                        </span>

                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <button
                                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                                disabled={actionLoading}
                                className="px-3 py-2 hover:bg-green-50 text-green-600 border-r border-gray-200 flex items-center gap-1 text-sm font-medium transition-colors"
                                title="Set as Active"
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('DRAFT')}
                                disabled={actionLoading}
                                className="px-3 py-2 hover:bg-yellow-50 text-yellow-600 border-r border-gray-200 flex items-center gap-1 text-sm font-medium transition-colors"
                                title="Set as Draft"
                            >
                                <EyeOff size={16} />
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={actionLoading}
                                className="px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1 text-sm font-medium transition-colors"
                                title="Delete"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <th className="p-4 w-4">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                    className="rounded border-gray-300 text-[#0E4D55] focus:ring-[#0E4D55]"
                                />
                            </th>
                            <th className="p-4">Product</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Inventory</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => (
                                <tr key={`${product.id || 'prod'}-${index}`} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.handle)}
                                            onChange={() => handleSelectProduct(product.handle)}
                                            className="rounded border-gray-300 text-[#0E4D55] focus:ring-[#0E4D55]"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                {product.images?.edges[0]?.node?.url ? (
                                                    <Image
                                                        src={product.images.edges[0].node.url}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <span className="text-xs">No img</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-900 line-clamp-1">{product.title}</h4>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">{product.handle}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.status === 'ACTIVE'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></span>
                                            {product.status || 'DRAFT'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-700">
                                        {product.priceRange?.minVariantPrice ?
                                            `${parseInt(product.priceRange.minVariantPrice.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`
                                            : '-'
                                        }
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {product.sizes && product.sizes.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.sizes.slice(0, 3).map(size => (
                                                        <span key={size} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            {size}
                                                        </span>
                                                    ))}
                                                    {product.sizes.length > 3 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            +{product.sizes.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {(!product.sizes || product.sizes.length === 0) && (
                                                <span className="text-xs text-gray-400">No sizes</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-[#0E4D55] transition-colors rounded-full hover:bg-gray-100">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex justify-between items-center">
                <span>Total {products.length} products</span>
                <span>Sorted by Date (Newest)</span>
            </div>
        </div>
    );
}
