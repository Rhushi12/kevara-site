"use client";

import { useState } from "react";
import { Heart, Save, X, Plus, Trash2 } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useSizeGuideStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";

interface EditableProductInfoProps {
    title: string;
    price: number;
    originalPrice?: number;
    colors: { name: string; hex: string }[];
    sizes: string[];
    description: string;
    handle: string; // Product handle for updates
    onProductUpdate?: (updatedProduct: any) => void;
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_COLORS = [
    { name: "Black", hex: "#18181B" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Blue", hex: "#1E3A8A" },
    { name: "Red", hex: "#B91C1C" },
    { name: "Beige", hex: "#D4D4D8" },
    { name: "Grey", hex: "#71717A" },
    { name: "Brown", hex: "#78350F" },
    { name: "Olive", hex: "#555B46" },
    { name: "Sand", hex: "#D8C8B8" },
    { name: "Purple", hex: "#6B21A8" },
    { name: "Green", hex: "#15803d" },
];

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
    const [editedColors, setEditedColors] = useState(colors);
    const [editedSizes, setEditedSizes] = useState(sizes);

    // Color picker state
    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [showColorPicker, setShowColorPicker] = useState(false);

    const discountPercentage = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const handleEnterEditMode = () => {
        setEditedTitle(title);
        setEditedPrice(price.toString());
        setEditedDescription(description);
        setEditedColors([...colors]);
        setEditedSizes([...sizes]);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setShowColorPicker(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/products/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle,
                    title: editedTitle,
                    price: editedPrice,
                    description: editedDescription,
                    colors: editedColors,
                    sizes: editedSizes
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save");
            }

            // Call callback to refresh product data
            if (onProductUpdate) {
                onProductUpdate({
                    title: editedTitle,
                    price: parseFloat(editedPrice),
                    descriptionHtml: editedDescription,
                    colors: editedColors,
                    sizes: editedSizes
                });
            }

            setIsEditMode(false);
            alert("Product updated successfully!");
            // Reload the page to show updated data
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to save product:", error);
            alert("Failed to save changes: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const addColor = () => {
        if (newColorName.trim()) {
            setEditedColors([...editedColors, { name: newColorName.trim(), hex: newColorHex }]);
            setNewColorName("");
            setNewColorHex("#000000");
            setShowColorPicker(false);
        }
    };

    const removeColor = (index: number) => {
        setEditedColors(editedColors.filter((_, i) => i !== index));
    };

    const addColorFromPreset = (preset: { name: string; hex: string }) => {
        if (!editedColors.find(c => c.name === preset.name)) {
            setEditedColors([...editedColors, preset]);
        }
    };

    const toggleSize = (size: string) => {
        if (editedSizes.includes(size)) {
            setEditedSizes(editedSizes.filter(s => s !== size));
        } else {
            setEditedSizes([...editedSizes, size]);
        }
    };

    // Current display values
    const displayTitle = isEditMode ? editedTitle : title;
    const displayPrice = isEditMode ? parseFloat(editedPrice) || 0 : price;
    const displayColors = isEditMode ? editedColors : colors;
    const displaySizes = isEditMode ? editedSizes : sizes;

    return (
        <div className="flex flex-col gap-8 sticky top-24 relative group">
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

                {/* Price - HIDDEN */}
                <div className="flex flex-col gap-2 hidden">
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

            {/* Color Selection */}
            {displayColors.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                            Color: <span className="text-slate-500 font-normal capitalize">{selectedColor}</span>
                        </span>
                        {isEditMode && (
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="text-xs text-[#006D77] underline hover:text-[#005a63]"
                            >
                                {showColorPicker ? "Hide Options" : "Add Color"}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {displayColors.map((color, index) => (
                            <div key={color.name} className="relative">
                                <button
                                    onClick={() => !isEditMode && setSelectedColor(color.name)}
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color.name && !isEditMode
                                        ? "border-slate-900 scale-110"
                                        : "border-transparent hover:border-slate-300"
                                        }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                </button>
                                {isEditMode && (
                                    <button
                                        onClick={() => removeColor(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Color Picker (Edit Mode) */}
                    {isEditMode && showColorPicker && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Add from presets:</p>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_COLORS.filter(
                                    dc => !editedColors.find(ec => ec.name === dc.name)
                                ).map(preset => (
                                    <button
                                        key={preset.name}
                                        onClick={() => addColorFromPreset(preset)}
                                        className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs hover:border-[#006D77]"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border border-slate-200"
                                            style={{ backgroundColor: preset.hex }}
                                        />
                                        {preset.name}
                                    </button>
                                ))}
                            </div>

                            <div className="h-px bg-slate-200" />

                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Or add custom:</p>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newColorName}
                                    onChange={(e) => setNewColorName(e.target.value)}
                                    placeholder="Color name"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#006D77]"
                                />
                                <button
                                    onClick={addColor}
                                    disabled={!newColorName.trim()}
                                    className="bg-[#006D77] text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Size Selection */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Size: <span className="text-slate-500 font-normal">{selectedSize}</span>
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
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {displaySizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`h-10 min-w-[3rem] px-3 rounded border text-sm font-medium transition-all relative overflow-hidden ${selectedSize === size
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions: WhatsApp & Email */}
            {/* Actions: Email Only */}
            {!isEditMode && (
                <div className="flex flex-col gap-3 pt-4">
                    <LiquidButton
                        className="w-full h-12 bg-white text-slate-900 border border-slate-900 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2"
                        variant="secondary"
                        onClick={() => window.location.href = `mailto:contact@kevara.com?subject=Inquiry about ${title}`}
                    >
                        <span className="font-medium">Send us an Email</span>
                    </LiquidButton>
                </div>
            )}
        </div>
    );
}
