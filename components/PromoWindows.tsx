"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";

interface PromoWindowsProps {
    data?: {
        windows?: Array<{
            id: string;
            image: string;
            title: string;
            subtitle: string;
            link: string;
            linkText: string;
        }>;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function PromoWindows({ data = {}, isEditMode = false, onUpdate }: PromoWindowsProps) {
    const defaultWindows = [
        {
            id: "promo-1",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=500&auto=format&fit=crop",
            title: "ESSENTIALS",
            subtitle: "Basics that never go out of style",
            link: "/collections/essentials",
            linkText: "Shop Now"
        },
        {
            id: "promo-2",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500&auto=format&fit=crop",
            title: "FEATURED",
            subtitle: "This season's must-haves",
            link: "/collections/featured",
            linkText: "Explore"
        }
    ];

    const windows = data.windows || defaultWindows;

    const updateWindow = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newWindows = [...windows];
        newWindows[index] = { ...newWindows[index], [field]: value };
        onUpdate({ windows: newWindows });
    };

    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIndex(index);
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
                const newWindows = [...windows];
                newWindows[index] = { ...newWindows[index], image: data.url };
                if (onUpdate) onUpdate({ windows: newWindows });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            setUploadingIndex(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {windows.map((window, index) => (
                <motion.div
                    key={window.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative w-full md:max-w-[482px] aspect-[4/5] md:aspect-auto md:h-[320px] rounded-sm overflow-hidden group mx-auto"
                >
                    {/* Background Image */}
                    <Image
                        src={window.image}
                        alt={window.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />



                    {/* Upload Button (Edit Mode) */}
                    {isEditMode && (
                        <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-50">
                            <span className="text-xs font-medium text-black">Change Image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(index, e)}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    )}

                    {isUploading && uploadingIndex === index && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white px-4 py-2 rounded-lg">
                                <p className="text-xs font-medium text-black">Uploading...</p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 px-6 py-12 md:px-[55px] md:py-[104px] flex flex-col items-start bg-transparent">
                        {isEditMode ? (
                            <>
                                <EditableText
                                    value={window.subtitle}
                                    onSave={(val) => updateWindow(index, "subtitle", val)}
                                    isAdmin={true}
                                    className="text-[13px] font-semibold text-white font-sans tracking-[1px] leading-[16px] mb-4 uppercase bg-white/10 border-b border-white/30 px-2 py-1"
                                />
                                <EditableText
                                    value={window.title}
                                    onSave={(val) => updateWindow(index, "title", val)}
                                    isAdmin={true}
                                    className="text-[30px] font-lora text-white tracking-[-0.7px] leading-[34px] my-6 bg-white/10 border-b border-white/30 px-2 py-1"
                                />
                                <EditableText
                                    value={window.linkText}
                                    onSave={(val) => updateWindow(index, "linkText", val)}
                                    isAdmin={true}
                                    className="text-[13px] font-semibold text-white font-sans tracking-[1px] leading-[23.4px] mt-4 uppercase underline hover:no-underline bg-white/10 border-b border-white/30 px-2 py-1 w-fit"
                                />
                            </>
                        ) : (
                            <>
                                <p className="text-[13px] font-semibold text-white font-sans tracking-[1px] leading-[16px] mb-4 uppercase">
                                    {window.subtitle}
                                </p>
                                <h3 className="text-[30px] font-lora text-white tracking-[-0.7px] leading-[34px] my-6">
                                    {window.title}
                                </h3>
                                <Link
                                    href={window.link}
                                    className="text-[13px] font-semibold text-white font-sans tracking-[1px] leading-[23.4px] mt-4 uppercase underline hover:no-underline transition-all inline-block group-hover:translate-x-1"
                                >
                                    {window.linkText}
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
