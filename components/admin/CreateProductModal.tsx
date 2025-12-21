import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Plus, Trash2, Palette, Ruler, GripVertical } from "lucide-react";
import Image from "next/image";
import FileInput from "@/components/admin/FileInput";
import { useProductQueueStore } from "@/lib/productQueueStore";

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (product: any) => void;
}

interface Color {
    name: string;
    hex: string;
}

const PRESET_COLORS = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#DC2626" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Green", hex: "#16A34A" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Purple", hex: "#9333EA" },
    { name: "Gray", hex: "#6B7280" },
    { name: "Beige", hex: "#D4C5B0" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export default function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [customColorName, setCustomColorName] = useState("");
    const [customColorHex, setCustomColorHex] = useState("#000000");
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const { addToQueue } = useProductQueueStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            const newFiles = [...files, ...selectedFiles];
            setFiles(newFiles);

            const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls([...previewUrls, ...newUrls]);
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);

        const newUrls = [...previewUrls];
        URL.revokeObjectURL(newUrls[index]);
        newUrls.splice(index, 1);
        setPreviewUrls(newUrls);
    };

    const removeVideo = () => {
        setVideoFile(null);
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
            setVideoPreviewUrl(null);
        }
        if (videoInputRef.current) {
            videoInputRef.current.value = "";
        }
    };

    // Drag and drop handlers for image reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        // Reorder files and preview URLs
        const newFiles = [...files];
        const newUrls = [...previewUrls];

        const draggedFile = newFiles[draggedIndex];
        const draggedUrl = newUrls[draggedIndex];

        // Remove from old position
        newFiles.splice(draggedIndex, 1);
        newUrls.splice(draggedIndex, 1);

        // Insert at new position
        newFiles.splice(index, 0, draggedFile);
        newUrls.splice(index, 0, draggedUrl);

        setFiles(newFiles);
        setPreviewUrls(newUrls);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const addPresetColor = (color: Color) => {
        if (!colors.find(c => c.hex === color.hex)) {
            setColors([...colors, color]);
        }
    };

    const addCustomColor = () => {
        if (customColorName && !colors.find(c => c.hex === customColorHex)) {
            setColors([...colors, { name: customColorName, hex: customColorHex }]);
            setCustomColorName("");
            setCustomColorHex("#000000");
        }
    };

    const removeColor = (hex: string) => {
        setColors(colors.filter(c => c.hex !== hex));
    };

    const toggleSize = (size: string) => {
        if (sizes.includes(size)) {
            setSizes(sizes.filter(s => s !== size));
        } else {
            setSizes([...sizes, size]);
        }
    };

    const resetForm = () => {
        setTitle("");
        setPrice("");
        setDescription("");
        setFiles([]);
        setPreviewUrls([]);
        setVideoFile(null);
        setVideoPreviewUrl(null);
        setColors([]);
        setSizes([]);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price || files.length === 0) {
            setError("Please fill in title, price, and upload at least one image");
            return;
        }

        setLoading(true);
        setError("");
        setUploadProgress("Preparing uploads...");

        try {
            // Helper function to upload a single file to R2
            const uploadFileToR2 = async (file: File, folder: string = "products"): Promise<string> => {
                // Step 1: Get presigned URL from our API
                const presignRes = await fetch("/api/r2/presign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        folder,
                    }),
                });

                if (!presignRes.ok) {
                    const err = await presignRes.json();
                    throw new Error(err.error || "Failed to get upload URL");
                }

                const { uploadUrl, publicUrl } = await presignRes.json();

                // Step 2: Upload file directly to R2 (bypasses Vercel limits)
                const uploadRes = await fetch(uploadUrl, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": file.type,
                    },
                });

                if (!uploadRes.ok) {
                    throw new Error(`Failed to upload ${file.name} to storage`);
                }

                return publicUrl;
            };

            // Upload all images to R2
            const imageUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                setUploadProgress(`Uploading image ${i + 1}/${files.length}...`);
                const url = await uploadFileToR2(files[i], "products");
                imageUrls.push(url);
            }

            // Upload video if provided
            let videoUrl: string | undefined;
            if (videoFile) {
                setUploadProgress("Uploading video...");
                videoUrl = await uploadFileToR2(videoFile, "videos");
            }

            setUploadProgress("Creating product...");

            // Now send just the URLs to the API (no file data)
            const res = await fetch("/api/products/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    price,
                    description,
                    imageUrls,
                    videoUrl,
                    colors: colors.length > 0 ? colors : undefined,
                    sizes: sizes.length > 0 ? sizes : undefined,
                }),
            });

            // Handle non-JSON responses (e.g. HTML error pages from proxies)
            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON Response:", text.substring(0, 500)); // Log first 500 chars
                // Try to extract a meaningful error if it's HTML
                const titleMatch = text.match(/<title>(.*?)<\/title>/i);
                throw new Error(
                    `Server returned ${res.status} ${res.statusText} (${titleMatch ? titleMatch[1] : "Not proper JSON"}). Potential proxy/firewall block.`
                );
            }

            if (!res.ok) throw new Error(data.error || "Failed to create product");

            onSuccess(data.product);
            onClose();
            resetForm();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
            setUploadProgress("");
        }
    };

    const handleAddToQueue = () => {
        if (!title || !price || files.length === 0) {
            setError("Please fill in title, price, and upload at least one image");
            return;
        }

        addToQueue({
            title,
            price,
            description,
            files,
            colors,
            sizes,
        });

        // Show success message
        alert(`"${title}" has been added to the background queue!`);

        onClose();
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-lora font-medium text-slate-900">Create New Product</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-full transition-all duration-200 hover:scale-110"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Basic Information</h3>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter product name..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your product..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 min-h-[100px] resize-y"
                                />
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={18} className="text-slate-600" />
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Product Images</h3>
                                <span className="text-red-500">*</span>
                            </div>

                            {previewUrls.length === 0 ? (
                                <FileInput
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    maxSizeInMB={10}
                                    allowMultiple={true}
                                    onFileChange={async (selectedFiles) => {
                                        const filesArray = Array.from(selectedFiles);
                                        setFiles([...files, ...filesArray]);
                                        const newUrls = filesArray.map(file => URL.createObjectURL(file));
                                        setPreviewUrls([...previewUrls, ...newUrls]);
                                    }}
                                />
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {previewUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 cursor-move transition-all duration-200 ${draggedIndex === index
                                                ? 'border-slate-900 scale-95 opacity-50'
                                                : 'border-gray-200 hover:border-slate-400'
                                                }`}
                                        >
                                            {/* Drag Handle */}
                                            <div className="absolute top-1 left-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                                <GripVertical size={14} />
                                            </div>

                                            {/* Position Badge */}
                                            <div className={`absolute bottom-1 left-1 px-2 py-0.5 text-[10px] font-bold rounded z-10 ${index === 0
                                                ? 'bg-emerald-500 text-white'
                                                : index === 1
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-700 text-white'
                                                }`}>
                                                {index === 0 ? 'DISPLAY' : index === 1 ? 'HOVER' : `#${index + 1}`}
                                            </div>

                                            <Image
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                fill
                                                className="object-cover pointer-events-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-slate-900 group"
                                    >
                                        <Upload size={24} className="group-hover:scale-110 transition-transform duration-200" />
                                        <span className="text-xs font-medium">Add More</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            )}
                            <p className="text-xs text-gray-500">💡 Drag to reorder — 1st image is display, 2nd is hover effect</p>
                        </div>

                        {/* Video Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon size={18} className="text-slate-600" />
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Product Video (Optional)</h3>
                            </div>

                            {!videoPreviewUrl ? (
                                <div
                                    onClick={() => videoInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 group"
                                >
                                    <Upload size={32} className="mx-auto text-gray-400 group-hover:text-slate-900 mb-2 transition-colors duration-200" />
                                    <p className="text-sm font-medium text-gray-600 group-hover:text-slate-900">Click to upload video</p>
                                    <p className="text-xs text-gray-500 mt-1">MP4, WebM (Max 50MB)</p>
                                    <input
                                        ref={videoInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border-2 border-gray-200">
                                    <video
                                        src={videoPreviewUrl}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                    <button
                                        type="button"
                                        onClick={removeVideo}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Colors Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Palette size={18} className="text-slate-600" />
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Available Colors</h3>
                            </div>

                            {/* Preset Colors */}
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.hex}
                                        type="button"
                                        onClick={() => addPresetColor(color)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${colors.find(c => c.hex === color.hex)
                                            ? 'border-slate-900 bg-slate-50'
                                            : 'border-gray-200 hover:border-slate-400'
                                            }`}
                                        title={color.name}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{color.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Color */}
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Custom Color Name</label>
                                    <input
                                        type="text"
                                        value={customColorName}
                                        onChange={(e) => setCustomColorName(e.target.value)}
                                        placeholder="Navy Blue"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Hex</label>
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addCustomColor}
                                    disabled={!customColorName}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            {/* Selected Colors */}
                            {colors.length > 0 && (
                                <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-medium text-slate-600 mb-3">Selected Colors ({colors.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => (
                                            <div
                                                key={color.hex}
                                                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 group"
                                            >
                                                <div
                                                    className="w-5 h-5 rounded-full border-2 border-gray-300"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <span className="text-sm font-medium text-slate-700">{color.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeColor(color.hex)}
                                                    className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sizes Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Ruler size={18} className="text-slate-600" />
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Available Sizes</h3>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {SIZE_OPTIONS.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => toggleSize(size)}
                                        className={`py-3 px-4 rounded-lg border-2 font-medium transition-all duration-200 hover:scale-105 ${sizes.includes(size)
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-gray-300 hover:border-slate-900'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {sizes.length > 0 && (
                                <p className="text-xs text-slate-600">Selected: {sizes.join(", ")}</p>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="pt-4 border-t space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (uploadProgress || "Creating Product...") : "Create Now"}
                            </button>

                            <button
                                type="button"
                                onClick={handleAddToQueue}
                                disabled={loading}
                                className="w-full py-4 bg-white text-slate-900 border-2 border-slate-900 rounded-xl font-medium hover:bg-slate-50 disabled:bg-gray-100 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Add to Background Queue
                            </button>

                            <p className="text-xs text-center text-gray-500">
                                Queue products to continue working while they're created in the background
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
