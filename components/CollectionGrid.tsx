"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { useState } from "react";

interface CollectionGridProps {
    data?: any[];
    isEditMode?: boolean;
    onUpdate?: (data: any[]) => void;
}

export default function CollectionGrid({ data = [], isEditMode = false, onUpdate }: CollectionGridProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);

    // Ensure we have 3 items for the grid layout
    const items = data.length >= 3 ? data : [
        {
            title: "Women's Resort",
            link: "/collections/women",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop",
            size: "tall",
        },
        {
            title: "Men's Casual",
            link: "/collections/men",
            image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=1000&auto=format&fit=crop",
            size: "wide",
        },
        {
            title: "Home Essentials",
            link: "/collections/home",
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
            size: "wide",
        },
    ];

    const updateItem = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate(newItems);
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate || uploadIndex === null) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!data.success) throw new Error("Upload failed");

            const previewUrl = URL.createObjectURL(file);
            const imageUrl = data.url || previewUrl;

            const newItems = [...items];
            newItems[uploadIndex] = { ...newItems[uploadIndex], image: imageUrl, image_id: data.fileId };
            onUpdate(newItems);
            setIsUploadModalOpen(false);
            setUploadIndex(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image");
        }
    };

    const openUploadModal = (index: number) => {
        setUploadIndex(index);
        setIsUploadModalOpen(true);
    };

    const renderItemContent = (item: any, index: number) => (
        <>
            {item.image ? (
                <Image
                    src={item.image}
                    alt={item.title || "Collection Image"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                </div>
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    {isEditMode ? (
                        <EditableText
                            value={item.title}
                            onSave={(val) => updateItem(index, "title", val)}
                            isAdmin={true}
                            className="text-2xl md:text-3xl font-lora text-white mb-2 drop-shadow-md bg-transparent border-b border-white/30"
                        />
                    ) : (
                        <h4 className="text-2xl md:text-3xl font-lora text-white mb-2 drop-shadow-md">
                            {item.title}
                        </h4>
                    )}

                    {isEditMode ? (
                        <EditableText
                            value={item.link}
                            onSave={(val) => updateItem(index, "link", val)}
                            isAdmin={true}
                            className="text-xs font-bold tracking-widest text-white uppercase bg-transparent border-b border-white/30"
                            placeholder="Link URL"
                        />
                    ) : (
                        <span className="inline-block text-xs font-bold tracking-widest text-white uppercase border-b-2 border-transparent group-hover:border-white transition-all duration-300 pb-1">
                            Shop Now
                        </span>
                    )}
                </div>
            </div>
            {isEditMode && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        openUploadModal(index);
                    }}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs z-50 transition-colors"
                >
                    Change Image
                </button>
            )}
        </>
    );

    return (
        <section className="py-24 bg-[#FDFBF7]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#006D77] uppercase mb-4">
                        Spring Summer 25'
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-lora text-slate-900">
                        Home Sanctuary
                    </h3>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto h-auto md:h-[800px]">
                    {/* Left Column - Tall Item */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full h-[500px] md:h-full"
                    >
                        {isEditMode ? (
                            <div className="group relative block w-full h-full overflow-hidden rounded-lg">
                                {renderItemContent(items[0], 0)}
                            </div>
                        ) : (
                            <Link
                                href={items[0].link}
                                className="group relative block w-full h-full overflow-hidden rounded-lg"
                            >
                                {renderItemContent(items[0], 0)}
                            </Link>
                        )}
                    </motion.div>

                    {/* Right Column - Stacked Items */}
                    <div className="flex flex-col gap-6 h-full">
                        {/* Top Right - Slide from Right */}
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="w-full h-[400px] md:h-1/2"
                        >
                            {isEditMode ? (
                                <div className="group relative block w-full h-full overflow-hidden rounded-lg">
                                    {renderItemContent(items[1], 1)}
                                </div>
                            ) : (
                                <Link
                                    href={items[1].link}
                                    className="group relative block w-full h-full overflow-hidden rounded-lg"
                                >
                                    {renderItemContent(items[1], 1)}
                                </Link>
                            )}
                        </motion.div>

                        {/* Bottom Right - Slide from Right */}
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                            className="w-full h-[400px] md:h-1/2"
                        >
                            {isEditMode ? (
                                <div className="group relative block w-full h-full overflow-hidden rounded-lg">
                                    {renderItemContent(items[2], 2)}
                                </div>
                            ) : (
                                <Link
                                    href={items[2].link}
                                    className="group relative block w-full h-full overflow-hidden rounded-lg"
                                >
                                    {renderItemContent(items[2], 2)}
                                </Link>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
            />
        </section>
    );
}
