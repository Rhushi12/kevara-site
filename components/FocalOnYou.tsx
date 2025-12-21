"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PremiumImageLoader from "@/components/ui/PremiumImageLoader";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import { authUpload } from "@/lib/auth-client";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";

interface FocalItem {
    id: string;
    image: string;
}

interface FocalOnYouProps {
    heading?: string;
    subheading?: string;
    items?: FocalItem[];
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

const DEFAULT_ITEMS: FocalItem[] = [
    { id: "1", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=332&h=332&fit=crop&q=90" },
    { id: "2", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=332&h=332&fit=crop&q=90" },
    { id: "3", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=332&h=332&fit=crop&q=90" },
    { id: "4", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=332&h=332&fit=crop&q=90" },
    { id: "5", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=332&h=332&fit=crop&q=90" },
    { id: "6", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=332&h=332&fit=crop&q=90" },
];

export default function FocalOnYou({
    heading = "Focal on you",
    subheading = "Share your looks on Instagram with #minimumfocal",
    items = DEFAULT_ITEMS,
    isEditMode = false,
    onUpdate
}: FocalOnYouProps) {
    const [localItems, setLocalItems] = useState<FocalItem[]>(items);
    const [localHeading, setLocalHeading] = useState(heading);
    const [localSubheading, setLocalSubheading] = useState(subheading);

    // Sync with props
    useEffect(() => {
        setLocalHeading(heading);
    }, [heading]);

    useEffect(() => {
        setLocalSubheading(subheading);
    }, [subheading]);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);

    const handleUploadComplete = async (file: File) => {
        if (uploadIndex === null) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await authUpload('/api/upload', formData);

            if (res.ok) {
                const data = await res.json();
                const newItems = [...localItems];
                newItems[uploadIndex] = { ...newItems[uploadIndex], image: data.url };
                setLocalItems(newItems);
                if (onUpdate) {
                    onUpdate({ heading: localHeading, subheading: localSubheading, items: newItems });
                }
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

    const updateHeading = (val: string) => {
        setLocalHeading(val);
        if (onUpdate) {
            onUpdate({ heading: val, subheading: localSubheading, items: localItems });
        }
    };

    const updateSubheading = (val: string) => {
        setLocalSubheading(val);
        if (onUpdate) {
            onUpdate({ heading: localHeading, subheading: val, items: localItems });
        }
    };

    return (
        <section className="w-full py-8 md:py-12 px-4 md:px-8 bg-[#E8F5F4]">
            {/* Content Container */}
            <div className="flex flex-col items-center">
                {/* Heading */}
                <div className="mb-4 md:mb-6">
                    {isEditMode ? (
                        <div className="font-lora text-3xl md:text-5xl leading-tight tracking-[-1px] text-center text-[#1a1a1a]">
                            <EditableText
                                value={localHeading}
                                onSave={updateHeading}
                                isAdmin={true}
                                className="bg-white/50 border-b border-teal-300 px-4 py-2"
                            />
                        </div>
                    ) : (
                        <h3 className="font-lora text-3xl md:text-5xl leading-tight tracking-[-1px] text-center text-[#1a1a1a]">
                            {localHeading}
                        </h3>
                    )}
                </div>

                {/* Subheading */}
                <div className="mb-6 md:mb-10">
                    {isEditMode ? (
                        <div className="font-figtree text-sm md:text-[15px] leading-relaxed text-center text-[#1a1a1a]">
                            <EditableText
                                value={localSubheading}
                                onSave={updateSubheading}
                                isAdmin={true}
                                className="bg-white/50 border-b border-teal-300 px-4 py-2"
                            />
                        </div>
                    ) : (
                        <p className="font-figtree text-sm md:text-[15px] leading-relaxed text-center text-[#1a1a1a]">
                            {localSubheading}
                        </p>
                    )}
                </div>

                {/* 6 Square Windows - 3x2 on mobile, 6 in row on desktop */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
                    {localItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="relative overflow-hidden bg-gray-100 group w-24 h-24 md:w-[166px] md:h-[166px] rounded-lg"
                        >
                            <PremiumImageLoader
                                src={item.image}
                                alt="Instagram look"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 96px, 166px"
                                quality={90}
                                unoptimized={item.image.includes('cdn.shopify')}
                            />

                            {/* Edit Mode Upload Overlay */}
                            {isEditMode && (
                                <button
                                    onClick={() => openUploadModal(index)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-full h-full"
                                >
                                    <Upload size={24} className="text-white" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <SimpleImageUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUploadComplete}
                title="Upload Focal Image"
                aspectRatio={1} // Square
            />
        </section>
    );
}
