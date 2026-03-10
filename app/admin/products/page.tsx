'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProductQueueStore } from '@/lib/productQueueStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CreateProductModal from '@/components/admin/CreateProductModal';
import BulkEditModal from '@/components/admin/BulkEditModal';
import { Loader2, CheckCircle, XCircle, Clock, Package, RefreshCw, Plus, Trash2, X, Check, Upload, AlertCircle, Edit, RotateCcw, RotateCw } from 'lucide-react';

interface BulkUploadResult {
    row: number;
    title: string;
    handle?: string;
    status: 'success' | 'error';
    error?: string;
}

interface HistoryAction {
    id: string;
    timestamp: number;
    description: string;
    items: Array<{
        handle: string;
        previousData: any;
        newData: any;
    }>;
}

export default function AdminProductManager() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { queue, clearQueue } = useProductQueueStore();
    const [liveProducts, setLiveProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Multi-select state
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    // Undo/Redo State
    const [history, setHistory] = useState<HistoryAction[]>([]);
    const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

    // Bulk upload progress state
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState('');
    const [bulkResults, setBulkResults] = useState<BulkUploadResult[]>([]);
    const [bulkErrors, setBulkErrors] = useState<string[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Protect route
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [authLoading, isAdmin, router]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setLiveProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchProducts();
        }
    }, [isAdmin]);

    // Track Shift Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Listen for product updates to refresh list
    useEffect(() => {
        const handleRefresh = () => fetchProducts();
        window.addEventListener('refresh-products', handleRefresh);
        return () => window.removeEventListener('refresh-products', handleRefresh);
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        setDeletingId(id);
        try {
            const res = await fetch('/api/products/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Failed to delete product");
            setLiveProducts(prev => prev.filter(p => p.node.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete product.");
        } finally {
            setDeletingId(null);
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        const count = selectedProducts.size;
        if (!confirm(`Are you sure you want to delete ${count} product${count > 1 ? 's' : ''}? This cannot be undone.`)) return;

        setIsBulkDeleting(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedProducts) {
            try {
                const res = await fetch('/api/products/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                });

                if (res.ok) {
                    setLiveProducts(prev => prev.filter(p => p.node.id !== id));
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        alert(`Deleted ${successCount} product${successCount !== 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : ''}`);
        setSelectedProducts(new Set());
        setIsSelectMode(false);
        setIsBulkDeleting(false);
    };

    const performUpdate = async (items: any[]) => {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
        });

        if (!res.ok) throw new Error("Failed to update products");
        await fetchProducts();
    };

    const handleBulkUpdate = async (updateData: any) => {
        if (selectedProducts.size === 0) return;

        setIsBulkDeleting(true);
        try {
            // 1. Capture State & Prepare Updates
            const timestamp = Date.now();
            const actionItems: HistoryAction['items'] = [];
            const updatePayloadItems: any[] = [];

            for (const handle of Array.from(selectedProducts)) {
                const product = liveProducts.find(p => p.node.handle === handle);
                if (!product) continue;

                // Calculate New Title
                let newTitle = updateData.title || product.node.title;
                if (updateData.titleSuffix) {
                    newTitle = `${newTitle}${updateData.titleSuffix}`;
                }

                // Prepare New Data Object (for history and API)
                const newData = {
                    handle,
                    ...(updateData.title || updateData.titleSuffix ? { title: newTitle } : {}),
                    ...(updateData.status && { status: updateData.status }),
                    ...(updateData.price && { price: updateData.price }),
                    ...(updateData.sizes && { sizes: updateData.sizes }),
                    ...(updateData.colors && { colors: updateData.colors }),
                };

                // Prepare Previous Data Object (for undo)
                const previousData = {
                    handle,
                    ...(newData.title && { title: product.node.title }),
                    ...(newData.status && { status: product.node.status }),
                    ...(newData.price && { price: product.node.priceRange?.minVariantPrice?.amount }), // Note: check logic if price structure varies
                    ...(newData.sizes && { sizes: product.node.sizes }),
                    ...(newData.colors && { colors: product.node.colors }),
                };

                // Fix price access if needed - ensuring flat structure matching API expectation
                // The API expects 'price' as string, but product node has nested object.
                // We should store what the API expects for restoration.
                if (newData.price && !previousData.price) {
                    previousData.price = product.node.priceRange?.minVariantPrice?.amount;
                }

                actionItems.push({ handle, previousData, newData });
                updatePayloadItems.push(newData);
            }

            if (updatePayloadItems.length === 0) return;

            // 2. Perform Update
            await performUpdate(updatePayloadItems);

            // 3. Update History
            const action: HistoryAction = {
                id: `action_${timestamp}`,
                timestamp,
                description: `Bulk update (${updatePayloadItems.length} products)`,
                items: actionItems,
            };
            setHistory(prev => [...prev, action]);
            setRedoStack([]); // Clear redo stack on new action

            alert(`Successfully updated ${selectedProducts.size} products.`);
            setSelectedProducts(new Set());
            setIsSelectMode(false);

        } catch (error) {
            console.error("Bulk update failed:", error);
            alert("Failed to update products");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleUndo = async () => {
        if (history.length === 0) return;
        const action = history[history.length - 1];

        setIsBulkDeleting(true); // Reuse loading state
        try {
            const revertItems = action.items.map(item => item.previousData);
            await performUpdate(revertItems);

            setHistory(prev => prev.slice(0, -1));
            setRedoStack(prev => [...prev, action]);
            alert("Undo successful");
        } catch (error) {
            console.error("Undo failed:", error);
            alert("Failed to undo changes");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleRedo = async () => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];

        setIsBulkDeleting(true);
        try {
            const applyItems = action.items.map(item => item.newData);
            await performUpdate(applyItems);

            setRedoStack(prev => prev.slice(0, -1));
            setHistory(prev => [...prev, action]);
            alert("Redo successful");
        } catch (error) {
            console.error("Redo failed:", error);
            alert("Failed to redo changes");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Toggle product selection
    const toggleProductSelection = (handle: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(handle)) {
                newSet.delete(handle);
            } else {
                newSet.add(handle);
            }
            return newSet;
        });
    };

    const handleHoverSelect = (handle: string) => {
        if (isSelectMode && isShiftPressed) {
            setSelectedProducts(prev => {
                const newSet = new Set(prev);
                newSet.add(handle); // Only add, don't toggle
                return newSet;
            });
        }
    };

    // Select/Deselect all
    const toggleSelectAll = () => {
        if (selectedProducts.size === liveProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(liveProducts.map(p => p.node.handle)));
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkUploading(true);
        setBulkProgress('Uploading CSV...');
        setBulkResults([]);
        setBulkErrors([]);
        setShowBulkModal(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setBulkProgress('Processing products...');

            const res = await fetch('/api/products/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Bulk upload failed');
            }

            setBulkResults(data.results || []);
            setBulkErrors(data.errors || []);
            setBulkProgress('Complete!');
            fetchProducts();

        } catch (error: any) {
            console.error('Bulk upload error:', error);
            setBulkErrors([error.message]);
            setBulkProgress('Failed');
        } finally {
            setBulkUploading(false);
            e.target.value = '';
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="animate-spin text-slate-900" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-lora font-medium text-slate-900">Product Manager</h1>
                        <p className="text-slate-500 mt-1">Manage your inventory and track uploads</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-900 rounded-lg transition-colors ${bulkUploading ? 'opacity-50 cursor-wait' : 'hover:bg-gray-50 cursor-pointer'}`}>
                            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={bulkUploading} />
                            {bulkUploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Bulk Upload
                                </>
                            )}
                        </label>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                        <Link
                            href="/admin"
                            className="px-4 py-2 bg-white border border-gray-200 text-slate-900 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Back to Admin
                        </Link>
                    </div>
                </div>

                {/* Queue Section */}
                {queue.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Clock className="text-slate-900" size={20} />
                                <h2 className="text-lg font-semibold text-slate-900">Upload Queue ({queue.length})</h2>
                            </div>
                            <button
                                onClick={clearQueue}
                                className="text-sm text-red-500 hover:text-red-700 font-medium"
                            >
                                Clear Completed
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {queue.map((item) => (
                                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        {item.files?.[0] ? (
                                            <Image
                                                src={URL.createObjectURL(item.files[0])}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                                <Package size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-900 truncate">{item.title}</h3>
                                        <p className="text-sm text-slate-500">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {item.status === 'pending' && (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                        {item.status === 'processing' && (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" /> Processing
                                            </span>
                                        )}
                                        {item.status === 'success' && (
                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium flex items-center gap-1">
                                                <CheckCircle size={12} /> Complete
                                            </span>
                                        )}
                                        {item.status === 'error' && (
                                            <div className="flex flex-col items-end">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <XCircle size={12} /> Failed
                                                </span>
                                                <span className="text-xs text-red-500 mt-1">{item.error}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Live Inventory Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Package className="text-slate-900" size={24} />
                            <h2 className="text-2xl font-lora font-medium text-slate-900">Live Inventory</h2>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                {liveProducts.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0 || isBulkDeleting}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Undo Last Action"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={redoStack.length === 0 || isBulkDeleting}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Redo Action"
                            >
                                <RotateCw size={20} />
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-1" />
                            <button
                                onClick={() => {
                                    setIsSelectMode(!isSelectMode);
                                    if (isSelectMode) setSelectedProducts(new Set());
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelectMode ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'}`}
                            >
                                {isSelectMode ? 'Cancel Selection' : 'Select Products'}
                            </button>
                            <button
                                onClick={fetchProducts}
                                disabled={loadingProducts}
                                className="p-2 hover:bg-white rounded-full transition-colors text-slate-600 hover:text-slate-900"
                                title="Refresh Inventory"
                            >
                                <RefreshCw size={20} className={loadingProducts ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Select All Bar */}
                    {isSelectMode && liveProducts.length > 0 && (
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleSelectAll}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedProducts.size === liveProducts.length ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    {selectedProducts.size === liveProducts.length && <Check size={14} />}
                                </button>
                                <span className="text-sm text-slate-600">
                                    {selectedProducts.size === 0 ? 'Select all' : `${selectedProducts.size} of ${liveProducts.length} selected`}
                                </span>
                            </div>


                            {selectedProducts.size > 0 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsBulkEditModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                                    >
                                        <Edit size={16} /> Bulk Edit
                                    </button>

                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {isBulkDeleting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Delete ({selectedProducts.size})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulk Edit Modal */}
                    <BulkEditModal
                        isOpen={isBulkEditModalOpen}
                        onClose={() => setIsBulkEditModalOpen(false)}
                        count={selectedProducts.size}
                        onSave={handleBulkUpdate}
                    />

                    {loadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : liveProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {liveProducts.map((product: any) => (
                                <div
                                    key={product.node.id}
                                    className={`group bg-white rounded-xl overflow-hidden border transition-all duration-300 relative ${selectedProducts.has(product.node.handle) ? 'border-slate-900 ring-2 ring-slate-900' : 'border-gray-100 hover:shadow-md'}`}
                                    onClick={() => isSelectMode && toggleProductSelection(product.node.handle)}
                                    onMouseEnter={() => handleHoverSelect(product.node.handle)}
                                >
                                    {/* Selection Checkbox */}
                                    {isSelectMode && (
                                        <div className="absolute top-3 left-3 z-40">
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedProducts.has(product.node.handle) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white/90 border-gray-300'}`}>
                                                {selectedProducts.has(product.node.handle) && <Check size={14} />}
                                            </div>
                                        </div>
                                    )}

                                    <Link href={isSelectMode ? '#' : `/products/${product.node.slug || product.node.handle}`} onClick={(e) => isSelectMode && e.preventDefault()}>
                                        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                                            {product.node.video && (
                                                <div className="absolute inset-0 z-10">
                                                    <video
                                                        src={product.node.video}
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            {product.node.images?.edges?.[0]?.node?.url ? (
                                                <Image
                                                    src={product.node.images.edges[0].node.url}
                                                    alt={product.node.title}
                                                    fill
                                                    className={`object-cover group-hover:scale-105 transition-transform duration-500 ${product.node.video ? 'z-0' : 'z-10'}`}
                                                />
                                            ) : !product.node.video && (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package size={32} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-20" />
                                        </div>
                                    </Link>

                                    {/* Delete Button (only in non-select mode) */}
                                    {!isSelectMode && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(product.node.id, product.node.title);
                                            }}
                                            disabled={deletingId === product.node.id}
                                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 z-30"
                                            title="Delete Product"
                                        >
                                            {deletingId === product.node.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <XCircle size={18} />
                                            )}
                                        </button>
                                    )}

                                    <div className="p-4">
                                        <h3 className="font-medium text-slate-900 truncate mb-1">{product.node.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-500">
                                                {(() => {
                                                    const p = product.node.priceRange?.minVariantPrice?.amount;
                                                    if (!p) return 'Price not set';
                                                    if (p.toString().includes('-')) {
                                                        // Format range: "100-200" -> "₹100 - ₹200"
                                                        const parts = p.toString().split('-').map((s: string) => s.trim());
                                                        if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                                                            return `₹${parts[0]} - ₹${parts[1]}`;
                                                        }
                                                        return p.toString().startsWith('₹') ? p : `₹${p}`;
                                                    }
                                                    return `₹${p}`;
                                                })()}
                                            </p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${product.node.status === 'ACTIVE'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-yellow-50 text-yellow-700'
                                                }`}>
                                                {product.node.status || 'DRAFT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Package className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-900">No products found</h3>
                            <p className="text-slate-500 mt-1">Start adding products to see them here.</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Add Your First Product
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Upload Progress Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {bulkUploading ? (
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                ) : bulkErrors.length > 0 && bulkResults.length === 0 ? (
                                    <AlertCircle className="text-red-500" size={24} />
                                ) : (
                                    <CheckCircle className="text-green-500" size={24} />
                                )}
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {bulkUploading ? 'Processing Bulk Upload' : 'Bulk Upload Complete'}
                                </h3>
                            </div>
                            {!bulkUploading && (
                                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            {bulkUploading && (
                                <div className="text-center py-8">
                                    <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
                                    <p className="text-slate-600">{bulkProgress}</p>
                                    <p className="text-sm text-slate-400 mt-2">This may take a while for large files...</p>
                                </div>
                            )}

                            {!bulkUploading && (
                                <>
                                    {/* Summary */}
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-4 bg-green-50 rounded-xl text-center">
                                            <p className="text-2xl font-bold text-green-700">{bulkResults.length}</p>
                                            <p className="text-sm text-green-600">Successful</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-red-50 rounded-xl text-center">
                                            <p className="text-2xl font-bold text-red-700">{bulkErrors.length}</p>
                                            <p className="text-sm text-red-600">Errors</p>
                                        </div>
                                    </div>

                                    {/* Success List */}
                                    {bulkResults.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Created Products</h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {bulkResults.map((r, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                                        <CheckCircle size={14} />
                                                        <span className="truncate">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Error List */}
                                    {bulkErrors.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Errors</h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {bulkErrors.map((err, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                                                        <XCircle size={14} className="flex-shrink-0 mt-0.5" />
                                                        <span>{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {!bulkUploading && (
                            <div className="p-6 border-t border-gray-100">
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchProducts();
                }}
            />
        </div>
    );
}
