"use client";

import { useState, useEffect } from "react";
import { Heart, Save, X, Plus, Trash2, Palette, Search } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useSizeGuideStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import WholesaleInquiryModal from "./WholesaleInquiryModal";
import { useToast } from "@/context/ToastContext";

interface EditableProductInfoProps {
    title: string;
    price: string | number;
    originalPrice?: number;
    colors: { name: string; hex: string }[];
    sizes: string[];
    description: string;
    handle: string;
    onProductUpdate?: (updatedProduct: any) => void;
    imageUrls?: string[];
    onImagesChange?: (imageUrls: string[]) => void;
    onEditModeChange?: (isEditMode: boolean) => void;
}

const ALL_SIZES = ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

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
    { name: "Navy Blue", hex: "#1E3A5F" },
    { name: "Burgundy", hex: "#800020" },
];

export default function EditableProductInfo({
    title,
    price,
    originalPrice,
    colors,
    sizes,
    description,
    handle,
    onProductUpdate,
    imageUrls = [],
    onImagesChange,
    onEditModeChange
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
    const [editedDescription, setEditedDescription] = useState(description || "");
    const [editedSizes, setEditedSizes] = useState<string[]>(sizes);
    const [editedColors, setEditedColors] = useState<{ name: string; hex: string }[]>(colors);
    const [editedImageUrls, setEditedImageUrls] = useState<string[]>(imageUrls);
    const [customColorName, setCustomColorName] = useState("");
    const [customColorHex, setCustomColorHex] = useState("#000000");

    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const { showToast } = useToast();

    // Saved colors from other products
    const [savedColors, setSavedColors] = useState<{ name: string; hex: string }[]>([]);
    const [colorSearch, setColorSearch] = useState("");
    const [colorTab, setColorTab] = useState<'preset' | 'saved'>('preset');

    // Fetch saved colors on mount
    useEffect(() => {
        async function fetchSavedColors() {
            try {
                const res = await fetch('/api/admin/colors');
                if (res.ok) {
                    const data = await res.json();
                    setSavedColors(data.colors || []);
                }
            } catch (error) {
                console.error('Failed to fetch saved colors:', error);
            }
        }
        if (isAdmin) {
            fetchSavedColors();
        }
    }, [isAdmin]);

    // Sync editedImageUrls when imageUrls prop changes during edit mode
    // This happens when the gallery adds/removes images
    useEffect(() => {
        if (isEditMode) {
            setEditedImageUrls(imageUrls);
        }
    }, [imageUrls, isEditMode]);

    // Fix discount calculation for ranges
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    const discountPercentage = (originalPrice && !isNaN(numericPrice))
        ? Math.round(((originalPrice - numericPrice) / originalPrice) * 100)
        : 0;

    const handleEnterEditMode = () => {
        setEditedTitle(title);
        setEditedPrice(price.toString());
        setEditedDescription(description || "");
        setEditedSizes([...sizes]);
        setEditedColors([...colors]);
        setEditedImageUrls([...imageUrls]);
        setCustomColorName("");
        setCustomColorHex("#000000");
        setIsEditMode(true);
        onEditModeChange?.(true);
    };

    const handleCancelEdit = () => {
        setEditedImageUrls([...imageUrls]); // Reset images on cancel
        onImagesChange?.(imageUrls); // Reset gallery
        setIsEditMode(false);
        onEditModeChange?.(false);
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
                    description: editedDescription || "",
                    sizes: editedSizes,
                    colors: editedColors,
                    imageUrls: editedImageUrls
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save");
            }

            if (onProductUpdate) {
                onProductUpdate({
                    title: editedTitle,
                    price: editedPrice, // Keep as string to support ranges
                    descriptionHtml: editedDescription,
                    sizes: editedSizes,
                    colors: editedColors
                });
            }

            setIsEditMode(false);
            onEditModeChange?.(false);
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

    const addPresetColor = (color: { name: string; hex: string }) => {
        if (!editedColors.find(c => c.hex === color.hex)) {
            setEditedColors([...editedColors, color]);
        }
    };

    const addCustomColor = async () => {
        if (customColorName && !editedColors.find(c => c.hex.toUpperCase() === customColorHex.toUpperCase())) {
            const newColor = { name: customColorName, hex: customColorHex };
            setEditedColors([...editedColors, newColor]);

            // Save to API for future use
            try {
                const res = await fetch('/api/admin/colors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newColor)
                });
                if (res.ok) {
                    const data = await res.json();
                    setSavedColors(data.colors || []);
                }
            } catch (error) {
                console.error('Failed to save color:', error);
            }

            setCustomColorName("");
            setCustomColorHex("#000000");
        }
    };

    const removeColor = (hex: string) => {
        setEditedColors(editedColors.filter(c => c.hex !== hex));
    };

    // Current display values
    const displayTitle = isEditMode ? editedTitle : title;
    // Show raw string in edit mode, otherwise use price prop
    const displayPrice = isEditMode ? editedPrice : price;
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
                                <span className="text-lg text-slate-500">â‚¹</span>
                                <input
                                    type="text"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    className="text-2xl font-figtree font-semibold text-slate-900 w-48 border border-[#006D77] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                                />
                            </div>
                        ) : (
                            <span className="text-2xl font-figtree font-semibold text-slate-900">
                                {/* Handle ranges vs numbers */}
                                {typeof displayPrice === 'number' || (typeof displayPrice === 'string' && !isNaN(parseFloat(displayPrice)) && !displayPrice.includes('-'))
                                    ? new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(Number(displayPrice))
                                    : (() => {
                                        const p = displayPrice.toString();
                                        if (p.includes('-')) {
                                            const parts = p.split('-').map((s: string) => s.trim());
                                            if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                                                return `â‚¹${parts[0]} - â‚¹${parts[1]}`;
                                            }
                                        }
                                        return p.includes('â‚¹') ? p : `â‚¹${p}`;
                                    })()
                                }
                            </span>
                        )}
                        {!isEditMode && originalPrice && !isNaN(numericPrice) && originalPrice > numericPrice && (
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
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Palette size={16} className="text-slate-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        Colors {!isEditMode && selectedColor && <span className="text-slate-500 font-normal capitalize">: {selectedColor}</span>}
                    </span>
                </div>

                {isEditMode ? (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={colorSearch}
                                onChange={(e) => setColorSearch(e.target.value)}
                                placeholder="Search colors..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                            />
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-slate-200">
                            <button
                                type="button"
                                onClick={() => setColorTab('preset')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${colorTab === 'preset'
                                    ? 'text-[#006D77] border-b-2 border-[#006D77]'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Preset ({PRESET_COLORS.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setColorTab('saved')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${colorTab === 'saved'
                                    ? 'text-[#006D77] border-b-2 border-[#006D77]'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Saved ({savedColors.length})
                            </button>
                        </div>

                        {/* Color Grid */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                            {colorTab === 'preset'
                                ? PRESET_COLORS
                                    .filter(c => c.name.toLowerCase().includes(colorSearch.toLowerCase()))
                                    .map((color) => (
                                        <button
                                            key={color.hex}
                                            type="button"
                                            onClick={() => addPresetColor(color)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${editedColors.find(c => c.hex === color.hex)
                                                ? 'border-[#006D77] bg-[#006D77]/10'
                                                : 'border-slate-200 hover:border-slate-400'
                                                }`}
                                            title={color.name}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            {color.name}
                                        </button>
                                    ))
                                : savedColors
                                    .filter(c => c.name.toLowerCase().includes(colorSearch.toLowerCase()))
                                    .map((color) => (
                                        <button
                                            key={color.hex}
                                            type="button"
                                            onClick={() => addPresetColor(color)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${editedColors.find(c => c.hex.toUpperCase() === color.hex.toUpperCase())
                                                ? 'border-[#006D77] bg-[#006D77]/10'
                                                : 'border-slate-200 hover:border-slate-400'
                                                }`}
                                            title={color.name}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            {color.name}
                                        </button>
                                    ))
                            }
                            {((colorTab === 'preset' && PRESET_COLORS.filter(c => c.name.toLowerCase().includes(colorSearch.toLowerCase())).length === 0) ||
                                (colorTab === 'saved' && savedColors.filter(c => c.name.toLowerCase().includes(colorSearch.toLowerCase())).length === 0)) && (
                                    <p className="text-sm text-slate-400 py-4 w-full text-center">
                                        {colorTab === 'saved' && savedColors.length === 0
                                            ? 'No saved colors yet. Add custom colors below!'
                                            : 'No colors match your search'}
                                    </p>
                                )}
                        </div>

                        {/* Custom Color Input */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Custom Color</label>
                                <input
                                    type="text"
                                    value={customColorName}
                                    onChange={(e) => setCustomColorName(e.target.value)}
                                    placeholder="Color name"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Hex</label>
                                <input
                                    type="color"
                                    value={customColorHex}
                                    onChange={(e) => setCustomColorHex(e.target.value)}
                                    className="h-10 w-16 border border-slate-200 rounded-lg cursor-pointer"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addCustomColor}
                                disabled={!customColorName}
                                className="px-3 py-2 bg-[#006D77] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        </div>

                        {/* Selected Colors */}
                        {editedColors.length > 0 && (
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs font-medium text-slate-600 mb-2">Selected Colors ({editedColors.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {editedColors.map((color) => (
                                        <div
                                            key={color.hex}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 group"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className="text-sm font-medium text-slate-700">{color.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeColor(color.hex)}
                                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : colors.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color, index) => (
                            <button
                                key={`${color.hex}-${color.name || index}`}
                                onClick={() => setSelectedColor(color.name)}
                                title={color.name}
                                className={`w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center ${selectedColor === color.name
                                    ? "border-slate-900 ring-1 ring-slate-900 ring-offset-1"
                                    : "border-slate-200 hover:border-slate-400"
                                    }`}
                                style={{ backgroundColor: color.hex }}
                            >
                                <span className="sr-only">{color.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">No colors available - click Edit to add colors</p>
                )}
            </div>

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
                    <div className="relative">
                        {/* Mobile: Horizontal scroll carousel | Desktop: Flex wrap */}
                        <div className="flex gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide pb-2 md:pb-0 -mx-1 px-1">
                            {displaySizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`h-10 min-w-[3rem] px-3 rounded border text-sm font-medium transition-all flex-shrink-0 ${selectedSize === size
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        {/* Scroll fade indicator on mobile (right edge) */}
                        {displaySizes.length > 5 && (
                            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
                        )}
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


