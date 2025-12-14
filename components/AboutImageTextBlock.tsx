"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";

interface AboutImageTextBlockProps {
    data?: {
        image?: string;
        heading?: string;
        description?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutImageTextBlock({ data = {}, isEditMode = false, onUpdate }: AboutImageTextBlockProps) {
    const [isUploading, setIsUploading] = useState(false);

    const {
        image = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
        heading = "Minimum is quintessentially bridging our rich nordic heritage with a minimalistic approach to design.",
        description = "We believe in creating timeless pieces that transcend seasonal trends, focusing on quality materials and sustainable practices that honor both our heritage and our future."
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

    return (
        <section className="w-full mt-12 md:mt-20 px-4">
            <div className="relative w-full max-w-[1500px] mx-auto min-h-[500px] md:min-h-[669px] overflow-hidden">
                {/* Split Background */}
                <div className="absolute inset-0 flex">
                    <div className="w-[30%] bg-[#E8F5F5]" />
                    <div className="w-[70%] bg-white" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col md:flex-row items-center h-full py-12 md:py-0">
                    {/* Image - Left Side */}
                    <motion.div
                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                        whileInView={{ clipPath: 'inset(0 0 0 0)' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.7, 0, 0.84, 0] }}
                        className="relative w-[280px] h-[280px] md:w-[509px] md:h-[509px] md:ml-[107px] flex-shrink-0 shadow-lg mx-auto md:mx-0 rounded-lg overflow-hidden"
                    >
                        <Image
                            src={image}
                            alt={heading}
                            fill
                            className="object-cover rounded-lg"
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

                    {/* Text - Right Side */}
                    <div className="flex-1 flex items-center justify-center px-4 md:px-12 mt-8 md:mt-0">
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
                            className="w-full max-w-[576px] text-center"
                        >
                            {/* Heading */}
                            <motion.div variants={fadeInUp} className="mb-6">
                                {isEditMode ? (
                                    <EditableText
                                        value={heading}
                                        onSave={(val) => updateField("heading", val)}
                                        isAdmin={true}
                                        multiline={true}
                                        className="text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] text-[#1a1a1a] font-lora italic bg-gray-100 border-b border-gray-300 px-2 py-1 w-full text-center"
                                    />
                                ) : (
                                    <h3 className="text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] text-[#1a1a1a] font-lora italic">
                                        {heading}
                                    </h3>
                                )}
                            </motion.div>

                            {/* Description */}
                            <motion.div variants={fadeInUp}>
                                {isEditMode ? (
                                    <EditableText
                                        value={description}
                                        onSave={(val) => updateField("description", val)}
                                        isAdmin={true}
                                        multiline={true}
                                        className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree bg-gray-100 border-b border-gray-300 px-2 py-1 w-full text-center"
                                    />
                                ) : (
                                    <p className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree">
                                        {description}
                                    </p>
                                )}
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
