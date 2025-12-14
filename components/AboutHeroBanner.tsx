"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";

interface AboutHeroBannerProps {
    data?: {
        image?: string;
        heading?: string;
        subheading?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutHeroBanner({ data = {}, isEditMode = false, onUpdate }: AboutHeroBannerProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=2070&auto=format&fit=crop",
        heading = "Sorry",
        subheading = "This video does not exist."
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
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const data = await res.json();
                updateField('image', data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className="w-full">
            <div className="relative w-full h-[400px] md:h-[700px] overflow-hidden">
                {/* Background Image */}
                <Image
                    src={image}
                    alt={heading}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

                {/* Upload Button (Edit Mode) */}
                {isEditMode && (
                    <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                        <Upload size={16} />
                        <span className="text-sm font-medium text-black">Change Image</span>
                        <input
                            type="file"
                            accept="image/*,video/*"
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

                {/* Text Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
                    >
                        {isEditMode ? (
                            <EditableText
                                value={heading}
                                onSave={(val) => updateField("heading", val)}
                                isAdmin={true}
                                className="text-3xl md:text-5xl font-lora font-light mb-4 bg-white/10 border-b border-white/30 px-2 py-1"
                            />
                        ) : (
                            <h1 className="text-3xl md:text-5xl font-lora font-light mb-4">
                                {heading}
                            </h1>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.7, 0, 0.84, 0] }}
                    >
                        {isEditMode ? (
                            <EditableText
                                value={subheading}
                                onSave={(val) => updateField("subheading", val)}
                                isAdmin={true}
                                className="text-sm md:text-base font-figtree text-white/80 bg-white/10 border-b border-white/30 px-2 py-1"
                            />
                        ) : (
                            <p className="text-sm md:text-base font-figtree text-white/80">
                                {subheading}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
