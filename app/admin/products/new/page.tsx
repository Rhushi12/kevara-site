"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Upload, X, Plus, Palette, Ruler, GripVertical, Trash2,
    Package, RotateCcw, Video, ImageIcon, ChevronDown, ChevronUp
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { Suspense } from "react";

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

const SIZE_OPTIONS = ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

/** Maps image position to its role label + color */
function getImageLabel(index: number): { label: string; description: string; color: string; bgColor: string } {
    switch (index) {
        case 0:
            return {
                label: "FRONT / DISPLAY",
                description: "Main product image shown on cards & listings",
                color: "text-emerald-700",
                bgColor: "bg-emerald-50 border-emerald-200"
            };
        case 1:
            return {
                label: "HOVER / BACK",
                description: "Shown on hover on product cards",
                color: "text-blue-700",
                bgColor: "bg-blue-50 border-blue-200"
            };
        default:
            return {
                label: `GALLERY #${index + 1}`,
                description: "Additional product image for gallery",
                color: "text-slate-700",
                bgColor: "bg-slate-50 border-slate-200"
            };
    }
}

function CreateProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("return_to");

    // Basic info
    const [title, setTitle] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");

    // Images
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Video
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Colors
    const [colors, setColors] = useState<Color[]>([]);
    const [customColorName, setCustomColorName] = useState("");
    const [customColorHex, setCustomColorHex] = useState("#000000");

    // Sizes & Stock
    const [sizes, setSizes] = useState<string[]>([]);
    const [variantStock, setVariantStock] = useState<Record<string, number>>({});

    // Return policy
    const [returnDays, setReturnDays] = useState(30);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [error, setError] = useState("");
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        images: true,
        video: false,
        colors: false,
        sizes: true,
        stock: true,
        returns: false,
    });

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Calculate total stock across all sizes
    const totalStock = Object.values(variantStock).reduce((sum, v) => sum + v, 0);

    // ─── Image Handlers ─────────────────────────────────────────────

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages((prev) => [...prev, ...newFiles]);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDragStart = (index: number) => setDraggedIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFiles = [...images];
        const newUrls = [...previews];
        const draggedFile = newFiles[draggedIndex];
        const draggedUrl = newUrls[draggedIndex];

        newFiles.splice(draggedIndex, 1);
        newUrls.splice(draggedIndex, 1);
        newFiles.splice(index, 0, draggedFile);
        newUrls.splice(index, 0, draggedUrl);

        setImages(newFiles);
        setPreviews(newUrls);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    // ─── Video Handlers ─────────────────────────────────────────────

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
            setVideoPreviewUrl(null);
        }
        if (videoInputRef.current) videoInputRef.current.value = "";
    };

    // ─── Color Handlers ─────────────────────────────────────────────

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

    const removeColor = (hex: string) => setColors(colors.filter(c => c.hex !== hex));

    // ─── Size Handlers ──────────────────────────────────────────────

    const toggleSize = (size: string) => {
        if (sizes.includes(size)) {
            setSizes(sizes.filter(s => s !== size));
            const newStock = { ...variantStock };
            delete newStock[size];
            setVariantStock(newStock);
        } else {
            setSizes([...sizes, size]);
            setVariantStock({ ...variantStock, [size]: 0 });
        }
    };

    // ─── Submit ─────────────────────────────────────────────────────

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title || !price || images.length === 0) {
            setError("Please fill in title, price, and upload at least one image");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setUploadProgress("Preparing uploads...");

        try {
            const uploadFileToR2 = async (file: File, folder: string = "products"): Promise<string> => {
                const presignRes = await adminFetch("/api/r2/presign", {
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

                const uploadRes = await fetch(uploadUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                });

                if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name} to storage`);
                return publicUrl;
            };

            // Upload images
            const imageUrls: string[] = [];
            for (let i = 0; i < images.length; i++) {
                setUploadProgress(`Uploading image ${i + 1}/${images.length}...`);
                const url = await uploadFileToR2(images[i], "products");
                imageUrls.push(url);
            }

            // Upload video if provided
            let videoUrl: string | undefined;
            if (videoFile) {
                setUploadProgress("Uploading video...");
                videoUrl = await uploadFileToR2(videoFile, "videos");
            }

            setUploadProgress("Creating product...");

            const finalTitle = batchNumber.trim() ? `${title.trim()} (${batchNumber.trim()})` : title.trim();

            const res = await adminFetch("/api/products/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: finalTitle,
                    price,
                    description,
                    imageUrls,
                    videoUrl,
                    colors: colors.length > 0 ? colors : undefined,
                    sizes: sizes.length > 0 ? sizes : undefined,
                    variantStock: Object.keys(variantStock).length > 0 ? variantStock : undefined,
                    returnDays,
                }),
            });

            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                const titleMatch = text.match(/<title>(.*?)<\/title>/i);
                throw new Error(
                    `Server returned ${res.status} ${res.statusText} (${titleMatch ? titleMatch[1] : "Not proper JSON"}).`
                );
            }

            if (!res.ok) throw new Error(data.error || "Failed to create product");

            alert("Product created successfully!");

            if (returnTo) {
                router.push(returnTo);
            } else {
                router.push("/admin/products");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
            setUploadProgress("");
        }
    };

    // ─── Section Header component ───────────────────────────────────

    const SectionHeader = ({ id, icon: Icon, title, subtitle, required }: {
        id: string;
        icon: any;
        title: string;
        subtitle?: string;
        required?: boolean;
    }) => (
        <button
            type="button"
            onClick={() => toggleSection(id)}
            className="w-full flex items-center gap-3 group"
        >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                <Icon size={18} />
            </div>
            <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    {title}
                    {required && <span className="text-red-500 text-base">*</span>}
                </h3>
                {subtitle && <p className="text-xs text-slate-400 font-normal normal-case mt-0.5">{subtitle}</p>}
            </div>
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                {expandedSections[id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
        </button>
    );

    return (
        <main className="min-h-screen bg-[#FAFAF9]">
            <Navbar />

            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-lora font-medium text-slate-900">Create New Product</h1>
                        {title && (
                            <span className="text-sm text-slate-400 hidden sm:inline">— {title}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isSubmitting && uploadProgress && (
                            <span className="text-sm text-slate-500 animate-pulse hidden sm:inline">
                                {uploadProgress}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSubmitting ? "Creating..." : "Publish Product"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="container mx-auto px-4 mt-4">
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg text-sm animate-in fade-in slide-in-from-left-2 duration-300 flex items-center justify-between">
                        <p className="font-medium">{error}</p>
                        <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8 mb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ═══ LEFT COLUMN: Image Gallery ═══════════════════════════ */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Image Upload Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <SectionHeader id="images" icon={ImageIcon} title="Product Images" subtitle="First image is the main display, second is the hover image" required />

                            {expandedSections.images && (
                                <div className="mt-5 space-y-4">
                                    {/* Image role legend */}
                                    <div className="flex flex-wrap gap-3 text-xs">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="font-medium text-emerald-700">1st = Front / Display Image</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-200">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="font-medium text-blue-700">2nd = Hover / Back Image</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200">
                                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                                            <span className="font-medium text-slate-600">3+ = Gallery Images</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {previews.map((src, index) => {
                                            const labelInfo = getImageLabel(index);
                                            return (
                                                <div
                                                    key={index}
                                                    draggable
                                                    onDragStart={() => handleDragStart(index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`relative group aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border-2 cursor-move transition-all duration-200 ${
                                                        draggedIndex === index
                                                            ? 'border-slate-900 scale-95 opacity-50'
                                                            : 'border-gray-200 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {/* Drag handle */}
                                                    <div className="absolute top-2 left-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 backdrop-blur-sm">
                                                        <GripVertical size={14} />
                                                    </div>

                                                    {/* Role badge */}
                                                    <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 z-10 ${labelInfo.bgColor} border-t`}>
                                                        <p className={`text-[10px] font-bold tracking-wider ${labelInfo.color}`}>
                                                            {labelInfo.label}
                                                        </p>
                                                        <p className="text-[9px] text-slate-500 mt-0.5">{labelInfo.description}</p>
                                                    </div>

                                                    <Image
                                                        src={src}
                                                        alt={labelInfo.label}
                                                        fill
                                                        className="object-cover pointer-events-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10 shadow-lg"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Upload Placeholder */}
                                        <label className="relative aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-slate-900 transition-all duration-200 group">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <div className="bg-gray-200 p-4 rounded-full mb-4 group-hover:bg-slate-300 transition-colors">
                                                <Plus size={24} className="text-gray-500 group-hover:text-slate-800" />
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium group-hover:text-slate-800">Add Images</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP</span>
                                        </label>
                                    </div>

                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        💡 <span>Drag images to reorder. The order determines their role on the storefront.</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Video Upload Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <SectionHeader id="video" icon={Video} title="Product Video" subtitle="Optional — shown on the product detail page" />

                            {expandedSections.video && (
                                <div className="mt-5">
                                    {!videoPreviewUrl ? (
                                        <div
                                            onClick={() => videoInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 group"
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
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border-2 border-gray-200">
                                            <video src={videoPreviewUrl} className="w-full h-full object-cover" controls />
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
                            )}
                        </div>
                    </div>

                    {/* ═══ RIGHT COLUMN: Product Details ════════════════════════ */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="lg:sticky lg:top-24 space-y-6">

                            {/* Basic Information */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <SectionHeader id="basic" icon={Package} title="Basic Information" required />

                                {expandedSections.basic && (
                                    <div className="mt-5 space-y-5">
                                        {/* Title & Batch */}
                                        <div className="flex gap-3">
                                            <div className="flex-[3]">
                                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                                    Product Title <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="e.g. Linen Summer Dress"
                                                    className="w-full text-2xl font-lora border-b-2 border-gray-200 focus:border-slate-900 outline-none py-2 placeholder:text-gray-300 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                                    Batch #
                                                </label>
                                                <input
                                                    type="text"
                                                    value={batchNumber}
                                                    onChange={(e) => setBatchNumber(e.target.value)}
                                                    placeholder="e.g. 1"
                                                    className="w-full text-lg font-medium border-b-2 border-gray-200 focus:border-slate-900 outline-none py-2 placeholder:text-gray-300 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                                Price (INR) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center">
                                                <span className="text-xl mr-2 text-slate-600">₹</span>
                                                <input
                                                    type="text"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    placeholder="0.00 or 100-200"
                                                    className="w-full text-xl font-medium border-b-2 border-gray-200 focus:border-slate-900 outline-none py-2 transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                                Description
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Describe your product..."
                                                rows={4}
                                                className="w-full text-base text-gray-600 border border-gray-200 rounded-lg p-4 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none resize-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sizes Section */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <SectionHeader id="sizes" icon={Ruler} title="Available Sizes" subtitle="Select all sizes this product comes in" />

                                {expandedSections.sizes && (
                                    <div className="mt-5 space-y-4">
                                        <div className="grid grid-cols-4 gap-2">
                                            {SIZE_OPTIONS.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => toggleSize(size)}
                                                    className={`py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 hover:scale-105 ${
                                                        sizes.includes(size)
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                            : 'bg-white text-slate-700 border-gray-300 hover:border-slate-900'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                        {sizes.length > 0 && (
                                            <p className="text-xs text-slate-500">
                                                Selected: <span className="font-medium text-slate-700">{sizes.join(", ")}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stock Per Size Section */}
                            {sizes.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <SectionHeader
                                        id="stock"
                                        icon={Package}
                                        title="Stock Per Size"
                                        subtitle="Set inventory count for each selected size"
                                    />

                                    {expandedSections.stock && (
                                        <div className="mt-5 space-y-4">
                                            {/* Per-size stock inputs */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {sizes.map((size) => (
                                                    <div key={size} className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                        <span className="text-sm font-bold text-slate-800 min-w-[36px]">{size}</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={variantStock[size] ?? 0}
                                                            onChange={(e) => setVariantStock({ ...variantStock, [size]: parseInt(e.target.value) || 0 })}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 w-full"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-xs text-slate-400">qty</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Total Stock Summary */}
                                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-300 uppercase tracking-wider font-medium">Total Stock (All Sizes)</p>
                                                        <p className="text-3xl font-bold mt-1">{totalStock}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-300">Across</p>
                                                        <p className="text-lg font-semibold">{sizes.length} size{sizes.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                {totalStock === 0 && (
                                                    <p className="text-xs text-amber-300 mt-3 flex items-center gap-1.5">
                                                        ⚠️ All sizes have zero stock. Product will show as &quot;Out of Stock&quot;.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Colors Section */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <SectionHeader id="colors" icon={Palette} title="Available Colors" subtitle="Optional — select or add custom colors" />

                                {expandedSections.colors && (
                                    <div className="mt-5 space-y-4">
                                        {/* Preset colors */}
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_COLORS.map((color) => (
                                                <button
                                                    key={color.hex}
                                                    type="button"
                                                    onClick={() => addPresetColor(color)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-sm ${
                                                        colors.find(c => c.hex === color.hex)
                                                            ? 'border-slate-900 bg-slate-50 shadow-sm'
                                                            : 'border-gray-200 hover:border-slate-400'
                                                    }`}
                                                    title={color.name}
                                                >
                                                    <div
                                                        className="w-5 h-5 rounded-full border-2 border-gray-300"
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    <span className="font-medium text-slate-700">{color.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Custom color */}
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
                                                    className="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addCustomColor}
                                                disabled={!customColorName}
                                                className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
                                            >
                                                <Plus size={14} />
                                                Add
                                            </button>
                                        </div>

                                        {/* Selected colors */}
                                        {colors.length > 0 && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <p className="text-xs font-medium text-slate-600 mb-2">Selected Colors ({colors.length})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {colors.map((color) => (
                                                        <div
                                                            key={color.hex}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 group"
                                                        >
                                                            <div
                                                                className="w-4 h-4 rounded-full border-2 border-gray-300"
                                                                style={{ backgroundColor: color.hex }}
                                                            />
                                                            <span className="text-sm font-medium text-slate-700">{color.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeColor(color.hex)}
                                                                className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Return Policy */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <SectionHeader id="returns" icon={RotateCcw} title="Return Policy" subtitle="Set return window for this product" />

                                {expandedSections.returns && (
                                    <div className="mt-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                                    Return Window (Days)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="365"
                                                    value={returnDays}
                                                    onChange={(e) => setReturnDays(parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">
                                            Number of days after delivery within which customers can request a return. Set to 0 for non-returnable items.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Note */}
                            <div className="pt-2 pb-6">
                                <p className="text-xs text-gray-400 text-center">
                                    * Images will be uploaded to Kevara&apos;s storage (Cloudflare R2) and optimized.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

export default function CreateProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CreateProductContent />
        </Suspense>
    );
}
