"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload, Save, Plus, Trash2 } from "lucide-react";

interface HeroSlide {
    id: string;
    handle: string;
    heading: string;
    subheading: string;
    button_text: string;
    link: string;
    imageUrl?: string;
}

interface HeroAdminClientProps {
    initialSlides: HeroSlide[];
}

export default function HeroAdminClient({ initialSlides }: HeroAdminClientProps) {
    const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setSelectedFile(null);
    };

    const handleCreate = () => {
        setEditingSlide({
            id: "",
            handle: `slide-${Date.now()}`,
            heading: "",
            subheading: "",
            button_text: "Shop Now",
            link: "/collections/all",
        });
        setSelectedFile(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlide) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("handle", editingSlide.handle);
        formData.append("heading", editingSlide.heading);
        formData.append("subheading", editingSlide.subheading);
        formData.append("buttonText", editingSlide.button_text);
        formData.append("link", editingSlide.link);

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        try {
            const res = await fetch("/api/hero/update", {
                method: "POST",
                body: formData,
            });
            const result = await res.json();

            if (result.success) {
                alert("Slide saved successfully!");
                // Refresh logic would go here, for now we just update local state if possible or reload
                window.location.reload();
            } else {
                alert("Failed to save slide: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-lora font-bold text-[#006D77]">Hero Slider Manager</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-[#006D77] text-white px-4 py-2 rounded hover:bg-[#005a63] transition-colors"
                >
                    <Plus size={20} />
                    Add New Slide
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="lg:col-span-1 space-y-4">
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            onClick={() => handleEdit(slide)}
                            className={`p-4 border rounded cursor-pointer transition-all ${editingSlide?.handle === slide.handle
                                    ? "border-[#006D77] bg-[#006D77]/5 shadow-md"
                                    : "border-gray-200 hover:border-[#006D77]/50"
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                                    {slide.imageUrl ? (
                                        <Image
                                            src={slide.imageUrl}
                                            alt={slide.heading}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Upload size={16} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{slide.heading}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-1">{slide.subheading}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit Column */}
                <div className="lg:col-span-2">
                    {editingSlide ? (
                        <form onSubmit={handleSave} className="bg-white p-6 border border-gray-200 rounded shadow-sm space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingSlide.id ? "Edit Slide" : "New Slide"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setEditingSlide(null)}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Heading</label>
                                    <input
                                        type="text"
                                        value={editingSlide.heading}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, heading: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#006D77]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Subheading</label>
                                    <input
                                        type="text"
                                        value={editingSlide.subheading}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, subheading: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#006D77]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Button Text</label>
                                    <input
                                        type="text"
                                        value={editingSlide.button_text}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, button_text: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#006D77]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Link URL</label>
                                    <input
                                        type="text"
                                        value={editingSlide.link}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, link: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#006D77]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Background Image/Video</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#006D77] transition-colors relative">
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*,video/*"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={32} />
                                        <p className="text-sm">
                                            {selectedFile ? selectedFile.name : "Click or drag to upload new media"}
                                        </p>
                                        {editingSlide.imageUrl && !selectedFile && (
                                            <p className="text-xs text-[#006D77]">Current image loaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="flex items-center gap-2 bg-[#006D77] text-white px-6 py-2 rounded hover:bg-[#005a63] transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded p-12">
                            <p>Select a slide to edit or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
