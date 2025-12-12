"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

interface SustainabilityBannerSectionProps {
    data?: {
        image?: string;
        text?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityBannerSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityBannerSectionProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop",
        text = "At Kevara, sustainability isn't just a commitment—it's our foundation. We believe that fashion should not come at the expense of our planet. Every piece we create is designed with intention, using responsibly sourced materials and ethical production methods."
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const uploadData = await res.json();
                updateField('image', uploadData.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className="w-full flex justify-center">
            <div className="relative w-full max-w-[1374px] h-[400px]">
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                    <Image
                        src={image}
                        alt="Sustainability"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Centered Text */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ padding: '80px 0' }}
                >
                    <div className="max-w-[800px] px-8">
                        {isEditMode ? (
                            <EditableText
                                value={text}
                                onSave={(val) => updateField("text", val)}
                                isAdmin={true}
                                multiline={true}
                                className="text-[15px] leading-[26px] text-white text-center font-figtree bg-white/10 border-b border-white/30 px-4 py-2"
                            />
                        ) : (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
                                className="text-[15px] leading-[32px] text-white text-center font-figtree overflow-visible"
                            >
                                {text}
                            </motion.p>
                        )}
                    </div>
                </div>

                {/* Upload Overlay (Edit Mode) */}
                {isEditMode && (
                    <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                        <Upload size={16} />
                        <span className="text-sm font-medium text-black">Change Banner</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                        <div className="bg-white px-6 py-3 rounded-lg">
                            <p className="text-sm font-medium text-black">Uploading...</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
