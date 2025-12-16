"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { useState } from "react";
import { authUpload } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";

interface CollectionGridProps {
    data?: {
        items?: any[];
        title?: string;
        subtitle?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function CollectionGrid({ data = {}, isEditMode = false, onUpdate }: CollectionGridProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);
    const { showToast } = useToast();

    const {
        items = [],
        title = "Home Sanctuary",
        subtitle = "Spring Summer 25'"
    } = data;

    // Ensure we have 3 items for the grid layout
    const gridItems = items.length >= 3 ? items : [
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

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const updateItem = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newItems = [...gridItems];
        newItems[index] = { ...newItems[index], [field]: value };
        updateField("items", newItems);
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate || uploadIndex === null) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authUpload('/api/upload', formData);
            const data = await res.json();

            if (!data.success) throw new Error("Upload failed");

            const previewUrl = URL.createObjectURL(file);
            const imageUrl = data.url || previewUrl;

            const newItems = [...gridItems];
            newItems[uploadIndex] = { ...newItems[uploadIndex], image: imageUrl, image_id: data.fileId };
            updateField("items", newItems);
            setIsUploadModalOpen(false);
            setUploadIndex(null);
        } catch (error) {
            console.error("Upload failed:", error);
            showToast("Failed to upload image", "error");
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
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    {isEditMode ? (
                        <EditableText
                            value={item.title}
                            onSave={(val) => updateItem(index, "title", val)}
                            isAdmin={true}
                            className="font-sans text-white mb-2 drop-shadow-md bg-transparent border-b border-white/50 group-hover:border-white transition-colors duration-300 text-center uppercase"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                letterSpacing: "1px",
                                lineHeight: "23.4px"
                            }}
                        />
                    ) : (
                        <h4
                            className="font-sans text-white mb-2 drop-shadow-md text-center uppercase border-b border-white/50 group-hover:border-white transition-colors duration-300 inline-block"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                letterSpacing: "1px",
                                lineHeight: "23.4px"
                            }}
                        >
                            {item.title}
                        </h4>
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
            <div className="w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    {isEditMode ? (
                        <>
                            <EditableText
                                value={subtitle}
                                onSave={(val) => updateField("subtitle", val)}
                                isAdmin={true}
                                className="text-sm font-bold tracking-[0.2em] text-[#006D77] uppercase mb-4 bg-transparent border-b border-gray-300 inline-block"
                            />
                            <div className="block">
                                <EditableText
                                    value={title}
                                    onSave={(val) => updateField("title", val)}
                                    isAdmin={true}
                                    className="text-4xl md:text-5xl font-lora text-slate-900 bg-transparent border-b border-gray-300 inline-block"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-sm font-bold tracking-[0.2em] text-[#006D77] uppercase mb-4">
                                {subtitle}
                            </h2>
                            <h3 className="text-4xl md:text-5xl font-lora text-slate-900">
                                {title}
                            </h3>
                        </>
                    )}
                </motion.div>

                <div className="w-full max-w-[1500px] mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-[40px] md:h-[640px]">
                        {/* Left Column - Tall Item */}
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="w-full h-[400px] md:h-full"
                        >
                            {isEditMode ? (
                                <div className="relative block w-full h-full overflow-hidden rounded-lg group">
                                    {renderItemContent(gridItems[0], 0)}
                                </div>
                            ) : (
                                <Link
                                    href={gridItems[0].link}
                                    className="relative block w-full h-full overflow-hidden rounded-lg group"
                                >
                                    {renderItemContent(gridItems[0], 0)}
                                </Link>
                            )}
                        </motion.div>

                        {/* Right Column - Stacked Items */}
                        <div className="flex flex-col gap-4 md:gap-[40px] h-full">
                            {/* Top Right */}
                            <motion.div
                                initial={{ x: 100, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="w-full h-[250px] md:h-[300px]"
                            >
                                {isEditMode ? (
                                    <div className="relative block w-full h-full overflow-hidden rounded-lg group">
                                        {renderItemContent(gridItems[1], 1)}
                                    </div>
                                ) : (
                                    <Link
                                        href={gridItems[1].link}
                                        className="relative block w-full h-full overflow-hidden rounded-lg group"
                                    >
                                        {renderItemContent(gridItems[1], 1)}
                                    </Link>
                                )}
                            </motion.div>

                            {/* Bottom Right */}
                            <motion.div
                                initial={{ x: 100, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="w-full h-[250px] md:h-[300px]"
                            >
                                {isEditMode ? (
                                    <div className="relative block w-full h-full overflow-hidden rounded-lg group">
                                        {renderItemContent(gridItems[2], 2)}
                                    </div>
                                ) : (
                                    <Link
                                        href={gridItems[2].link}
                                        className="relative block w-full h-full overflow-hidden rounded-lg group"
                                    >
                                        {renderItemContent(gridItems[2], 2)}
                                    </Link>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
                aspectRatio={uploadIndex === 0 ? 3 / 4 : 16 / 9} // Tall for first item, Wide for others
            />
        </section>
    );
}
