'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProductQueueStore } from '@/lib/productQueueStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle, Clock, Package, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';
import CreateProductModal from '@/components/admin/CreateProductModal';

export default function AdminProductManager() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { queue, clearQueue } = useProductQueueStore();
    const [liveProducts, setLiveProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

            // Remove from local state immediately
            setLiveProducts(prev => prev.filter(p => p.node.id !== id));

            // Show success toast (optional, but good UX)
            alert(`"${title}" deleted successfully.`);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete product.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Simple CSV Parser
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            let addedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                // Handle basic CSV splitting (not robust for commas in quotes, but works for simple data)
                const values = lines[i].split(',');
                const row: any = {};
                headers.forEach((h, index) => {
                    row[h] = values[index]?.trim();
                });

                if (row.title && row.price) {
                    // Add to Queue
                    queue.push({ // Direct push won't trigger store update, use action
                        // Actually we need to call addToQueue from store
                        // But we can't call it inside loop easily if it triggers state updates? 
                        // Zustand is fine with it.
                    } as any);

                    // Parse colors/sizes if present
                    const colors = row.colors ? row.colors.split('|').map((c: string) => ({ name: c.trim(), hex: '#000000' })) : [];
                    const sizes = row.sizes ? row.sizes.split('|').map((s: string) => s.trim()) : [];

                    useProductQueueStore.getState().addToQueue({
                        title: row.title,
                        price: row.price,
                        description: row.description || "",
                        files: [], // No images for CSV upload yet
                        colors,
                        sizes
                    });
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                alert(`Added ${addedCount} products to the queue!`);
            } else {
                alert("No valid products found in CSV. Ensure headers are: title, price, description, colors, sizes");
            }

            // Reset input
            e.target.value = '';
        };
        reader.readAsText(file);
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-lora font-medium text-slate-900">Product Manager</h1>
                        <p className="text-slate-500 mt-1">Manage your inventory and track uploads</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-900 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
                            <Package size={18} />
                            Bulk Upload CSV
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="text-slate-900" size={24} />
                            <h2 className="text-2xl font-lora font-medium text-slate-900">Live Inventory</h2>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                {liveProducts.length}
                            </span>
                        </div>
                        <button
                            onClick={fetchProducts}
                            disabled={loadingProducts}
                            className="p-2 hover:bg-white rounded-full transition-colors text-slate-600 hover:text-slate-900"
                            title="Refresh Inventory"
                        >
                            <RefreshCw size={20} className={loadingProducts ? "animate-spin" : ""} />
                        </button>
                    </div>

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
                                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 relative"
                                >
                                    <Link href={`/products/${product.node.slug || product.node.handle}`}>
                                        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                                            {/* Video Layer */}
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

                                            {/* Image Layer - Shows if no video, or underneath video (though video covers it) */}
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

                                    {/* Delete Button */}
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

                                    <div className="p-4">
                                        <h3 className="font-medium text-slate-900 truncate mb-1">{product.node.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-500">
                                                {product.node.priceRange?.minVariantPrice?.amount
                                                    ? `₹${product.node.priceRange.minVariantPrice.amount}`
                                                    : 'Price not set'}
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
