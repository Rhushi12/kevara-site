"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, Plus, Pipette, Save, Hash, Users, FolderTree, Image as ImageIcon, Upload, Trash2, GripVertical } from "lucide-react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";
import { parseProductTitle } from "@/lib/productUtils";

interface EditableProduct {
    id: string;
    handle: string;
    title: string;
    descriptionHtml?: string;
    priceRange?: {
        minVariantPrice?: {
            amount: string;
            currencyCode: string;
        };
    };
    colors?: { name: string; hex: string }[];
    sizes?: string[];
    variantPrices?: Record<string, string>;
    status?: string;
    returnDays?: number;
    imageUrls?: string[];
    variantImages?: Record<string, string[]>;
}

interface ImageItem {
    id: string;
    url: string;
    file?: File;
    isExisting: boolean;
}

interface ProductEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** Single product edit */
    product?: EditableProduct | null;
    /** Bulk edit: array of products to update together */
    bulkProducts?: EditableProduct[];
}

const SIZE_OPTIONS = ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "FREE SIZE"];

// Extend Window interface for EyeDropper API
declare global {
    interface Window {
        EyeDropper: any;
    }
}

export default function ProductEditModal({ isOpen, onClose, onSuccess, product, bulkProducts }: ProductEditModalProps) {
    const isBulkMode = !!(bulkProducts && bulkProducts.length > 0);
    const effectiveProduct = isBulkMode ? bulkProducts![0] : product;

    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState("");
    const [batchNumber, setBatchNumber] = useState(""); // Extracted from title
    const [titleSuffix, setTitleSuffix] = useState(""); // For bulk appending
    
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [returnDays, setReturnDays] = useState(30);
    const [sizes, setSizes] = useState<string[]>([]);
    const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});
    const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
    const [tempColor, setTempColor] = useState({ name: "", hex: "#000000" });
    const [recentColors, setRecentColors] = useState<{ name: string; hex: string }[]>([]);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [variantImagesState, setVariantImagesState] = useState<Record<string, ImageItem[]>>({});
    const [selectedColorForImages, setSelectedColorForImages] = useState<string | null>(null);

    // Derived state for the currently selected color's images
    const images = selectedColorForImages ? (variantImagesState[selectedColorForImages] || []) : [];

    const setImages = (newImages: ImageItem[]) => {
        if (!selectedColorForImages) return;
        setVariantImagesState(prev => ({
            ...prev,
            [selectedColorForImages]: newImages
        }));
    };

    // In bulk mode, checkboxes control which fields get applied
    const [editFields, setEditFields] = useState({
        title: false,
        batchNumber: false,
        description: false,
        price: false,
        status: false,
        returnDays: false,
        sizes: false,
        variantPrices: false,
        colors: false,
        images: false,
    });

    // Load recent colors from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("kevara_recent_colors");
        if (saved) {
            try {
                setRecentColors(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent colors");
            }
        }
    }, []);

    // Pre-populate fields when product/bulkProducts changes
    useEffect(() => {
        if (isBulkMode) {
            // Bulk mode: start empty, admin opts-in to each field
            setTitle("");
            setBatchNumber("");
            setTitleSuffix("");
            setDescription("");
            setPrice("");
            setStatus("ACTIVE");
            setReturnDays(30);
            setSizes([]);
            setVariantPrices({});
            setColors([]);
            setVariantImagesState({});
            setSelectedColorForImages(null);
            setEditFields({
                title: false,
                batchNumber: false,
                description: false,
                price: false,
                status: false,
                returnDays: false,
                sizes: false,
                variantPrices: false,
                colors: false,
                images: false,
            });
            setSaveMessage(null);
        } else if (product) {
            // Single mode: pre-fill from product
            const parsed = parseProductTitle(product.title || "");
            setTitle(parsed.cleanTitle);
            setBatchNumber(parsed.batchNumber || "");
            
            setTitleSuffix("");
            setDescription(product.descriptionHtml || "");
            setPrice(product.priceRange?.minVariantPrice?.amount || "");
            setStatus(product.status || "ACTIVE");
            setReturnDays(product.returnDays ?? 30);
            setSizes(product.sizes || []);
            setVariantPrices(product.variantPrices || {});
            setColors(product.colors?.map(c => ({ ...c })) || []);
            
            // Build initial variantImagesState
            const initialVariantImages: Record<string, ImageItem[]> = {};
            if (product.variantImages && Object.keys(product.variantImages).length > 0) {
                Object.entries(product.variantImages).forEach(([color, urls]) => {
                    initialVariantImages[color] = urls.map((url, i) => ({
                        id: `existing-${Date.now()}-${i}-${color}`,
                        url,
                        isExisting: true
                    }));
                });
            } else if (product.imageUrls && product.imageUrls.length > 0 && product.colors && product.colors.length > 0) {
                // Fallback for older products without variant_images map: map all existing images to the first color
                const firstColor = product.colors[0].name;
                initialVariantImages[firstColor] = product.imageUrls.map((url, i) => ({
                    id: `legacy-${Date.now()}-${i}`,
                    url,
                    isExisting: true
                }));
            }
            setVariantImagesState(initialVariantImages);
            
            // Auto-select the first color if available
            if (product.colors && product.colors.length > 0) {
                setSelectedColorForImages(product.colors[0].name);
            } else {
                setSelectedColorForImages(null);
            }
            
            // In single mode all fields are always active
            setEditFields({
                title: true,
                batchNumber: true,
                description: true,
                price: true,
                status: true,
                returnDays: true,
                sizes: true,
                variantPrices: true,
                colors: true,
                images: true,
            });
            setSaveMessage(null);
        }
    }, [product, bulkProducts, isBulkMode]);

    // Manage body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || (!product && !isBulkMode)) return null;

    // Image Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            const newItems: ImageItem[] = selectedFiles.map(file => ({
                id: `new-${Date.now()}-${Math.random()}`,
                url: URL.createObjectURL(file),
                file,
                isExisting: false
            }));
            setImages([...images, ...newItems]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        const removed = newImages.splice(index, 1)[0];
        if (!removed.isExisting) {
            URL.revokeObjectURL(removed.url);
        }
        setImages(newImages);
    };

    const handleDragStart = (index: number) => setDraggedIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newImages = [...images];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedItem);
        
        setImages(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const handleDropOnColor = (e: React.DragEvent, targetColorName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedIndex === null || !selectedColorForImages || selectedColorForImages === targetColorName) return;

        setVariantImagesState(prev => {
            const currentImages = [...(prev[selectedColorForImages] || [])];
            const movedImage = currentImages.splice(draggedIndex, 1)[0];
            
            const targetImages = [...(prev[targetColorName] || [])];
            targetImages.push(movedImage);

            return {
                ...prev,
                [selectedColorForImages]: currentImages,
                [targetColorName]: targetImages
            };
        });

        setDraggedIndex(null);
    };

    // ---- SAVE HANDLER ----
    const handleSave = async () => {
        setLoading(true);
        setSaveMessage(null);
        try {
            if (isBulkMode) {
                // Build the common update data from enabled fields
                const commonData: any = {};
                if (editFields.title) {
                    if (title) commonData.title = title;
                    if (titleSuffix) commonData.titleSuffix = titleSuffix;
                }
                if (editFields.batchNumber) {
                    commonData.batchNumber = batchNumber;
                }
                if (editFields.description) commonData.description = description;
                if (editFields.price && price) commonData.price = price;
                if (editFields.status) commonData.status = status;
                if (editFields.returnDays) commonData.returnDays = returnDays;
                if (editFields.sizes) {
                    commonData.sizes = sizes;
                    commonData.variantPrices = variantPrices;
                }
                if (editFields.colors) commonData.colors = colors;

                if (Object.keys(commonData).length === 0) {
                    setSaveMessage({ type: "error", text: "Enable at least one field and enter a value." });
                    setLoading(false);
                    return;
                }

                // Build items array: one entry per selected product
                const items = bulkProducts!.map(p => {
                    const item: any = { handle: p.handle };
                    
                    // Apply title and batch number logic
                    let currentParsed = parseProductTitle(p.title || "");
                    let baseTitle = currentParsed.cleanTitle;
                    let currentBatch = currentParsed.batchNumber;
                    
                    let titleChanged = false;

                    if (commonData.title || commonData.titleSuffix) {
                        baseTitle = commonData.title || baseTitle;
                        if (commonData.titleSuffix) baseTitle = `${baseTitle}${commonData.titleSuffix}`;
                        titleChanged = true;
                    }
                    if (editFields.batchNumber) {
                        currentBatch = commonData.batchNumber;
                        titleChanged = true;
                    }

                    if (titleChanged) {
                        item.title = currentBatch && currentBatch.trim() !== "" 
                            ? `${baseTitle.trim()} (${currentBatch.trim()})` 
                            : baseTitle.trim();
                    }

                    if (commonData.description !== undefined) item.description = commonData.description;
                    if (commonData.price) item.price = commonData.price;
                    if (commonData.status) item.status = commonData.status;
                    if (commonData.returnDays !== undefined) item.returnDays = commonData.returnDays;
                    if (commonData.sizes) {
                        item.sizes = commonData.sizes;
                        item.variantPrices = commonData.variantPrices;
                    }
                    if (commonData.colors) item.colors = commonData.colors;
                    return item;
                });

                const res = await fetch("/api/products", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to update products");
                }

                const result = await res.json();
                setSaveMessage({ type: "success", text: `Updated ${result.updatedCount} product${result.updatedCount !== 1 ? 's' : ''} successfully!` });
            } else {
                // Single product mode
                const payload: any = { handle: product!.handle };

                // Handle image uploads if any new images
                const finalVariantImages: Record<string, string[]> = {};
                let imagesChanged = false;

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

                    if (!uploadRes.ok) {
                        throw new Error(`Failed to upload ${file.name} to storage`);
                    }

                    return publicUrl;
                };

                // Sync the current `images` back to `variantImagesState` for the active color before saving
                const currentStateToSave = { ...variantImagesState };
                if (selectedColorForImages) {
                    currentStateToSave[selectedColorForImages] = images;
                }

                for (const [color, colorImages] of Object.entries(currentStateToSave)) {
                    finalVariantImages[color] = [];
                    for (let i = 0; i < colorImages.length; i++) {
                        const item = colorImages[i];
                        if (item.isExisting) {
                            finalVariantImages[color].push(item.url);
                        } else if (item.file) {
                            setSaveMessage({ type: "success", text: `Uploading image for ${color}...` });
                            const uploadedUrl = await uploadFileToR2(item.file);
                            finalVariantImages[color].push(uploadedUrl);
                            imagesChanged = true;
                        }
                    }
                }

                // Check if existing images were reordered or deleted
                const originalVariantImages = product!.variantImages || {};
                if (JSON.stringify(finalVariantImages) !== JSON.stringify(originalVariantImages)) {
                    imagesChanged = true;
                }

                if (imagesChanged) {
                    payload.variantImages = finalVariantImages;
                }

                const finalTitle = batchNumber.trim() ? `${title.trim()} (${batchNumber.trim()})` : title.trim();
                if (finalTitle !== (product!.title || "")) payload.title = finalTitle;

                if (description !== (product!.descriptionHtml || "")) payload.description = description;
                if (price !== (product!.priceRange?.minVariantPrice?.amount || "")) payload.price = price;
                if (status !== (product!.status || "ACTIVE")) payload.status = status;
                if (returnDays !== (product!.returnDays ?? 30)) payload.returnDays = returnDays;

                const origSizes = product!.sizes || [];
                if (JSON.stringify(sizes) !== JSON.stringify(origSizes)) payload.sizes = sizes;

                const origVariantPrices = product!.variantPrices || {};
                if (JSON.stringify(variantPrices) !== JSON.stringify(origVariantPrices)) payload.variantPrices = variantPrices;

                const origColors = product!.colors || [];
                if (JSON.stringify(colors) !== JSON.stringify(origColors)) payload.colors = colors;

                const changedKeys = Object.keys(payload).filter(k => k !== "handle");
                if (changedKeys.length === 0) {
                    setSaveMessage({ type: "error", text: "No changes detected." });
                    setLoading(false);
                    return;
                }

                const res = await fetch("/api/products/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to update product");
                }

                setSaveMessage({ type: "success", text: "Product updated successfully!" });
            }

            // Save used colors to recent history
            if (colors.length > 0 && (isBulkMode ? editFields.colors : true)) {
                const newRecents = [...recentColors];
                colors.forEach((c) => {
                    if (c.name && !newRecents.find(r => r.name === c.name && r.hex === c.hex)) {
                        newRecents.unshift(c);
                    }
                });
                const trimmed = newRecents.slice(0, 20);
                setRecentColors(trimmed);
                localStorage.setItem("kevara_recent_colors", JSON.stringify(trimmed));
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 600);
        } catch (error: any) {
            console.error("Save failed:", error);
            setSaveMessage({ type: "error", text: error.message || "Failed to save changes." });
        } finally {
            setLoading(false);
        }
    };

    const toggleSize = (size: string) => {
        if (sizes.includes(size)) {
            setSizes(sizes.filter(s => s !== size));
        } else {
            setSizes([...sizes, size]);
        }
    };

    const addColor = () => {
        if (!tempColor.name.trim()) return;
        setColors([...colors, { ...tempColor }]);
        setTempColor({ name: "", hex: "#000000" });
    };

    const removeColor = (index: number) => {
        setColors(colors.filter((_, i) => i !== index));
    };

    const updateColorName = (index: number, name: string) => {
        const updated = [...colors];
        updated[index] = { ...updated[index], name };
        setColors(updated);
    };

    const updateColorHex = (index: number, hex: string) => {
        const updated = [...colors];
        updated[index] = { ...updated[index], hex };
        setColors(updated);
    };

    const pickColor = async () => {
        if (!window.EyeDropper) {
            alert("Your browser does not support the EyeDropper tool. Please enter the hex code manually.");
            return;
        }
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            setColors(prev => [...prev, { name: "", hex: result.sRGBHex }]);
        } catch (e) {
            // User cancelled
        }
    };

    // Helper: renders a field section with an opt-in checkbox in bulk mode
    // Using a normal function instead of a Component so React doesn't unmount it on every keystroke
    const renderFieldSection = (fieldKey: keyof typeof editFields, label: string, children: React.ReactNode) => {
        const isEnabled = editFields[fieldKey];
        if (isBulkMode) {
            return (
                <div className={`space-y-3 p-4 rounded-xl border transition-colors ${isEnabled ? 'bg-white border-[#0E4D55]/20' : 'bg-gray-50/50 border-gray-100'}`}>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => setEditFields({ ...editFields, [fieldKey]: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-[#0E4D55] focus:ring-[#0E4D55]"
                        />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isEnabled ? 'text-[#0E4D55]' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </label>
                    {isEnabled && <div className="mt-2">{children}</div>}
                </div>
            );
        }
        // Single mode: always show, no checkbox
        return (
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {label}
                </label>
                {children}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-lora font-bold text-slate-900">
                            {isBulkMode ? `Bulk Edit · ${bulkProducts!.length} Products` : "Edit Product"}
                        </h3>
                        {isBulkMode ? (
                            <div className="flex items-center gap-2 mt-1.5">
                                <Users size={12} className="text-[#0E4D55]" />
                                <span className="text-xs text-slate-500">
                                    Enable each field you want to change.
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-1.5">
                                <Hash size={12} className="text-[#0E4D55]" />
                                <span className="text-xs font-mono text-[#0E4D55] bg-[#0E4D55]/5 px-2 py-0.5 rounded-md border border-[#0E4D55]/10">
                                    ID: {product!.handle}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Batch Number List — shown in bulk mode */}
                {isBulkMode && (
                    <div className="px-6 pt-4 pb-2 border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <FolderTree size={11} className="text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Batch Numbers</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200">
                            {bulkProducts!.map(p => {
                                const bn = parseProductTitle(p.title).batchNumber;
                                return (
                                    <span
                                        key={p.handle}
                                        className="text-[10px] font-mono text-slate-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200"
                                        title={p.title}
                                    >
                                        {bn ? `Batch ${bn}` : 'No Batch'}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Body — Scrollable */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">

                    {/* Batch Number */}
                    {renderFieldSection("batchNumber", isBulkMode ? "Update Batch Number" : "Batch Number",
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={batchNumber}
                                    onChange={(e) => setBatchNumber(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all font-mono"
                                    placeholder="e.g. 583"
                                />
                            </div>
                            <span className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
                                Products with the same batch number group together as color variants on the product page.
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    {renderFieldSection("title", isBulkMode ? "Base Name & Suffix" : "Base Product Title",
                        isBulkMode ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">Set New Base Name (Optional — overwrites all)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                                        placeholder="E.g. Summer Collection Tee"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">Add Suffix (Optional — appends to existing name)</label>
                                    <input
                                        type="text"
                                        value={titleSuffix}
                                        onChange={(e) => setTitleSuffix(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                                        placeholder="E.g. - Limited Edition"
                                    />
                                </div>
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                                placeholder="Base Name without batch number"
                            />
                        )
                    )}

                    {/* Description — single mode only */}
                    {!isBulkMode && renderFieldSection("description", "Description",
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all resize-none"
                            placeholder="Product description..."
                        />
                    )}

                    {/* Price & Status */}
                    <div className={isBulkMode ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                        {renderFieldSection("price", "Price (₹)",
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                                placeholder="e.g. 1999 or 1500-2000"
                            />
                        )}

                        {renderFieldSection("status", "Status",
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="DRAFT">Draft</option>
                            </select>
                        )}
                    </div>

                    {/* Return Days */}
                    {renderFieldSection("returnDays", "Return Window (Days)",
                        <input
                            type="number"
                            min="0"
                            value={returnDays}
                            onChange={(e) => setReturnDays(parseInt(e.target.value) || 0)}
                            className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                        />
                    )}



                    {/* Sizes */}
                    {renderFieldSection("sizes", isBulkMode ? "Sizes (Replaces existing)" : "Sizes",
                        <>
                            <div className="flex flex-wrap gap-2">
                                {SIZE_OPTIONS.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                                            sizes.includes(size)
                                                ? "bg-[#0E4D55] text-white border-[#0E4D55] shadow-sm"
                                                : "bg-white text-slate-600 border-gray-200 hover:border-[#0E4D55]/40 hover:text-[#0E4D55]"
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {sizes.length > 0 && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {sizes.length} size{sizes.length !== 1 ? "s" : ""} selected: {sizes.join(", ")}
                                </p>
                            )}

                            {sizes.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Size-specific Prices (Optional)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {sizes.map((size) => (
                                            <div key={size} className="flex items-center gap-2">
                                                <span className="w-12 text-xs font-medium text-slate-500 text-right">{size}</span>
                                                <input
                                                    type="text"
                                                    value={variantPrices[size] || ""}
                                                    onChange={(e) => setVariantPrices({ ...variantPrices, [size]: e.target.value })}
                                                    placeholder="Default"
                                                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Colors */}
                    {renderFieldSection("colors", isBulkMode ? "Colors (Replaces existing)" : "Colors",
                        <>
                            {/* Add Color Row */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Color Name"
                                    className="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4D55] focus:border-transparent"
                                    value={tempColor.name}
                                    onChange={(e) => setTempColor({ ...tempColor, name: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && addColor()}
                                />
                                <input
                                    type="color"
                                    className="w-11 h-11 p-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                                    value={tempColor.hex}
                                    onChange={(e) => setTempColor({ ...tempColor, hex: e.target.value })}
                                    title="Choose Color"
                                />
                                <button
                                    onClick={pickColor}
                                    type="button"
                                    className="p-2.5 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 hover:text-[#0E4D55] transition-colors"
                                    title="Pick color from screen"
                                >
                                    <Pipette size={18} />
                                </button>
                                <button
                                    onClick={addColor}
                                    type="button"
                                    className="p-2.5 bg-[#0E4D55] text-white rounded-lg hover:bg-[#0A3A40] transition-colors"
                                    title="Add color"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Recent Colors */}
                            {recentColors.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-[10px] text-gray-400 block mb-1.5">Recent Colors:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {recentColors.slice(0, 12).map((color, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setColors(prev => [...prev, { ...color }])}
                                                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg hover:border-[#0E4D55]/40 transition-colors"
                                                title={`Add ${color.name}`}
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full border border-gray-200"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <span className="text-[10px] text-slate-700">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Current Colors */}
                            {colors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {colors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedColorForImages(color.name)}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onDrop={(e) => handleDropOnColor(e, color.name)}
                                            className={`flex items-center gap-2 pl-1.5 pr-1 py-1 bg-white border-2 rounded-full shadow-sm cursor-pointer transition-all ${selectedColorForImages === color.name ? 'border-[#0E4D55] ring-1 ring-[#0E4D55] scale-105' : 'border-gray-200 hover:border-gray-300'} ${draggedIndex !== null && selectedColorForImages !== color.name ? 'ring-2 ring-dashed ring-[#0E4D55]/50' : ''}`}
                                            title="Click to edit images for this color. You can also drag images here to move them to this color."
                                        >
                                            <input
                                                type="color"
                                                value={color.hex}
                                                onChange={(e) => updateColorHex(idx, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-5 h-5 rounded-full border border-gray-100 cursor-pointer p-0 appearance-none overflow-hidden"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <input
                                                type="text"
                                                value={color.name}
                                                onChange={(e) => updateColorName(idx, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                placeholder="Name..."
                                                className="text-xs text-slate-900 font-medium bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-20 placeholder:text-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeColor(idx);
                                                    if (selectedColorForImages === color.name) {
                                                        setSelectedColorForImages(null);
                                                    }
                                                }}
                                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {colors.length === 0 && (
                                <p className="text-xs text-slate-400 italic mt-2">No colors added yet.</p>
                            )}
                        </>
                    )}
                </div>

                {/* Images Section (Moved below colors) */}
                {!isBulkMode && (
                    <div className="px-6 pb-6 pt-2 shrink-0">
                        {renderFieldSection("images", `Images for ${selectedColorForImages || 'Selected Color'}`,
                            !selectedColorForImages ? (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center text-slate-500 italic">
                                    Please select a color badge from the "Colors" section above to edit its images.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {images.map((item, index) => (
                                            <div
                                                key={item.id}
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
                                                    src={item.url}
                                                    alt={`Image ${index + 1}`}
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
                                    <p className="text-xs text-gray-500">💡 Drag to reorder — 1st image is display, 2nd is hover effect</p>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl shrink-0">
                    {/* Save Message */}
                    {saveMessage && (
                        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
                            saveMessage.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {saveMessage.text}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-[#0E4D55] text-white rounded-xl hover:bg-[#0A3A40] font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Save size={16} />
                            )}
                            {isBulkMode ? `Update ${bulkProducts!.length} Products` : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
