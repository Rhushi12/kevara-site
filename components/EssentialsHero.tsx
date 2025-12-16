"use client";

import Image from "next/image";
import PremiumImageLoader from "@/components/ui/PremiumImageLoader";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";
import { useState } from "react";
import { Upload } from "lucide-react";
import { authUpload } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";

interface EssentialsHeroProps {
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

export default function EssentialsHero({ data = {}, isEditMode = false, onUpdate }: EssentialsHeroProps) {
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    const {
        label = "ESSENTIALS",
        heading = "More than basics",
        description = "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
        buttonText = "LEARN MORE",
        buttonLink = "/collections/essentials",
        image = "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
        imageTag = "Fighter"
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
            showToast('Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className="relative w-full overflow-hidden flex flex-col md:block md:h-[669px]">
            {/* Split Background: Mobile (Top Cream/Bottom Teal) vs Desktop (Left Cream/Right Teal) */}
            <div className="absolute inset-0 flex flex-col md:flex-row">
                <div className="h-[40%] md:h-full md:w-[30%] bg-warm-cream" />
                <div className="h-[60%] md:h-full md:w-[70%] bg-[#003840]" />
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-4 h-full relative z-10 flex flex-col md:block">
                <div className="flex flex-col md:flex-row items-center justify-center h-full pt-12 md:pt-0">

                    {/* Floating Image (70% on cream, 30% on teal) - Mobile: Centered Top */}
                    <div className="relative md:absolute md:left-[107px] md:top-1/2 md:-translate-y-1/2 z-20 mb-8 md:mb-0">
                        <motion.div
                            className="relative w-[300px] h-[300px] md:w-[509px] md:h-[509px] shadow-2xl overflow-hidden rounded-sm mx-auto"
                            initial={{ clipPath: 'inset(0 0 0 100%)' }} // Hide from left
                            whileInView={{ clipPath: 'inset(0 0 0 0)' }} // Reveal right to left
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.7, 0, 0.84, 0] }}
                        >
                            <PremiumImageLoader
                                src={image}
                                alt={heading}
                                fill
                                className="object-cover"
                                quality={100}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />

                            {/* Upload Button (Edit Mode) */}
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
                        </motion.div>
                    </div>

                    {/* Text Content (Centered on Teal Background) */}
                    <div className="relative md:absolute md:right-0 w-full md:w-[calc(100%-616px-107px)] text-center text-white flex items-center justify-center pb-12 md:pb-0 md:h-full">
                        <div className="px-4 md:px-8 max-w-2xl mx-auto">
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
                                <motion.div variants={fadeInUp} className="mb-4 md:mb-6">
                                    {isEditMode ? (
                                        <EditableText
                                            value={label}
                                            onSave={(val) => updateField("label", val)}
                                            isAdmin={true}
                                            className="text-[11px] md:text-[13px] font-semibold tracking-[0.2em] uppercase text-white/90 font-figtree bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                                        />
                                    ) : (
                                        <p className="text-[11px] md:text-[13px] font-semibold tracking-[0.2em] uppercase text-white/90 font-figtree">
                                            {label}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Heading (Lora) */}
                                <motion.div variants={fadeInUp} className="mb-6 md:mb-8">
                                    {isEditMode ? (
                                        <EditableText
                                            value={heading}
                                            onSave={(val) => updateField("heading", val)}
                                            isAdmin={true}
                                            className="text-[28px] md:text-[36px] font-lora leading-tight text-white bg-white/10 border-b border-white/30 px-2 py-1 inline-block"
                                        />
                                    ) : (
                                        <h2 className="text-[28px] md:text-[36px] font-lora leading-tight text-white">
                                            {heading}
                                        </h2>
                                    )}
                                </motion.div>

                                {/* Description */}
                                <motion.div variants={fadeInUp} className="mb-8 md:mb-10">
                                    {isEditMode ? (
                                        <EditableText
                                            value={description}
                                            onSave={(val) => updateField("description", val)}
                                            isAdmin={true}
                                            className="text-[13px] md:text-[15px] leading-relaxed font-figtree text-white/85 max-w-xl mx-auto bg-white/10 border-b border-white/30 px-2 py-1"
                                            multiline={true}
                                        />
                                    ) : (
                                        <p className="text-[13px] md:text-[15px] leading-relaxed font-figtree text-white/85 max-w-xl mx-auto">
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
                                                className="bg-white text-[#003840] px-8 md:px-10 py-3 md:py-4 rounded-sm font-bold text-[11px] md:text-[13px] tracking-[0.2em] uppercase hover:bg-gray-100 transition-all hover:shadow-lg inline-block border border-white/30 font-figtree"
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
                                            className="bg-white text-[#003840] px-8 md:px-10 py-3 md:py-4 rounded-sm font-bold text-[11px] md:text-[13px] tracking-[0.2em] uppercase hover:bg-gray-100 transition-all hover:shadow-lg inline-block font-figtree"
                                        >
                                            {buttonText}
                                        </Link>
                                    )}
                                </motion.div>
                            </motion.div>
                        </div>

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
            duration: 0.6,
            ease: [0.7, 0, 0.84, 0] as const
        }
    }
};
