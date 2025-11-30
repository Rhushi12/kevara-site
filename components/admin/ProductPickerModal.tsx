import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";

interface ProductPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedProducts: any[]) => void;
    initialSelection?: string[]; // Array of product IDs
}

export default function ProductPickerModal({ isOpen, onClose, onSelect, initialSelection = [] }: ProductPickerModalProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelection));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && products.length === 0) {
            fetchProducts();
        }
        if (isOpen) {
            setSelectedIds(new Set(initialSelection));
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data.products);
        } catch (err) {
            setError("Failed to load products");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (product: any) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(product.node.id)) {
            newSelected.delete(product.node.id);
        } else {
            newSelected.add(product.node.id);
        }
        setSelectedIds(newSelected);
    };

    const handleConfirm = () => {
        // Filter products to return full objects of selected IDs
        // Maintain order of selection if possible, or just list order
        const selectedProducts = products.filter(p => selectedIds.has(p.node.id));
        onSelect(selectedProducts);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-lora font-medium">Select Products</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map((product) => {
                                const isSelected = selectedIds.has(product.node.id);
                                return (
                                    <div
                                        key={product.node.id}
                                        onClick={() => toggleSelection(product)}
                                        className={`relative group cursor-pointer border rounded-lg overflow-hidden transition-all ${isSelected ? 'ring-2 ring-green-500 border-green-500' : 'hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="relative aspect-[3/4] bg-gray-100">
                                            {product.node.images.edges[0]?.node.url && (
                                                <Image
                                                    src={product.node.images.edges[0].node.url}
                                                    alt={product.node.images.edges[0].node.altText || product.node.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="200px"
                                                />
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                    <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                                                        <Check size={20} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-white">
                                            <h3 className="text-sm font-medium truncate" title={product.node.title}>
                                                {product.node.title}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {product.node.priceRange.minVariantPrice.currencyCode} {product.node.priceRange.minVariantPrice.amount}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                        {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                        >
                            Add Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
