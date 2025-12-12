"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Save, X, Upload } from "lucide-react";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { motion } from "framer-motion";

interface SustainabilityBannerData {
    sectionLabel: string;
    title: string;
    text: string;
    buttonText: string;
    image: string;
}

const DEFAULT_DATA: SustainabilityBannerData = {
    sectionLabel: "SUSTAINABILITY",
    title: "Our move towards sustainability",
    text: "We are committed to reducing our environmental impact by using organic materials and sustainable practices in every step of our production process.",
    buttonText: "Read More",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b43?q=80&w=1200&auto=format&fit=crop"
};

export default function SustainabilityBanner({ initialData }: { initialData?: SustainabilityBannerData }) {
    const { isAdmin } = useAuth();
    const [data, setData] = useState<SustainabilityBannerData>({ ...DEFAULT_DATA, ...initialData });
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState<SustainabilityBannerData>(data);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: "pdp-global-settings",
                    data: { sustainability_banner: editedData }
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
        <section className="relative py-24 bg-[#006D77] text-white overflow-hidden group">
            {/* Admin Controls */}
            {isAdmin && !isEditMode && (
                <button
                    onClick={() => {
                        setEditedData(data);
                        setIsEditMode(true);
                    }}
                    className="absolute top-4 right-4 z-50 bg-white text-slate-900 px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
                title="Upload Banner Image"
            />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="flex flex-col items-center text-center max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.7, 0, 0.84, 0] }}
                >
                    {/* Content */}
                    {isEditMode ? (
                        <div className="space-y-4 w-full bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <div>
                                <label className="block text-xs font-bold text-white/70 mb-1">Small Title</label>
                                <input
                                    type="text"
                                    value={editedData.sectionLabel}
                                    onChange={(e) => setEditedData({ ...editedData, sectionLabel: e.target.value })}
                                    className="w-full p-2 bg-white/20 border border-white/30 rounded text-white text-xs font-bold uppercase tracking-widest"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/70 mb-1">Main Title</label>
                                <input
                                    type="text"
                                    value={editedData.title}
                                    onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                                    className="w-full p-2 bg-white/20 border border-white/30 rounded text-white text-2xl font-lora"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/70 mb-1">Description</label>
                                <textarea
                                    value={editedData.text}
                                    onChange={(e) => setEditedData({ ...editedData, text: e.target.value })}
                                    className="w-full p-2 bg-white/20 border border-white/30 rounded text-white h-24"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/70 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    value={editedData.buttonText}
                                    onChange={(e) => setEditedData({ ...editedData, buttonText: e.target.value })}
                                    className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/70 mb-1">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editedData.image}
                                        onChange={(e) => setEditedData({ ...editedData, image: e.target.value })}
                                        className="flex-1 p-2 bg-white/20 border border-white/30 rounded text-white text-sm"
                                    />
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="bg-white/20 hover:bg-white/30 p-2 rounded text-white"
                                    >
                                        <Upload size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/80 mb-4 block">
                                {data.sectionLabel}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-lora text-white mb-6 leading-tight">
                                {data.title}
                            </h2>
                            <p className="text-lg text-white/90 mb-8 leading-relaxed">
                                {data.text}
                            </p>
                            <button className="px-8 py-3 bg-white text-[#006D77] text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors">
                                {data.buttonText}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
                {isEditMode ? (
                    <div className="w-full h-full relative">
                        <Image
                            src={editedData.image}
                            alt="Sustainability Background"
                            fill
                            className="object-cover opacity-20"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-[#006D77]/80 mix-blend-multiply" />
                    </div>
                ) : (
                    <div className="w-full h-full relative">
                        <Image
                            src={data.image}
                            alt="Sustainability Background"
                            fill
                            className="object-cover opacity-20"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-[#006D77]/80 mix-blend-multiply" />
                    </div>
                )}
            </div>
        </section>
    );
}
