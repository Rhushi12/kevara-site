"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import {
    Search,
    Package,
    AlertTriangle,
    CheckCircle,
    TrendingDown,
    BarChart3,
    Loader2,
    RefreshCw,
    ArrowUpDown,
    Save,
    X,
    Plus,
    Minus,
    Edit3,
    CheckSquare,
    Square
} from "lucide-react";

interface InventoryProduct {
    handle: string;
    title: string;
    status: string;
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
    sizes?: string[];
    colors?: { name: string; hex: string }[];
    stock?: number;
}

type SortField = 'title' | 'stock' | 'price' | 'status';
type SortDir = 'asc' | 'desc';
type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export default function InventoryManager() {
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [editingStock, setEditingStock] = useState<string | null>(null);
    const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ handle: string | 'bulk'; msg: string; ok: boolean } | null>(null);

    // Bulk action state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [bulkStockAction, setBulkStockAction] = useState<'add' | 'remove' | 'set'>('add');
    const [bulkStockAmount, setBulkStockAmount] = useState<string>("0");
    const [isSavingBulk, setIsSavingBulk] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter & Sort
    const getPrice = (p: InventoryProduct): number => {
        return parseFloat(p.priceRange?.minVariantPrice?.amount || '0');
    };

    const getStock = (p: InventoryProduct): number => {
        return p.stock ?? 0;
    };

    const filteredProducts = products
        .filter(p => {
            const matchesSearch =
                (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.handle || '').toLowerCase().includes(searchQuery.toLowerCase());
            const stock = getStock(p);
            const matchesFilter =
                stockFilter === 'all' ? true :
                stockFilter === 'in-stock' ? stock > 10 :
                stockFilter === 'low-stock' ? (stock > 0 && stock <= 10) :
                stock === 0;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortField) {
                case 'title': aVal = a.title; bVal = b.title; break;
                case 'stock': aVal = getStock(a); bVal = getStock(b); break;
                case 'price': aVal = getPrice(a); bVal = getPrice(b); break;
                case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
            }
            if (typeof aVal === 'string') {
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });


    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                const mapped = (data.products || []).map((p: any) => {
                    const node = p.node || p;
                    return {
                        ...node,
                        stock: node.stock ?? node.inventory ?? 0,
                    };
                });
                setProducts(mapped);
                setSelectedItems(new Set());
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    // Save stock update (single)
    const saveStock = async (handle: string) => {
        const newStock = stockInputs[handle];
        if (newStock === undefined || newStock < 0) return;

        setSaving(handle);
        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ handle, stock: newStock }]
                }),
            });

            if (res.ok) {
                setProducts(products.map(p =>
                    p.handle === handle ? { ...p, stock: newStock } : p
                ));
                setEditingStock(null);
                setSaveMessage({ handle, msg: 'Saved!', ok: true });
                setTimeout(() => setSaveMessage(null), 2000);
            } else {
                setSaveMessage({ handle, msg: 'Failed to save', ok: false });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (e) {
            setSaveMessage({ handle, msg: 'Error saving', ok: false });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setSaving(null);
        }
    };

    // Save bulk stock update
    const saveBulkStock = async () => {
        if (selectedItems.size === 0) return;
        const amount = parseInt(bulkStockAmount) || 0;
        if (bulkStockAction === 'set' && amount < 0) return;

        setIsSavingBulk(true);
        try {
            const itemsToUpdate = Array.from(selectedItems).map(handle => {
                const product = products.find(p => p.handle === handle);
                const currentStock = product ? getStock(product) : 0;
                let newStock = currentStock;

                if (bulkStockAction === 'add') {
                    newStock = currentStock + amount;
                } else if (bulkStockAction === 'remove') {
                    newStock = Math.max(0, currentStock - amount);
                } else if (bulkStockAction === 'set') {
                    newStock = Math.max(0, amount);
                }

                return { handle, stock: newStock };
            });

            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToUpdate }),
            });

            if (res.ok) {
                const updateMap = new Map(itemsToUpdate.map(i => [i.handle, i.stock]));
                setProducts(products.map(p =>
                    updateMap.has(p.handle) ? { ...p, stock: updateMap.get(p.handle) } : p
                ));
                setSelectedItems(new Set());
                setBulkStockAmount("0");
                setSaveMessage({ handle: 'bulk', msg: `Updated ${itemsToUpdate.length} items successfully!`, ok: true });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ handle: 'bulk', msg: 'Failed to perform bulk update', ok: false });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (e) {
            setSaveMessage({ handle: 'bulk', msg: 'Error performing bulk update', ok: false });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsSavingBulk(false);
        }
    };


    const startEditing = (handle: string, currentStock: number) => {
        setEditingStock(handle);
        setStockInputs(prev => ({ ...prev, [handle]: currentStock }));
    };

    const adjustStock = (handle: string, delta: number) => {
        setStockInputs(prev => ({
            ...prev,
            [handle]: Math.max(0, (prev[handle] || 0) + delta)
        }));
    };

    const toggleSelection = (handle: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(handle)) {
                newSet.delete(handle);
            } else {
                newSet.add(handle);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredProducts.map(p => p.handle)));
        }
    };

    // Stats
    const totalProducts = products.length;
    const inStockCount = products.filter(p => getStock(p) > 10).length;
    const lowStockCount = products.filter(p => { const s = getStock(p); return s > 0 && s <= 10; }).length;
    const outOfStockCount = products.filter(p => getStock(p) === 0).length;
    const totalStockUnits = products.reduce((a, p) => a + getStock(p), 0);



    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const stockBadge = (stock: number) => {
        if (stock === 0) return { label: 'Out of Stock', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (stock <= 10) return { label: `Low: ${stock}`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: `${stock} units`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    if (loading) return (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#0E4D55]" size={24} />
            <span className="text-sm text-slate-500">Loading inventory...</span>
        </div>
    );

    const isAllSelected = filteredProducts.length > 0 && selectedItems.size === filteredProducts.length;
    const isSomeSelected = selectedItems.size > 0 && selectedItems.size < filteredProducts.length;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                    onClick={() => setStockFilter('all')}
                    className={`p-4 rounded-xl border transition-all text-left ${stockFilter === 'all' ? 'bg-[#0E4D55] text-white border-[#0E4D55] shadow-md' : 'bg-white border-gray-200 hover:border-[#0E4D55]/30'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Package size={16} className={stockFilter === 'all' ? 'text-white/70' : 'text-slate-400'} />
                        <span className={`text-2xl font-lora font-medium ${stockFilter === 'all' ? '' : 'text-slate-900'}`}>{totalProducts}</span>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === 'all' ? 'text-white/70' : 'text-slate-400'}`}>Total</p>
                </button>

                <button
                    onClick={() => setStockFilter('in-stock')}
                    className={`p-4 rounded-xl border transition-all text-left ${stockFilter === 'in-stock' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white border-gray-200 hover:border-emerald-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle size={16} className={stockFilter === 'in-stock' ? 'text-white/70' : 'text-emerald-400'} />
                        <span className={`text-2xl font-lora font-medium ${stockFilter === 'in-stock' ? '' : 'text-slate-900'}`}>{inStockCount}</span>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === 'in-stock' ? 'text-white/70' : 'text-emerald-500'}`}>In Stock</p>
                </button>

                <button
                    onClick={() => setStockFilter('low-stock')}
                    className={`p-4 rounded-xl border transition-all text-left ${stockFilter === 'low-stock' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white border-gray-200 hover:border-amber-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <TrendingDown size={16} className={stockFilter === 'low-stock' ? 'text-white/70' : 'text-amber-400'} />
                        <span className={`text-2xl font-lora font-medium ${stockFilter === 'low-stock' ? '' : 'text-slate-900'}`}>{lowStockCount}</span>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === 'low-stock' ? 'text-white/70' : 'text-amber-500'}`}>Low Stock</p>
                </button>

                <button
                    onClick={() => setStockFilter('out-of-stock')}
                    className={`p-4 rounded-xl border transition-all text-left ${stockFilter === 'out-of-stock' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white border-gray-200 hover:border-rose-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle size={16} className={stockFilter === 'out-of-stock' ? 'text-white/70' : 'text-rose-400'} />
                        <span className={`text-2xl font-lora font-medium ${stockFilter === 'out-of-stock' ? '' : 'text-slate-900'}`}>{outOfStockCount}</span>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${stockFilter === 'out-of-stock' ? 'text-white/70' : 'text-rose-500'}`}>Out of Stock</p>
                </button>

                <div className="p-4 rounded-xl border border-gray-200 bg-white text-left hidden lg:block">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 size={16} className="text-blue-400" />
                        <span className="text-2xl font-lora font-medium text-slate-900">{totalStockUnits.toLocaleString()}</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Total Units</p>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                 <div className="bg-[#0E4D55]/5 border border-[#0E4D55]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                     <div className="flex items-center gap-3">
                         <span className="bg-[#0E4D55] text-white text-xs font-bold px-2 py-1 rounded-md">
                             {selectedItems.size} selected
                         </span>
                         <span className="text-sm text-[#0E4D55] font-medium">
                             Bulk Edit Stock
                         </span>
                     </div>
                     <div className="flex items-center gap-3 w-full sm:w-auto">
                         <select
                             value={bulkStockAction}
                             onChange={(e) => setBulkStockAction(e.target.value as any)}
                             className="h-10 px-3 bg-white border border-[#0E4D55]/20 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0E4D55]/50"
                         >
                             <option value="add">Add</option>
                             <option value="remove">Remove</option>
                             <option value="set">Set to</option>
                         </select>
                         <input
                             type="number"
                             min="0"
                             value={bulkStockAmount}
                             onChange={(e) => setBulkStockAmount(e.target.value)}
                             className="h-10 w-24 px-3 bg-white border border-[#0E4D55]/20 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0E4D55]/50"
                             placeholder="Amount"
                         />
                         <button
                             onClick={saveBulkStock}
                             disabled={isSavingBulk || !bulkStockAmount || isNaN(parseInt(bulkStockAmount))}
                             className="h-10 px-4 bg-[#0E4D55] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                         >
                             {isSavingBulk ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                             Apply to {selectedItems.size}
                         </button>
                     </div>
                     {saveMessage?.handle === 'bulk' && (
                         <div className={`text-sm font-medium ${saveMessage.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                             {saveMessage.msg}
                         </div>
                     )}
                 </div>
             )}

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search & Controls */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchProducts}
                            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-slate-600 text-sm font-medium flex items-center gap-2 hover:border-[#0E4D55] hover:text-[#0E4D55] transition-colors shadow-sm"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">
                                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#0E4D55] transition-colors flex items-center justify-center w-full">
                                        {isAllSelected ? <CheckSquare size={16} className="text-[#0E4D55]" /> :
                                         isSomeSelected ? <Minus size={16} strokeWidth={3} className="text-[#0E4D55] bg-[#0E4D55]/10 rounded-sm" /> :
                                         <Square size={16} />}
                                    </button>
                                </th>
                                <th className="p-4 w-12">#</th>
                                <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort('title')}>
                                    <span className="flex items-center gap-1">
                                        Product <ArrowUpDown size={12} className={sortField === 'title' ? 'text-[#0E4D55]' : ''} />
                                    </span>
                                </th>
                                <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                                    <span className="flex items-center gap-1">
                                        Status <ArrowUpDown size={12} className={sortField === 'status' ? 'text-[#0E4D55]' : ''} />
                                    </span>
                                </th>
                                <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort('price')}>
                                    <span className="flex items-center gap-1">
                                        Price <ArrowUpDown size={12} className={sortField === 'price' ? 'text-[#0E4D55]' : ''} />
                                    </span>
                                </th>
                                <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                                    <span className="flex items-center gap-1">
                                        Stock Level <ArrowUpDown size={12} className={sortField === 'stock' ? 'text-[#0E4D55]' : ''} />
                                    </span>
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <Package className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 font-medium">No products match your filters</p>
                                        <button onClick={() => { setStockFilter('all'); setSearchQuery(''); }} className="text-[#0E4D55] text-sm font-medium mt-2 hover:underline">
                                            Clear filters
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => {
                                    const imgUrl = product.images?.edges?.[0]?.node?.url;
                                    const stock = getStock(product);
                                    const badge = stockBadge(stock);
                                    const price = getPrice(product);
                                    const isEditing = editingStock === product.handle;
                                    const isSaving = saving === product.handle;
                                    const msg = saveMessage?.handle === product.handle ? saveMessage : null;
                                    const isSelected = selectedItems.has(product.handle);

                                    return (
                                        <tr key={product.handle} className={`hover:bg-gray-50/50 transition-colors group ${isSelected ? 'bg-[#0E4D55]/5' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleSelection(product.handle)}
                                                    className="text-gray-400 hover:text-[#0E4D55] transition-colors flex items-center justify-center w-full"
                                                >
                                                    {isSelected ? <CheckSquare size={16} className="text-[#0E4D55]" /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-xs text-gray-400 font-mono">{index + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                        {imgUrl ? (
                                                            <Image src={imgUrl} alt={product.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package size={14} className="text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{product.title}</h4>
                                                        <p className="text-xs text-gray-400 font-mono">{product.handle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                    product.status === 'ACTIVE'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    {product.status || 'DRAFT'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-700">
                                                ₹{price.toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                                                        <button
                                                            onClick={() => adjustStock(product.handle, -1)}
                                                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={stockInputs[product.handle] ?? stock}
                                                            onChange={(e) => setStockInputs(prev => ({ ...prev, [product.handle]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                                            className="w-16 h-7 text-center text-sm font-semibold border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E4D55] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <button
                                                            onClick={() => adjustStock(product.handle, 1)}
                                                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => saveStock(product.handle)}
                                                            disabled={isSaving}
                                                            className="h-7 px-2.5 rounded-md bg-[#0E4D55] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#0A3A40] transition-colors disabled:opacity-50 ml-1"
                                                        >
                                                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingStock(null)}
                                                            className="h-7 w-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                                            {badge.label}
                                                        </span>
                                                        {msg && (
                                                            <span className={`text-xs font-medium animate-in fade-in ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {msg.msg}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {!isEditing && (
                                                    <button
                                                        onClick={() => startEditing(product.handle, stock)}
                                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-[#0E4D55] border border-[#0E4D55]/20 hover:bg-[#0E4D55]/5 hover:border-[#0E4D55]/40 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit3 size={12} /> Update
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex justify-between items-center">
                    <span>{filteredProducts.length} of {products.length} products</span>
                    <span className="text-gray-400">Hover a row to update stock</span>
                </div>
            </div>
        </div>
    );
}
