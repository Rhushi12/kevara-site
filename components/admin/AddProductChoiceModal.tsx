import { X, Search, Plus } from "lucide-react";

interface AddProductChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectExisting: () => void;
    onCreateNew: () => void;
}

export default function AddProductChoiceModal({ isOpen, onClose, onSelectExisting, onCreateNew }: AddProductChoiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-lora font-medium mb-2">Add Product</h2>
                    <p className="text-gray-500 mb-8">Choose how you want to add a product to this section.</p>

                    <div className="space-y-4">
                        <button
                            onClick={onSelectExisting}
                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-black hover:bg-gray-50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <Search size={24} className="text-gray-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-medium">Select Existing</h3>
                                    <p className="text-sm text-gray-500">Choose from your Shopify catalog</p>
                                </div>
                            </div>
                            <div className="text-gray-400 group-hover:text-black transition-colors">→</div>
                        </button>

                        <button
                            onClick={onCreateNew}
                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-[#006D77] hover:bg-[#006D77]/5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-[#006D77]/10 p-3 rounded-lg group-hover:bg-[#006D77] group-hover:text-white transition-all">
                                    <Plus size={24} className="text-[#006D77] group-hover:text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-medium text-[#006D77]">Create New Product</h3>
                                    <p className="text-sm text-gray-500">Upload image and create instantly</p>
                                </div>
                            </div>
                            <div className="text-[#006D77] group-hover:translate-x-1 transition-transform">→</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
