"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";
import { useState } from "react";
import { Upload } from "lucide-react";

interface AboutUsSectionProps {
    data?: {
        label?: string;
        heading?: string;
        description?: string;
        buttonText?: string;
        buttonLink?: string;
        image?: string;
        imageTag?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutUsSection({ data = {}, isEditMode = false, onUpdate }: AboutUsSectionProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        label = "ABOUT US",
        heading = "Our Story",
        description = "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
        buttonText = "LEARN MORE",
        buttonLink = "/pages/about-us",
        image = "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
        imageTag = "Philosophy"
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
        <section className="relative h-[669px] overflow-hidden">
            {/* Split Background: 70% Teal (Left) / 30% Cream (Right) - INVERTED */}
            <div className="absolute inset-0 flex">
                <div className="w-[70%] bg-[#003840]" />
                <div className="w-[30%] bg-warm-cream" />
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-4 h-full relative z-10">
                <div className="flex items-center justify-center h-full">

                    {/* Text Content (Centered on Teal Background - Left Side) - INVERTED */}
                    <div className="absolute left-0 w-[calc(100%-616px-107px)] text-center text-white flex items-center justify-center h-full">
                        <div className="px-8 max-w-2xl mx-auto">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={{
                                    hidden: {},
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.15
                                        }
                                    }
                                }}
                                className="max-w-2xl mx-auto"
                            >
                                {/* Small Subheading (Figtree) */}
                                <motion.div variants={fadeInUp} className="mb-6">
                                    {isEditMode ? (
                                        <EditableText
                                            value={label}
                                            onSave={(val) => updateField("label", val)}
                                            isAdmin={true}
                                            className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white/90 font-figtree bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                                        />
                                    ) : (
                                        <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white/90 font-figtree">
                                            {label}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Heading (Lora) */}
                                <motion.div variants={fadeInUp} className="mb-8">
                                    {isEditMode ? (
                                        <EditableText
                                            value={heading}
                                            onSave={(val) => updateField("heading", val)}
                                            isAdmin={true}
                                            className="text-[36px] font-lora leading-tight text-white bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                                        />
                                    ) : (
                                        <h2 className="text-[36px] font-lora leading-tight text-white">
                                            {heading}
                                        </h2>
                                    )}
                                </motion.div>

                                {/* Description */}
                                <motion.div variants={fadeInUp} className="mb-10">
                                    {isEditMode ? (
                                        <EditableText
                                            value={description}
                                            onSave={(val) => updateField("description", val)}
                                            isAdmin={true}
                                            className="text-[15px] leading-relaxed font-figtree text-white/85 max-w-xl mx-auto bg-white/10 border-b border-white/30 px-2 py-1"
                                            multiline={true}
                                        />
                                    ) : (
                                        <p className="text-[15px] leading-relaxed font-figtree text-white/85 max-w-xl mx-auto">
                                            {description}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Button */}
                                <motion.div variants={fadeInUp}>
                                    {isEditMode ? (
                                        <div className="space-y-2 inline-block">
                                            <EditableText
                                                value={buttonText}
                                                onSave={(val) => updateField("buttonText", val)}
                                                isAdmin={true}
                                                className="bg-white text-[#003840] px-10 py-4 rounded-sm font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-gray-100 transition-all hover:shadow-lg inline-block border border-white/30 font-figtree"
                                            />
                                            <EditableText
                                                value={buttonLink}
                                                onSave={(val) => updateField("buttonLink", val)}
                                                isAdmin={true}
                                                className="block text-[10px] text-white/60 bg-white/10 border-b border-white/30 px-2 py-1 mt-2 font-figtree"
                                            />
                                        </div>
                                    ) : (
                                        <Link
                                            href={buttonLink}
                                            className="bg-white text-[#003840] px-10 py-4 rounded-sm font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-gray-100 transition-all hover:shadow-lg inline-block font-figtree"
                                        >
                                            {buttonText}
                                        </Link>
                                    )}
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Floating Image (Right Side) - INVERTED */}
                    <div className="absolute right-[107px] top-1/2 -translate-y-1/2 z-20">
                        <motion.div
                            className="relative w-[509px] h-[509px] shadow-2xl overflow-hidden rounded-sm"
                            initial={{ clipPath: 'inset(0 100% 0 0)' }} // Hide from right
                            whileInView={{ clipPath: 'inset(0 0 0 0)' }} // Reveal left to right
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.64, 0, 0.78, 0] }}
                        >
                            <Image
                                src={image}
                                alt={heading}
                                fill
                                className="object-cover"
                            />

                            {/* Image Tag */}
                            <div className="absolute top-4 right-4 z-30">
                                {isEditMode ? (
                                    <EditableText
                                        value={imageTag}
                                        onSave={(val) => updateField("imageTag", val)}
                                        isAdmin={true}
                                        className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm font-medium border border-white/30 font-figtree"
                                    />
                                ) : (
                                    <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm font-medium font-figtree">
                                        {imageTag}
                                    </span>
                                )}
                            </div>

                            {/* Upload Button (Edit Mode) */}
                            {isEditMode && (
                                <label className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
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
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};
