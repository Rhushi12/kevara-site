"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { authUpload } from "@/lib/auth-client";
import DimensionBadge from "@/components/admin/DimensionBadge";
import { Plus, Trash2, Upload } from "lucide-react";

interface SalesCard {
    id: number | string;
    image: string;
    label: string;
    title: string;
    buttonText: string;
    buttonLink: string;
    image_id?: string;
}

interface SalesSplitProps {
    data?: {
        cards?: SalesCard[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

const DEFAULT_CARDS: SalesCard[] = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=1000&auto=format&fit=crop",
        label: "Inspired by Play",
        title: "Sleeveless Dress",
        buttonText: "Shop Save", // Kept in data structure for compatibility but not displayed
        buttonLink: "/collections/dresses",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        label: "Buy 1 Get 1 — Holiday Sale!",
        title: "Boys Comfy Styles",
        buttonText: "Shop Save",
        buttonLink: "/collections/sale",
    },
];

export default function SalesSplit({ data, isEditMode = false, onUpdate }: SalesSplitProps) {
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const cards = data?.cards && data.cards.length > 0 ? data.cards : DEFAULT_CARDS;

    const updateCard = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        onUpdate({ ...data, cards: newCards });
    };

    const addCard = () => {
        if (!onUpdate) return;
        const newCard: SalesCard = {
            id: Date.now(),
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop",
            label: "New Promo Label",
            title: "New Title",
            buttonText: "Shop Now",
            buttonLink: "/collections/all",
        };
        onUpdate({ ...data, cards: [...cards, newCard] });
    };

    const removeCard = (index: number) => {
        if (!onUpdate || cards.length <= 1) return;
        const newCards = cards.filter((_, i) => i !== index);
        onUpdate({ ...data, cards: newCards });
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate || uploadingIndex === null) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authUpload('/api/upload', formData);
            const result = await res.json();

            if (!result.success) throw new Error("Upload failed");

            const newCards = [...cards];
            newCards[uploadingIndex] = {
                ...newCards[uploadingIndex],
                image: result.url,
                image_id: result.fileId
            };
            onUpdate({ ...data, cards: newCards });
            setIsUploadModalOpen(false);
            setUploadingIndex(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image");
        }
    };

    return (
        <section className="container mx-auto px-4 py-12 relative">
            {isEditMode && (
                <button
                    onClick={addCard}
                    className="absolute -top-2 right-4 z-20 bg-[#006D77] hover:bg-[#005a63] text-white px-4 py-2 rounded-full text-sm transition-colors shadow-lg flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Card
                </button>
            )}

            <div
                className="flex md:grid gap-4 md:gap-8 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide"
                style={{
                    gridTemplateColumns: `repeat(${cards.length}, 1fr)`
                }}
            >
                {cards.map((card, index) => {
                    const CardContent = (
                        <>
                            <motion.div
                                initial={{ scale: 1.2, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="w-full h-full"
                            >
                                <Image
                                    src={card.image}
                                    alt={card.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                            {/* Dimension Badge for Admin */}
                            <DimensionBadge isAdmin={isEditMode} />

                            {isEditMode ? (
                                <>
                                    {/* Edit Controls */}
                                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setUploadingIndex(index);
                                                setIsUploadModalOpen(true);
                                            }}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Upload size={14} />
                                            Image
                                        </button>
                                        {cards.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeCard(index);
                                                }}
                                                className="bg-red-500/80 hover:bg-red-600/80 text-white p-2 rounded-full transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Editable Content */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                        className="absolute bottom-12 left-8 text-white z-10"
                                    >
                                        <EditableText
                                            value={card.label}
                                            onSave={(val) => updateCard(index, "label", val)}
                                            isAdmin={true}
                                            className="block text-sm font-figtree mb-2 bg-transparent border-b border-white/20"
                                        />
                                        <EditableText
                                            value={card.title}
                                            onSave={(val) => updateCard(index, "title", val)}
                                            isAdmin={true}
                                            className="text-4xl font-lora mb-4 bg-transparent border-b border-white/20"
                                        />
                                        <div className="flex gap-2 items-center mb-4">
                                            <EditableText
                                                value={card.buttonLink}
                                                onSave={(val) => updateCard(index, "buttonLink", val)}
                                                isAdmin={true}
                                                className="text-xs bg-transparent border-b border-white/20 text-white/70"
                                                placeholder="/collections/..."
                                            />
                                        </div>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="absolute bottom-12 left-8 text-white"
                                >
                                    <span className="block text-sm font-figtree mb-2 text-white/90">
                                        {card.label}
                                    </span>
                                    <h3 className="text-4xl font-lora relative inline-block">
                                        {card.title}
                                        <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-500 group-hover:w-full" />
                                    </h3>
                                </motion.div>
                            )}
                        </>
                    );

                    return isEditMode ? (
                        <div
                            key={card.id}
                            className="relative h-[500px] min-w-[85vw] md:min-w-0 md:w-full rounded-2xl overflow-hidden group snap-center"
                        >
                            {CardContent}
                        </div>
                    ) : (
                        <Link
                            key={card.id}
                            href={card.buttonLink}
                            className="relative h-[500px] min-w-[85vw] md:min-w-0 md:w-full rounded-2xl overflow-hidden group snap-center block cursor-pointer"
                        >
                            {CardContent}
                        </Link>
                    );
                })}
            </div>

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setUploadingIndex(null);
                }}
                onUpload={handleImageUpload}
            />
        </section>
    );
}
