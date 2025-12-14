"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";

interface ValueItem {
    image: string;
    heading: string;
    description: string;
}

interface SustainabilityValuesSectionProps {
    data?: {
        smallHeading?: string;
        mainHeading?: string;
        description?: string;
        items?: ValueItem[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityValuesSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityValuesSectionProps) {
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const {
        smallHeading = "OUR COMMITMENT",
        mainHeading = "Building a Sustainable Future",
        description = "We believe in creating fashion that respects both people and planet. Every decision we make is guided by our commitment to sustainability, from the materials we choose to the partners we work with.",
        items = [
            {
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
                heading: "Eco-Friendly Materials",
                description: "We source organic cotton, recycled polyester, and innovative sustainable fabrics to minimize our environmental footprint."
            },
            {
                image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                heading: "Ethical Manufacturing",
                description: "Our factories meet the highest standards for worker welfare, ensuring fair wages and safe working conditions."
            },
            {
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                heading: "Carbon Neutral Shipping",
                description: "We offset 100% of our shipping emissions through verified carbon offset programs and sustainable logistics."
            },
            {
                image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
                heading: "Circular Design",
                description: "Our garments are designed for longevity and recyclability, closing the loop on fashion waste."
            }
        ]
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const updateItem = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate({ ...data, items: newItems });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const uploadData = await res.json();
                updateItem(index, 'image', uploadData.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingIndex(null);
        }
    };

    return (
        <section className="w-full mt-12 md:mt-20">
            <div
                className="w-full max-w-[1500px] mx-auto flex flex-col items-center px-4 md:px-0"
            >
                {/* Header Text Container */}
                <div
                    className="flex flex-col items-center text-center w-full md:w-[800px] px-4"
                >
                    {/* Small Heading */}
                    {isEditMode ? (
                        <EditableText
                            value={smallHeading}
                            onSave={(val) => updateField("smallHeading", val)}
                            isAdmin={true}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree text-center mb-4 bg-gray-100 border-b border-gray-300 px-2 py-1"
                        />
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree mb-4"
                        >
                            {smallHeading}
                        </motion.p>
                    )}

                    {/* Main Heading */}
                    <div className="mt-4 md:mt-6">
                        {isEditMode ? (
                            <EditableText
                                value={mainHeading}
                                onSave={(val) => updateField("mainHeading", val)}
                                isAdmin={true}
                                className="text-[28px] md:text-[36px] leading-[32px] md:leading-[40px] tracking-[-0.8px] text-[#1a1a1a] font-lora text-center mb-4 bg-gray-100 border-b border-gray-300 px-2 py-1"
                            />
                        ) : (
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1, ease: [0.7, 0, 0.84, 0] }}
                                className="text-[28px] md:text-[36px] leading-[32px] md:leading-[40px] tracking-[-0.8px] text-[#1a1a1a] font-lora mb-4"
                            >
                                {mainHeading}
                            </motion.h2>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mt-4 md:mt-6">
                        {isEditMode ? (
                            <EditableText
                                value={description}
                                onSave={(val) => updateField("description", val)}
                                isAdmin={true}
                                multiline={true}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree text-center bg-gray-100 border-b border-gray-300 px-2 py-1"
                            />
                        ) : (
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree mt-4"
                            >
                                {description}
                            </motion.p>
                        )}
                    </div>
                </div>

                {/* 2x2 Image Grid - becomes 1 column on mobile */}
                <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-8 md:mt-12 w-full"
                    style={{ maxWidth: '852px' }}
                >
                    {items.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="flex flex-col"
                        >
                            {/* Image */}
                            <div
                                className="relative rounded-sm overflow-hidden w-full aspect-square"
                            >
                                <Image
                                    src={item.image}
                                    alt={item.heading}
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
                                            onChange={(e) => handleImageUpload(e, idx)}
                                            className="hidden"
                                            disabled={uploadingIndex === idx}
                                        />
                                    </label>
                                )}

                                {uploadingIndex === idx && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                                        <div className="bg-white px-4 py-2 rounded-lg">
                                            <p className="text-xs font-medium text-black">Uploading...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Heading */}
                            <div className="mt-4 md:mt-6">
                                {isEditMode ? (
                                    <EditableText
                                        value={item.heading}
                                        onSave={(val) => updateItem(idx, "heading", val)}
                                        isAdmin={true}
                                        className="text-[20px] md:text-[24px] leading-[24px] md:leading-[28px] tracking-[-0.4px] text-[#1a1a1a] font-lora text-left mb-4 bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                                    />
                                ) : (
                                    <h3 className="text-[20px] md:text-[24px] leading-[24px] md:leading-[28px] tracking-[-0.4px] text-[#1a1a1a] font-lora text-left mb-2 md:mb-4">
                                        {item.heading}
                                    </h3>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mt-2">
                                {isEditMode ? (
                                    <EditableText
                                        value={item.description}
                                        onSave={(val) => updateItem(idx, "description", val)}
                                        isAdmin={true}
                                        multiline={true}
                                        className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree text-left bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                                    />
                                ) : (
                                    <p className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree text-left">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
