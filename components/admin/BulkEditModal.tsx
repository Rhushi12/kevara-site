"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Plus, Trash2, Minus, Maximize2, Pipette } from "lucide-react";

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    count: number;
}

const SIZE_OPTIONS = ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

// Extend Window interface for EyeDropper API
declare global {
    interface Window {
        EyeDropper: any;
    }
}

export default function BulkEditModal({ isOpen, onClose, onSave, count }: BulkEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [updates, setUpdates] = useState<any>({});

    // Toggle field checkboxes
    const [editFields, setEditFields] = useState({
        name: false,
        status: false,
        price: false,
        sizes: false,
        colors: false,
    });

    const [tempColor, setTempColor] = useState({ name: "", hex: "#000000" });
    const [isMinimized, setIsMinimized] = useState(false);
    const [recentColors, setRecentColors] = useState<{ name: string; hex: string }[]>([]);

    // Load recent colors
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

    // Manage body scroll
    useEffect(() => {
        if (isOpen && !isMinimized) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Also ensure we clean up style attribute if it's empty
            if (!document.body.getAttribute('style')) {
                document.body.removeAttribute('style');
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isMinimized]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const dataToSave: any = {};
            if (editFields.status) dataToSave.status = updates.status;
            if (editFields.price) dataToSave.price = updates.price;
            if (editFields.sizes) dataToSave.sizes = updates.sizes;
            if (editFields.name) {
                if (updates.title) dataToSave.title = updates.title;
                if (updates.titleSuffix) dataToSave.titleSuffix = updates.titleSuffix;
            }
            if (editFields.status) dataToSave.status = updates.status;
            if (editFields.price) dataToSave.price = updates.price;
            if (editFields.sizes) dataToSave.sizes = updates.sizes;
            if (editFields.colors) dataToSave.colors = updates.colors;

            if (Object.keys(dataToSave).length === 0) {
                alert("Please select fields to update and enter values.");
                setLoading(false);
                return;
            }

            await onSave(dataToSave);

            // Save used colors to history if they have names
            if (editFields.colors && updates.colors?.length > 0) {
                const newRecents = [...recentColors];
                updates.colors.forEach((c: { name: string; hex: string }) => {
                    if (c.name && !newRecents.find(r => r.name === c.name && r.hex === c.hex)) {
                        newRecents.unshift(c);
                    }
                });
                // Limit to 20
                const trimmed = newRecents.slice(0, 20);
                setRecentColors(trimmed);
                localStorage.setItem("kevara_recent_colors", JSON.stringify(trimmed));
            }

            onClose();
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSize = (size: string) => {
        const currentSizes = updates.sizes || [];
        if (currentSizes.includes(size)) {
            setUpdates({ ...updates, sizes: currentSizes.filter((s: string) => s !== size) });
        } else {
            setUpdates({ ...updates, sizes: [...currentSizes, size] });
        }
    };

    const addColor = () => {
        if (!tempColor.name) return;
        const currentColors = updates.colors || [];
        setUpdates({ ...updates, colors: [...currentColors, tempColor] });
        setTempColor({ name: "", hex: "#000000" });
    };

    const removeColor = (index: number) => {
        const currentColors = updates.colors || [];
        setUpdates({ ...updates, colors: currentColors.filter((_: any, i: number) => i !== index) });
    };

    const updateColorName = (index: number, name: string) => {
        const currentColors = [...(updates.colors || [])];
        if (currentColors[index]) {
            currentColors[index] = { ...currentColors[index], name };
            setUpdates({ ...updates, colors: currentColors });
        }
    };

    const pickColor = async () => {
        if (!window.EyeDropper) {
            alert("Your browser does not support the EyeDropper tool. Please enter the hex code manually.");
            return;
        }

        try {
            setIsMinimized(true); // Minimize so user can see what to pick
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();

            // Add directly to list with empty name
            setUpdates((prev: any) => {
                const current = prev.colors || [];
                return { ...prev, colors: [...current, { name: "", hex: result.sRGBHex }] };
            });
        } catch (e) {
        }
        // Do not restore modal automatically
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm">Bulk Edit Active</span>
                    <span className="text-xs text-slate-500">{count} products selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={pickColor}
                        className="p-2 hover:bg-gray-100 rounded-lg text-slate-600 hover:text-slate-900"
                        title="Pick another color"
                    >
                        <Pipette size={18} />
                    </button>
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-slate-600 hover:text-slate-900"
                        title="Maximize"
                    >
                        <Maximize2 size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-lora font-bold text-slate-900">
                        Bulk Edit ({count} products)
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 hover:bg-gray-100 rounded-full text-slate-500 hover:text-slate-900"
                            title="Minimize"
                        >
                            <Minus size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 hover:text-slate-900">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-500">
                        Select properties to update. Only selected fields will be changed. Unselected fields will remain unchanged.
                    </p>

                    {/* Naming */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editFields.name}
                                onChange={(e) => setEditFields({ ...editFields, name: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-medium text-slate-900">Product Name & Suffix</span>
                        </label>
                        {editFields.name && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Set New Name (Optional - Overwrites all)</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Summer Collection Tee"
                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                        value={updates.title || ""}
                                        onChange={(e) => setUpdates({ ...updates, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Add Suffix (Optional - Appends to name)</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. - Limited Edition"
                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                        value={updates.titleSuffix || ""}
                                        onChange={(e) => setUpdates({ ...updates, titleSuffix: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editFields.status}
                                onChange={(e) => setEditFields({ ...editFields, status: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-medium text-slate-900">Status</span>
                        </label>
                        {editFields.status && (
                            <select
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                value={updates.status || ""}
                                onChange={(e) => setUpdates({ ...updates, status: e.target.value })}
                            >
                                <option value="">Select Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DRAFT">Draft</option>
                            </select>
                        )}
                    </div>

                    {/* Price */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editFields.price}
                                onChange={(e) => setEditFields({ ...editFields, price: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-medium text-slate-900">Price</span>
                        </label>
                        {editFields.price && (
                            <input
                                type="text"
                                placeholder="E.g. 100 or 100-200"
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                value={updates.price || ""}
                                onChange={(e) => setUpdates({ ...updates, price: e.target.value })}
                            />
                        )}
                    </div>

                    {/* Sizes */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editFields.sizes}
                                onChange={(e) => setEditFields({ ...editFields, sizes: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-medium text-slate-900">Sizes (Replacements)</span>
                        </label>
                        {editFields.sizes && (
                            <div className="flex flex-wrap gap-2">
                                {SIZE_OPTIONS.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${(updates.sizes || []).includes(size)
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-gray-200 hover:border-slate-300"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Colors */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editFields.colors}
                                onChange={(e) => setEditFields({ ...editFields, colors: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-medium text-slate-900">Colors (Replacements)</span>
                        </label>
                        {editFields.colors && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Color Name"
                                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                        value={tempColor.name}
                                        onChange={(e) => setTempColor({ ...tempColor, name: e.target.value })}
                                    />
                                    <input
                                        type="color"
                                        className="w-10 h-10 p-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                                        value={tempColor.hex}
                                        onChange={(e) => setTempColor({ ...tempColor, hex: e.target.value })}
                                        title="Choose Color"
                                    />
                                    <button
                                        onClick={pickColor}
                                        type="button"
                                        className="p-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 hover:text-slate-900"
                                        title="Pick color from screen"
                                    >
                                        <Pipette size={20} />
                                    </button>
                                    <button
                                        onClick={addColor}
                                        type="button"
                                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                    >
                                        <Plus size={20} />
                                    </button>
                                    <button
                                        onClick={addColor}
                                        type="button"
                                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Recent Colors */}
                                {recentColors.length > 0 && (
                                    <div className="mb-2">
                                        <span className="text-xs text-gray-500 block mb-1">Recent Colors:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {recentColors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = updates.colors || [];
                                                        setUpdates({ ...updates, colors: [...current, color] });
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg hover:border-slate-300 transition-colors"
                                                    title={`Add ${color.name}`}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full border border-gray-200"
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    <span className="text-xs text-slate-700">{color.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {(updates.colors || []).map((color: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-full"
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full border border-gray-100 flex-shrink-0"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <input
                                                type="text"
                                                value={color.name}
                                                onChange={(e) => updateColorName(idx, e.target.value)}
                                                placeholder="Name this color..."
                                                className="text-xs text-slate-900 font-medium bg-transparent border-none focus:ring-0 p-0 w-24 placeholder:text-slate-400"
                                                autoFocus={!color.name}
                                            />
                                            <button
                                                onClick={() => removeColor(idx)}
                                                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Update Products
                    </button>
                </div>
            </div>
        </div>
    );
}
