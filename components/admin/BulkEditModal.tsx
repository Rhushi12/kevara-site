"use client";

import { useState } from "react";
import { Loader2, X, Plus, Trash2 } from "lucide-react";

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    count: number;
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export default function BulkEditModal({ isOpen, onClose, onSave, count }: BulkEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [updates, setUpdates] = useState<any>({});

    // Toggle field checkboxes
    const [editFields, setEditFields] = useState({
        status: false,
        price: false,
        sizes: false,
        colors: false,
    });

    const [tempColor, setTempColor] = useState({ name: "", hex: "#000000" });

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const dataToSave: any = {};
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-lora font-bold text-slate-900">
                        Bulk Edit ({count} products)
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-500">
                        Select properties to update. Only selected fields will be changed. Unselected fields will remain unchanged.
                    </p>

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
                                type="number"
                                placeholder="Enter new price"
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
                                    />
                                    <button
                                        onClick={addColor}
                                        type="button"
                                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(updates.colors || []).map((color: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-full"
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full border border-gray-100"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className="text-xs text-slate-600 font-medium">{color.name}</span>
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
