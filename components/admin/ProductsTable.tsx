"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    Search,
    Trash2,
    Edit,
    MoreVertical,
    Check,
    X,
    Plus,
    Upload,
    Eye,
    EyeOff,
    Loader2,
    Package,
    ExternalLink
} from "lucide-react";

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

interface ProductsTableProps {
    onAddProduct?: () => void;
}

export default function ProductsTable({ onAddProduct }: ProductsTableProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [bulkJson, setBulkJson] = useState("");
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkMessage, setBulkMessage] = useState("");
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
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
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This cannot be undone.`)) return;

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

    const handleBulkUpload = async () => {
        if (!bulkJson.trim()) return;
        setBulkUploading(true);
        setBulkMessage("");
        try {
            const parsed = JSON.parse(bulkJson);
            const productsArr = Array.isArray(parsed) ? parsed : [parsed];

            let successCount = 0;
            for (const product of productsArr) {
                const res = await fetch('/api/products/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product),
                });
                if (res.ok) successCount++;
            }

            setBulkMessage(`✅ Successfully uploaded ${successCount} of ${productsArr.length} products`);
            setBulkJson("");
            fetchProducts();
        } catch (e: any) {
            setBulkMessage(`❌ Error: ${e.message}`);
        } finally {
            setBulkUploading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        (product.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.handle || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#0E4D55]" size={24} />
            <span className="text-sm text-slate-500">Loading products...</span>
        </div>
    );

    return (
        <div ref={tableRef} className="relative">
            {/* Sticky Floating Toolbar — appears when products are selected */}
            {selectedProducts.length > 0 && (
                <div className="sticky top-0 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="mx-auto max-w-4xl">
                        <div className="bg-[#0E4D55] text-white rounded-b-xl shadow-lg px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                    {selectedProducts.length}
                                </div>
                                <span className="text-sm font-medium">
                                    {selectedProducts.length === 1 ? 'product' : 'products'} selected
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkStatusUpdate('ACTIVE')}
                                    disabled={actionLoading}
                                    className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <Eye size={14} /> Activate
                                </button>
                                <button
                                    onClick={() => handleBulkStatusUpdate('DRAFT')}
                                    disabled={actionLoading}
                                    className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <EyeOff size={14} /> Draft
                                </button>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={actionLoading}
                                    className="h-8 px-3 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedProducts([])}
                                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Search + Actions */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                            />
                            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowBulkUpload(!showBulkUpload)}
                                className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-slate-700 text-sm font-medium flex items-center gap-2 hover:border-[#0E4D55] hover:text-[#0E4D55] transition-colors shadow-sm"
                            >
                                <Upload size={15} /> Bulk Upload
                            </button>
                            <button
                                onClick={onAddProduct}
                                className="h-10 px-4 rounded-lg bg-[#0E4D55] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#0A3A40] transition-colors shadow-sm"
                            >
                                <Plus size={15} /> Add Product
                            </button>
                        </div>
                    </div>

                    {/* Bulk Upload Panel */}
                    {showBulkUpload && (
                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Bulk Upload Products</h4>
                            <p className="text-xs text-slate-500 mb-3">
                                Paste a JSON array of products. Each product needs: <code className="text-xs bg-gray-100 px-1 rounded">title</code>, <code className="text-xs bg-gray-100 px-1 rounded">description</code>, <code className="text-xs bg-gray-100 px-1 rounded">price</code>
                            </p>
                            <textarea
                                value={bulkJson}
                                onChange={(e) => setBulkJson(e.target.value)}
                                placeholder={`[{ "title": "Product Name", "description": "Details...", "price": "1999" }]`}
                                className="w-full h-32 p-3 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E4D55] resize-none"
                            />
                            <div className="flex items-center justify-between mt-3">
                                <div>
                                    {bulkMessage && (
                                        <span className={`text-xs font-medium ${bulkMessage.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {bulkMessage}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setShowBulkUpload(false); setBulkJson(""); setBulkMessage(""); }}
                                        className="h-9 px-4 rounded-lg border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkUpload}
                                        disabled={bulkUploading || !bulkJson.trim()}
                                        className="h-9 px-4 rounded-lg bg-[#0E4D55] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#0A3A40] transition-colors disabled:opacity-50"
                                    >
                                        {bulkUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                        Upload
                                    </button>
                                </div>
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
                                <th className="p-4">Variants</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <Package className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 font-medium">No products found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new product</p>
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
                                                            <Package size={16} />
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
                                                `₹${parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString()}`
                                                : '-'
                                            }
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {product.sizes && product.sizes.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {product.sizes.slice(0, 3).map(size => (
                                                            <span key={size} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                                                {size}
                                                            </span>
                                                        ))}
                                                        {product.sizes.length > 3 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                                                +{product.sizes.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <a
                                                href={`/product/${product.handle}`}
                                                target="_blank"
                                                className="inline-flex p-2 text-gray-400 hover:text-[#0E4D55] transition-colors rounded-full hover:bg-gray-100"
                                                title="View on site"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex justify-between items-center">
                    <span>{filteredProducts.length} of {products.length} products</span>
                    <span className="text-gray-400">Select products for bulk actions</span>
                </div>
            </div>
        </div>
    );
}
