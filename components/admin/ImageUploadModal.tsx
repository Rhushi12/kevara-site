"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, label: string, href: string) => Promise<void>;
}

export default function ImageUploadModal({ isOpen, onClose, onUpload }: ImageUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [label, setLabel] = useState("");
    const [href, setHref] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !label || !href) return;

        setUploading(true);
        try {
            await onUpload(file, label, href);
            onClose();
            // Reset state
            setFile(null);
            setPreview(null);
            setLabel("");
            setHref("");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-lora font-bold mb-6">Add New Collection Image</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Drop/Select Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${preview ? "border-[#006D77] bg-[#006D77]/5" : "border-gray-300 hover:border-[#006D77]"
                            }`}
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-48 object-contain rounded" />
                        ) : (
                            <>
                                <Upload size={48} className="text-gray-400 mb-4" />
                                <p className="text-sm text-gray-500 font-medium">Click to upload image</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 2MB</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                                Label
                            </label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g., Summer Vibes"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#006D77]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                                Link URL
                            </label>
                            <input
                                type="text"
                                value={href}
                                onChange={(e) => setHref(e.target.value)}
                                placeholder="e.g., /collections/summer"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#006D77]"
                                required
                            />
                        </div>
                    </div>

                    <LiquidButton
                        type="submit"
                        disabled={uploading || !file}
                        className={`w-full ${uploading || !file ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {uploading ? "Uploading..." : "Add to Menu"}
                    </LiquidButton>
                </form>
            </div>
        </div>
    );
}
