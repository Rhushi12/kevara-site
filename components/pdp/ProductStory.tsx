"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Save, X, Upload, Camera } from "lucide-react";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { motion } from "framer-motion";

interface ProductStoryData {
    title: string;
    subtitle: string;
    quote: string;
    image: string;
    buttonText: string;
}

const DEFAULT_DATA: ProductStoryData = {
    title: "Home Sanctuary",
    subtitle: "Our Philosophy",
    quote: "\"The label has developed its own contemporary look that avoids trend chasing and focuses instead on practicality, quality, and timeless style.\"",
    image: "https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=1200&auto=format&fit=crop",
    buttonText: "Read Our Story"
};

export default function ProductStory({ initialData }: { initialData?: ProductStoryData }) {
    const { isAdmin } = useAuth();
    const [data, setData] = useState<ProductStoryData>(initialData || DEFAULT_DATA);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState<ProductStoryData>(data);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: "pdp-global-settings",
                    data: { product_story: editedData }
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            setData(editedData);
            setIsEditMode(false);
            alert("Section updated successfully!");
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        if (data.url) {
            setEditedData({ ...editedData, image: data.url });
        }
    };

    return (
        <section className="relative py-24 bg-[#FDFBF7] overflow-hidden group">
            {/* Admin Controls */}
            {isAdmin && !isEditMode && (
                <button
                    onClick={() => {
                        setEditedData(data);
                        setIsEditMode(true);
                    }}
                    className="absolute top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Edit Section
                </button>
            )}

            {isEditMode && (
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={() => setIsEditMode(false)}
                        className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm shadow-md flex items-center gap-2"
                    >
                        <X size={14} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#006D77] text-white px-4 py-2 rounded-full text-sm shadow-md flex items-center gap-2"
                    >
                        <Save size={14} /> {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}

            {/* Upload Modal */}
            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
                title="Upload Section Image"
                aspectRatio={4 / 5}
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    {/* Image */}
                    <motion.div
                        className="w-full md:w-1/2"
                        initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
                        whileInView={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="relative aspect-square md:aspect-[4/5] overflow-hidden rounded-sm bg-gray-100">
                            {isEditMode ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-50">
                                    <Camera className="text-slate-400 mb-2" size={32} />
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Image URL</label>
                                    <div className="flex gap-2 w-full max-w-xs">
                                        <input
                                            type="text"
                                            value={editedData.image}
                                            onChange={(e) => setEditedData({ ...editedData, image: e.target.value })}
                                            className="flex-1 p-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#006D77]"
                                            placeholder="https://..."
                                        />
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="bg-gray-200 hover:bg-gray-300 text-slate-700 p-2 rounded transition-colors"
                                            title="Upload Image"
                                        >
                                            <Upload size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Image
                                    src={data.image}
                                    alt={data.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        className="w-full md:w-1/2 text-center md:text-left"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    >
                        {isEditMode ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={editedData.subtitle}
                                        onChange={(e) => setEditedData({ ...editedData, subtitle: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded font-bold uppercase tracking-widest text-[#006D77]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editedData.title}
                                        onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded text-3xl font-lora"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Quote</label>
                                    <textarea
                                        value={editedData.quote}
                                        onChange={(e) => setEditedData({ ...editedData, quote: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded text-lg italic h-32"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Button Text</label>
                                    <input
                                        type="text"
                                        value={editedData.buttonText}
                                        onChange={(e) => setEditedData({ ...editedData, buttonText: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded uppercase tracking-widest"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#006D77] mb-4 block">
                                    {data.subtitle}
                                </span>
                                <h2 className="text-4xl md:text-5xl font-lora text-slate-900 mb-8 leading-tight">
                                    {data.title}
                                </h2>
                                <blockquote className="text-lg md:text-xl text-slate-600 font-light italic mb-8 leading-relaxed">
                                    {data.quote}
                                </blockquote>
                                <button className="px-8 py-3 bg-[#4A3B32] text-white text-sm uppercase tracking-widest hover:bg-[#3A2E27] transition-colors">
                                    {data.buttonText}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F5F2EB] -z-0 hidden md:block" />
        </section>
    );
}
