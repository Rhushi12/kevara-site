"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

interface FocalSectionProps {
    data?: {
        title?: string;
        subtitle?: string;
        description?: string;
        image_url?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (key: string, value: string) => void;
    onImageUpload?: () => void;
    onRemoveImage?: () => void;
}

import EditableText from "@/components/admin/EditableText";
import { ImagePlus } from "lucide-react";

export default function FocalSection({
    data = {},
    isEditMode = false,
    onUpdate = () => { },
    onImageUpload = () => { },
    onRemoveImage = () => { }
}: FocalSectionProps) {
    const { title, subtitle, description, image_url } = data;

    return (
        <section className="relative py-32 overflow-hidden bg-gray-900">
            <div className="absolute inset-0">
                {image_url ? (
                    <Image
                        src={image_url}
                        alt="Focal Background"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        {isEditMode && (
                            <div
                                onClick={onImageUpload}
                                className="flex flex-col items-center text-gray-500 cursor-pointer hover:text-gray-300 transition-colors"
                            >
                                <ImagePlus size={48} className="mb-2" />
                                <span className="uppercase tracking-widest text-sm">Click to Add Background</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-2xl mx-auto text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mb-4"
                    >
                        {isEditMode ? (
                            <EditableText
                                value={subtitle || ""}
                                onSave={(val) => onUpdate("subtitle", val)}
                                isAdmin={true}
                                className="block text-sm font-bold tracking-[0.2em] uppercase min-w-[100px] border-b border-transparent hover:border-white/50"
                                placeholder="SUBTITLE"
                            />
                        ) : (
                            <span className="block text-sm font-bold tracking-[0.2em] uppercase">
                                {subtitle}
                            </span>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8"
                    >
                        {isEditMode ? (
                            <div className="flex flex-col items-center gap-2">
                                <EditableText
                                    value={title || ""}
                                    onSave={(val) => onUpdate("title", val)}
                                    isAdmin={true}
                                    className="text-5xl md:text-6xl font-lora min-w-[200px] border-b border-transparent hover:border-white/50"
                                    placeholder="Title"
                                />
                                {image_url ? (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={onImageUpload}
                                            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm backdrop-blur-sm transition-colors"
                                        >
                                            Change Background
                                        </button>
                                        <button
                                            onClick={onRemoveImage}
                                            className="bg-red-500/80 hover:bg-red-600/80 text-white px-3 py-1 rounded text-sm backdrop-blur-sm transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onImageUpload}
                                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm backdrop-blur-sm transition-colors mt-2"
                                    >
                                        Add Background Image
                                    </button>
                                )}
                            </div>
                        ) : (
                            <h2 className="text-5xl md:text-6xl font-lora">
                                {title}
                            </h2>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-10"
                    >
                        {isEditMode ? (
                            <EditableText
                                value={description || ""}
                                onSave={(val) => onUpdate("description", val)}
                                isAdmin={true}
                                className="text-lg text-gray-200 min-w-[300px] min-h-[60px] border-b border-transparent hover:border-white/50"
                                placeholder="Description text goes here..."
                            />
                        ) : (
                            <p className="text-lg text-gray-200">
                                {description}
                            </p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <LiquidButton href="/collections/all" className="bg-white text-slate-900 hover:bg-gray-100">
                            Explore Collection
                        </LiquidButton>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
