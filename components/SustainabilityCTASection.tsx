"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

interface SustainabilityCTASectionProps {
    data?: {
        image?: string;
        smallHeading?: string;
        heading?: string;
        buttonText?: string;
        buttonLink?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityCTASection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityCTASectionProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=2000&auto=format&fit=crop",
        smallHeading = "JOIN THE MOVEMENT",
        heading = "Together, We Can Make Fashion Sustainable",
        buttonText = "Learn More",
        buttonLink = "/about/story"
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
        <section className="w-full flex justify-center" style={{ marginTop: '80px' }}>
            <motion.div
                className="relative w-full overflow-hidden"
                style={{
                    maxWidth: '1374px',
                    height: '500px'
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                {/* Background Image with Zoom Out Animation */}
                <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 1.15 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <Image
                        src={image}
                        alt="Call to Action"
                        fill
                        className="object-cover"
                    />
                </motion.div>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    {/* Small Heading with Scroll Up Animation */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
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

                    {/* Main Heading with Scroll Up Animation */}
                    <motion.div
                        className="mt-6 max-w-[800px]"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        {isEditMode ? (
                            <EditableText
                                value={heading}
                                onSave={(val) => updateField("heading", val)}
                                isAdmin={true}
                                className="text-[48px] leading-[52px] tracking-[-1px] text-white font-lora text-center bg-white/10 border-b border-white/30 px-2 py-1"
                            />
                        ) : (
                            <h2 className="text-[48px] leading-[52px] tracking-[-1px] text-white font-lora">
                                {heading}
                            </h2>
                        )}
                    </motion.div>

                    {/* Button with Scroll Up Animation */}
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        {isEditMode ? (
                            <div className="flex flex-col gap-2 items-center">
                                <EditableText
                                    value={buttonText}
                                    onSave={(val) => updateField("buttonText", val)}
                                    isAdmin={true}
                                    className="text-white bg-white/10 border-b border-white/30 px-2 py-1 text-center"
                                />
                                <EditableText
                                    value={buttonLink}
                                    onSave={(val) => updateField("buttonLink", val)}
                                    isAdmin={true}
                                    className="text-white/70 text-sm bg-white/10 border-b border-white/30 px-2 py-1 text-center"
                                    placeholder="Button Link"
                                />
                            </div>
                        ) : (
                            <Link
                                href={buttonLink}
                                className="inline-block px-8 py-3 bg-white text-[#1a1a1a] font-figtree font-medium text-[14px] tracking-wide uppercase hover:bg-gray-100 transition-colors"
                            >
                                {buttonText}
                            </Link>
                        )}
                    </motion.div>
                </div>

                {/* Upload Overlay (Edit Mode) */}
                {isEditMode && (
                    <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2 z-30">
                        <Upload size={16} />
                        <span className="text-sm font-medium text-black">Change Image</span>
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
            </motion.div>
        </section>
    );
}
