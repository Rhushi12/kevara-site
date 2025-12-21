"use client";

import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { authUpload } from "@/lib/auth-client";
import { useState } from "react";

interface FeaturedInProps {
    data?: {
        title?: string;
        brands?: Array<{
            name: string;
            logo?: string;
        }>;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function FeaturedIn({ data = {}, isEditMode = false, onUpdate }: FeaturedInProps) {
    const defaultBrands = [
        { name: "VOGUE", logo: "" },
        { name: "ELLE", logo: "" },
        { name: "GQ", logo: "" },
        { name: "HARPER'S BAZAAR", logo: "" }
    ];

    const {
        title = "FEATURED IN",
        brands = defaultBrands
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);

    const handleUploadComplete = async (file: File) => {
        if (uploadIndex === null || !onUpdate) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const result = await res.json();
                const newBrands = [...brands];
                newBrands[uploadIndex] = { ...newBrands[uploadIndex], logo: result.url };
                onUpdate({ ...data, brands: newBrands });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadModalOpen(false);
            setUploadIndex(null);
        }
    };

    const openUploadModal = (index: number) => {
        setUploadIndex(index);
        setUploadModalOpen(true);
    };

    return (
        <section className="py-16 md:py-24 bg-[#FDFBF7]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    {isEditMode ? (
                        <EditableText
                            value={title}
                            onSave={(val) => updateField("title", val)}
                            isAdmin={true}
                            className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-gray-500 mb-8 bg-transparent border-b border-gray-300 inline-block px-4"
                        />
                    ) : (
                        <h2 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-gray-500 mb-8">
                            {title}
                        </h2>
                    )}
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
                    {brands.map((brand, index) => (
                        <motion.div
                            key={brand.name}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-center relative group p-4"
                        >
                            {/* Logo or Text */}
                            {brand.logo ? (
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-8 md:h-12 w-auto grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                                />
                            ) : (
                                <div className="text-center">
                                    <span className="text-lg md:text-2xl font-bold text-gray-400 hover:text-[#006D77] transition-colors tracking-tight">
                                        {brand.name}
                                    </span>
                                </div>
                            )}

                            {/* Edit Mode Upload Overlay */}
                            {isEditMode && (
                                <button
                                    onClick={() => openUploadModal(index)}
                                    className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300"
                                    title="Upload Logo"
                                >
                                    <Upload size={20} className="text-gray-600" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>


            <SimpleImageUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUploadComplete}
                title="Upload Brand Logo"
                aspectRatio={undefined} // Free crop for logos
            />
        </section >
    );
}
