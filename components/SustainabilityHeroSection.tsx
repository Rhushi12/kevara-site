"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";

interface SustainabilityHeroSectionProps {
    data?: {
        image?: string;
        smallHeading?: string;
        heading?: string;
        description?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityHeroSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityHeroSectionProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
        smallHeading = "OUR COMMITMENT",
        heading = "Crafted For A Better Tomorrow",
        description = "At Kevara, sustainability isn't just a commitment—it's our foundation. We believe that fashion should not come at the expense of our planet. Every piece we create is designed with intention, using responsibly sourced materials and ethical production methods."
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
        <section className="w-full bg-[#006D77]">
            <div
                className="w-full max-w-[1500px] mx-auto flex flex-col md:flex-row relative px-4 md:px-8"
            >
                {/* Left: Image Block */}
                <div
                    className="relative flex-shrink-0 rounded-sm overflow-hidden w-full md:w-[509px] h-[350px] md:h-[509px] mt-8 md:mt-[80px] mx-auto md:mx-0 md:ml-[107px]"
                >
                    <Image
                        src={image}
                        alt="Sustainability"
                        fill
                        className="object-cover"
                    />

                    {/* Upload Overlay (Edit Mode) */}
                    {isEditMode && (
                        <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                            <Upload size={14} />
                            <span className="text-xs font-medium text-black">Change</span>
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
                            <div className="bg-white px-4 py-2 rounded-lg">
                                <p className="text-xs font-medium text-black">Uploading...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Text Container */}
                <div
                    className="flex-1 flex items-center justify-center py-8 md:py-[80px] px-4 md:pr-[111px]"
                >
                    <div className="flex flex-col items-center text-center max-w-[500px]">
                        {/* Small Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
                        >
                            {isEditMode ? (
                                <EditableText
                                    value={smallHeading}
                                    onSave={(val) => updateField("smallHeading", val)}
                                    isAdmin={true}
                                    className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-white font-figtree text-center bg-white/10 border-b border-white/30 px-2 py-1"
                                />
                            ) : (
                                <p className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-white font-figtree">
                                    {smallHeading}
                                </p>
                            )}
                        </motion.div>

                        {/* Main Heading */}
                        <motion.div
                            className="mt-4 md:mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1, ease: [0.7, 0, 0.84, 0] }}
                        >
                            {isEditMode ? (
                                <EditableText
                                    value={heading}
                                    onSave={(val) => updateField("heading", val)}
                                    isAdmin={true}
                                    className="text-[28px] md:text-[36px] leading-[32px] md:leading-[40px] tracking-[-0.8px] text-white font-lora text-center bg-white/10 border-b border-white/30 px-2 py-1"
                                />
                            ) : (
                                <h1 className="text-[28px] md:text-[36px] leading-[32px] md:leading-[40px] tracking-[-0.8px] text-white font-lora">
                                    {heading}
                                </h1>
                            )}
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            className="mt-4 md:mt-6"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {isEditMode ? (
                                <EditableText
                                    value={description}
                                    onSave={(val) => updateField("description", val)}
                                    isAdmin={true}
                                    multiline={true}
                                    className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-white font-figtree text-center bg-white/10 border-b border-white/30 px-2 py-1"
                                />
                            ) : (
                                <p className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-white font-figtree">
                                    {description}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
