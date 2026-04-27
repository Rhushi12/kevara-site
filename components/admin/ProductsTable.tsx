"use client";

import React, { useState, useEffect, useRef } from "react";
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
    ExternalLink,
    RotateCcw
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
    returnDays?: number;
    stock?: number;
    variantStock?: Record<string, number>;
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
    // Stock editing state
    const [expandedStockId, setExpandedStockId] = useState<string | null>(null);
    const [editingStock, setEditingStock] = useState<Record<string, number>>({});
    const [editingSizes, setEditingSizes] = useState<string[]>([]);
    const [stockSaving, setStockSaving] = useState(false);

    const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '24', '26', '28', '30', '32', '34', '36', 'FREE SIZE'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?includeDrafts=true');
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

    const handleSaveStock = async (product: Product) => {
        setStockSaving(true);
        try {
            // Clean up stock: only keep entries for current editingSizes
            const cleanedStock: Record<string, number> = {};
            editingSizes.forEach(s => { cleanedStock[s] = editingStock[s] ?? 0; });

            const res = await fetch('/api/products/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: product.handle,
                    title: product.title,
                    sizes: editingSizes,
                    variantStock: cleanedStock,
                })
            });
            if (res.ok) {
                setProducts(products.map(p =>
                    p.handle === product.handle
                        ? { ...p, sizes: [...editingSizes], variantStock: { ...cleanedStock } }
                        : p
                ));
                setExpandedStockId(null);
            } else {
                const err = await res.json();
                alert('Failed to save: ' + (err.error || 'Unknown error'));
            }
        } catch (e: any) {
            alert('Failed to save: ' + e.message);
        } finally {
            setStockSaving(false);
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
                                <th className="p-4">Variants / Stock</th>
                                <th className="p-4">Return</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <Package className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 font-medium">No products found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new product</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => (
                                    <React.Fragment key={`${product.id || 'prod'}-${index}`}>
                                    <tr className="hover:bg-gray-50/50 transition-colors group">
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
                                            {product.sizes && product.sizes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.sizes.map(size => {
                                                        const hasVariantStock = product.variantStock && Object.keys(product.variantStock).length > 0;
                                                        const sizeStock = hasVariantStock
                                                            ? (product.variantStock![size] ?? null)
                                                            : (product.stock ?? null);
                                                        const isOos = sizeStock !== null && sizeStock <= 0;
                                                        const isLow = sizeStock !== null && sizeStock > 0 && sizeStock <= 5;
                                                        return (
                                                            <span
                                                                key={size}
                                                                title={sizeStock !== null ? `${sizeStock} in stock` : 'Stock unknown'}
                                                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                                                                    isOos
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : isLow
                                                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                        : sizeStock !== null
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                                                }`}
                                                            >
                                                                {size}{sizeStock !== null ? ` · ${sizeStock}` : ''}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {(product.returnDays ?? 30) > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                                                    <RotateCcw size={10} />
                                                    {product.returnDays ?? 30}d
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">No returns</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {product.sizes && product.sizes.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            if (expandedStockId === product.handle) {
                                                                setExpandedStockId(null);
                                                            } else {
                                                                setExpandedStockId(product.handle);
                                                                // Pre-populate sizes and stock
                                                                const currentSizes = product.sizes || [];
                                                                setEditingSizes([...currentSizes]);
                                                                const init: Record<string, number> = {};
                                                                currentSizes.forEach(s => {
                                                                    init[s] = product.variantStock?.[s] ?? 0;
                                                                });
                                                                setEditingStock(init);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                                                            expandedStockId === product.handle
                                                                ? 'bg-[#0E4D55] text-white border-[#0E4D55]'
                                                                : 'bg-white text-[#0E4D55] border-[#0E4D55]/40 hover:border-[#0E4D55] hover:bg-[#0E4D55]/5'
                                                        }`}
                                                        title="Edit stock"
                                                    >
                                                        <Package size={11} />
                                                        Stock
                                                    </button>
                                                )}
                                                <a
                                                    href={`/products/${product.handle}`}
                                                    target="_blank"
                                                    className="inline-flex p-2 text-gray-400 hover:text-[#0E4D55] transition-colors rounded-full hover:bg-gray-100"
                                                    title="View on site"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Inline Stock Editor */}
                                    {expandedStockId === product.handle && product.sizes && (
                                        <tr key={`${product.handle}-stock`} className="bg-[#0E4D55]/5 border-t border-[#0E4D55]/10">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-[#0E4D55]">Edit Stock Per Size — {product.title}</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setExpandedStockId(null)}
                                                                className="h-7 px-3 rounded-lg border border-gray-200 text-slate-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleSaveStock(product)}
                                                                disabled={stockSaving}
                                                                className="h-7 px-3 rounded-lg bg-[#0E4D55] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#0A3A40] transition-colors disabled:opacity-50"
                                                            >
                                                                {stockSaving ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                     <div className="flex flex-col gap-4">
                                                        {/* Current sizes with stock inputs + remove button */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {editingSizes.map(size => (
                                                                <div key={size} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1.5">
                                                                    <span className="text-xs font-bold text-slate-800 min-w-[24px]">{size}</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editingStock[size] ?? 0}
                                                                        onChange={(e) => setEditingStock(prev => ({ ...prev, [size]: parseInt(e.target.value) || 0 }))}
                                                                        className="w-14 border border-[#0E4D55]/30 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E4D55] text-center"
                                                                    />
                                                                    <span className="text-[10px] text-gray-400 mr-1">pcs</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingSizes(prev => prev.filter(s => s !== size));
                                                                            setEditingStock(prev => { const n = {...prev}; delete n[size]; return n; });
                                                                        }}
                                                                        className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
                                                                        title="Remove size"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {editingSizes.length === 0 && (
                                                                <span className="text-xs text-gray-400 italic">No sizes — add from presets below</span>
                                                            )}
                                                        </div>

                                                        {/* Add size presets */}
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Add Size</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {PRESET_SIZES.filter(s => !editingSizes.includes(s)).map(size => (
                                                                    <button
                                                                        key={size}
                                                                        onClick={() => {
                                                                            setEditingSizes(prev => [...prev, size]);
                                                                            setEditingStock(prev => ({ ...prev, [size]: 0 }));
                                                                        }}
                                                                        className="flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-gray-300 text-[10px] font-semibold text-gray-500 hover:border-[#0E4D55] hover:text-[#0E4D55] hover:bg-[#0E4D55]/5 transition-colors"
                                                                    >
                                                                        <Plus size={9} /> {size}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
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
