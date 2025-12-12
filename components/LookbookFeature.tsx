"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";

interface LookbookFeatureProps {
    data?: {
        title?: string;
        subtitle?: string;
        image?: string;
        image_id?: string;
        cta_text?: string;
        cta_link?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function LookbookFeature({
    data = {},
    isEditMode = false,
    onUpdate
}: LookbookFeatureProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const {
        title = "Home Sanctuary <br /> Lookbook",
        subtitle = "Spring Summer 21'",
        image = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        cta_text = "Discover",
        cta_link = "/pages/lookbook",
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate) return;

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

            onUpdate({ ...data, image: imageUrl, image_id: data.fileId });
            setIsUploadModalOpen(false);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image");
        }
    };

    return (
        <section className="py-24 bg-[#FDFBF7] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="relative max-w-[1374px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-center">
                        {/* Image Section (Span 8 - approx 949px) */}
                        <motion.div
                            initial={{ clipPath: "inset(0 100% 0 0)" }}
                            whileInView={{ clipPath: "inset(0 0 0 0)" }}
                            viewport={{ once: true, amount: 0 }}
                            transition={{ duration: 0.5, ease: [0.64, 0, 0.78, 0] }}
                            className="md:col-span-8 relative h-[700px] w-full"
                        >
                            {image ? (
                                <Image
                                    src={image}
                                    alt={(title || "").replace(/<br\s*\/?>/gi, " ")}
                                    fill
                                    className="object-cover object-right"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                            {isEditMode && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50 transition-colors"
                                >
                                    Change Image
                                </button>
                            )}
                        </motion.div>

                        {/* Floating Card Section (Span 4) */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="md:col-span-4 md:-ml-24 z-10"
                        >
                            <div className="bg-[#0E4D55] p-12 md:p-16 shadow-lg rounded-md">
                                <span className="block text-xs font-bold tracking-[0.2em] text-white uppercase mb-4">
                                    {isEditMode ? (
                                        <EditableText
                                            value={subtitle}
                                            onSave={(val) => updateField("subtitle", val)}
                                            isAdmin={true}
                                            className="bg-transparent border-b border-white/30 w-full text-white"
                                        />
                                    ) : (
                                        subtitle
                                    )}
                                </span>
                                {isEditMode ? (
                                    <div className="mb-8">
                                        <EditableText
                                            value={title}
                                            onSave={(val) => updateField("title", val)}
                                            isAdmin={true}
                                            multiline={true}
                                            className="text-4xl font-lora text-white leading-tight bg-transparent border-b border-gray-300 w-full"
                                        />
                                    </div>
                                ) : (
                                    <h2 className="text-4xl font-lora text-white mb-4 leading-tight whitespace-pre-line">
                                        {title.replace(/<br\s*\/?>/gi, "\n")}
                                    </h2>
                                )}

                                {isEditMode ? (
                                    <div className="flex flex-col gap-2">
                                        <EditableText
                                            value={cta_text}
                                            onSave={(val) => updateField("cta_text", val)}
                                            isAdmin={true}
                                            className="bg-transparent border-b border-gray-300 w-full"
                                            placeholder="CTA Text"
                                        />
                                        <EditableText
                                            value={cta_link}
                                            onSave={(val) => updateField("cta_link", val)}
                                            isAdmin={true}
                                            className="bg-transparent border-b border-gray-300 w-full text-xs"
                                            placeholder="Link URL"
                                        />
                                    </div>
                                ) : (
                                    <LiquidButton
                                        href={cta_link}
                                        className="bg-white text-[#0E4D55] border border-[#0E4D55] hover:bg-[#0E4D55] hover:text-white"
                                    >
                                        {cta_text}
                                    </LiquidButton>
                                )}
                            </div>
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
