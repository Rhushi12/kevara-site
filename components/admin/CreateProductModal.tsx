import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (product: any) => void;
}

export default function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            const newFiles = [...files, ...selectedFiles];
            setFiles(newFiles);

            const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls([...previewUrls, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);

        const newUrls = [...previewUrls];
        URL.revokeObjectURL(newUrls[index]); // Cleanup
        newUrls.splice(index, 1);
        setPreviewUrls(newUrls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price || files.length === 0) {
            setError("Please fill in all required fields and upload at least one image");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("price", price);
            formData.append("description", description);
            files.forEach(file => formData.append("images", file));

            const res = await fetch("/api/products/create", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create product");

            onSuccess(data.product);
            onClose();
            // Reset form
            setTitle("");
            setPrice("");
            setDescription("");
            setFiles([]);
            setPreviewUrls([]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-lora font-medium">Create New Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Image Upload */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">Product Images *</label>

                                {/* Image Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 group">
                                            <Image
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Upload Button */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#006D77] hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="bg-gray-100 p-3 rounded-full mb-2">
                                            <Upload className="text-gray-400" size={20} />
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium text-center px-2">Add Image</p>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WEBP</p>
                            </div>

                            {/* Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Summer Linen Dress"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR) *</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. 2499"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Product description..."
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Product"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
