"use client";

import { useState } from "react";
import { Heart, Save, X } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useSizeGuideStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import WholesaleInquiryModal from "./WholesaleInquiryModal";
import { useToast } from "@/context/ToastContext";

interface EditableProductInfoProps {
    title: string;
    price: number;
    originalPrice?: number;
    colors: { name: string; hex: string }[];
    sizes: string[];
    description: string;
    handle: string;
    onProductUpdate?: (updatedProduct: any) => void;
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function EditableProductInfo({
    title,
    price,
    originalPrice,
    colors,
    sizes,
    description,
    handle,
    onProductUpdate
}: EditableProductInfoProps) {
    const { isAdmin } = useAuth();
    const [selectedColor, setSelectedColor] = useState(colors[0]?.name || "");
    const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
    const { openSizeGuide } = useSizeGuideStore();

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Editable values
    const [editedTitle, setEditedTitle] = useState(title);
    const [editedPrice, setEditedPrice] = useState(price.toString());
    const [editedDescription, setEditedDescription] = useState(description);
    const [editedSizes, setEditedSizes] = useState<string[]>(sizes);

    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const { showToast } = useToast();

    const discountPercentage = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const handleEnterEditMode = () => {
        setEditedTitle(title);
        setEditedPrice(price.toString());
        setEditedDescription(description);
        setEditedSizes([...sizes]);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log("[EditableProductInfo] Saving sizes:", editedSizes);

            const res = await fetch("/api/products/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle,
                    title: editedTitle,
                    price: editedPrice,
                    description: editedDescription,
                    sizes: editedSizes
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save");
            }

            if (onProductUpdate) {
                onProductUpdate({
                    title: editedTitle,
                    price: parseFloat(editedPrice),
                    descriptionHtml: editedDescription,
                    sizes: editedSizes
                });
            }

            setIsEditMode(false);
            showToast("Product updated successfully!", "success");
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to save product:", error);
            showToast("Failed to save changes: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSize = (size: string) => {
        setEditedSizes(prev => {
            if (prev.includes(size)) {
                return prev.filter(s => s !== size);
            } else {
                return [...prev, size];
            }
        });
    };

    // Current display values
    const displayTitle = isEditMode ? editedTitle : title;
    const displayPrice = isEditMode ? parseFloat(editedPrice) || 0 : price;
    const displaySizes = isEditMode ? editedSizes : sizes;

    return (
        <div className="flex flex-col gap-6 sticky top-24 relative group">
            {/* Admin Edit Controls */}
            {isAdmin && !isEditMode && (
                <button
                    onClick={handleEnterEditMode}
                    className="absolute -top-2 -right-2 z-50 bg-black text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    Edit Product
                </button>
            )}

            {isEditMode && (
                <div className="absolute -top-2 -right-2 z-50 flex gap-2">
                    <button
                        onClick={handleCancelEdit}
                        className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm shadow-md flex items-center gap-2 border border-slate-200"
                    >
                        <X size={14} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#006D77] text-white px-4 py-2 rounded-full text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={14} /> {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    {isEditMode ? (
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-3xl md:text-4xl font-lora font-medium text-slate-900 leading-tight w-full border border-[#006D77] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                        />
                    ) : (
                        <h1 className="text-3xl md:text-4xl font-lora font-medium text-slate-900 leading-tight">
                            {displayTitle}
                        </h1>
                    )}
                    {!isEditMode && (
                        <button className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-red-500">
                            <Heart size={24} />
                        </button>
                    )}
                </div>

                {/* Price */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-4">
                        {isEditMode ? (
                            <div className="flex items-center gap-2">
                                <span className="text-lg text-slate-500">₹</span>
                                <input
                                    type="number"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    className="text-2xl font-figtree font-semibold text-slate-900 w-32 border border-[#006D77] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                                />
                            </div>
                        ) : (
                            <span className="text-2xl font-figtree font-semibold text-slate-900">
                                {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                }).format(displayPrice)}
                            </span>
                        )}
                        {!isEditMode && originalPrice && originalPrice > price && (
                            <>
                                <span className="text-lg text-slate-400 line-through font-figtree">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(originalPrice)}
                                </span>
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded">
                                    {discountPercentage}% OFF
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Description (Edit Mode Only) */}
            {isEditMode && (
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Description
                    </label>
                    <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={4}
                        className="w-full border border-[#006D77] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                        placeholder="Product description (HTML supported)"
                    />
                </div>
            )}

            {/* Color Selection - Text based */}
            {!isEditMode && colors.length > 0 && (
                <div className="space-y-3">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Color: <span className="text-slate-500 font-normal capitalize">{selectedColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color.name)}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedColor === color.name
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                    }`}
                            >
                                {color.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Size Selection */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Size: <span className="text-slate-500 font-normal">{selectedSize || "Select"}</span>
                    </span>
                    {!isEditMode && (
                        <button
                            onClick={openSizeGuide}
                            className="text-xs text-slate-500 underline hover:text-slate-900"
                        >
                            Size Guide
                        </button>
                    )}
                </div>

                {isEditMode ? (
                    <div className="flex flex-wrap gap-2">
                        {ALL_SIZES.map((size) => (
                            <button
                                key={size}
                                onClick={() => toggleSize(size)}
                                className={`h-10 min-w-[3rem] px-3 rounded border text-sm font-medium transition-all ${editedSizes.includes(size)
                                        ? "border-[#006D77] bg-[#006D77] text-white"
                                        : "border-slate-200 text-slate-400 hover:border-slate-400"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                ) : displaySizes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {displaySizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`h-10 min-w-[3rem] px-3 rounded border text-sm font-medium transition-all ${selectedSize === size
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">No sizes available - click Edit to add sizes</p>
                )}
            </div>

            {/* Wholesale Inquiry Button */}
            {!isEditMode && (
                <div className="pt-4">
                    <LiquidButton
                        className="w-full h-12 bg-[#0E4D55] text-white hover:bg-[#0a383f] rounded-lg font-medium text-sm"
                        onClick={() => setShowInquiryModal(true)}
                    >
                        <span className="font-medium">Send us a message (Wholesale)</span>
                    </LiquidButton>
                </div>
            )}

            <WholesaleInquiryModal
                isOpen={showInquiryModal}
                onClose={() => setShowInquiryModal(false)}
                productTitle={title}
                productHandle={handle}
            />
        </div>
    );
}


