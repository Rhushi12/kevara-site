"use client";

import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";

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
                            className="flex items-center justify-center"
                        >
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
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
