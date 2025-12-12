"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const newItems = [...localItems];
                newItems[index] = { ...newItems[index], image: data.url };
                setLocalItems(newItems);
                if (onUpdate) {
                    onUpdate({ heading: localHeading, subheading: localSubheading, items: newItems });
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        }
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
        <section
            className="mx-auto relative"
            style={{
                width: "1374px",
                maxWidth: "100%",
                height: "478px",
                backgroundColor: "#E8F5F4"
            }}
        >
            {/* Heading - 80px from top */}
            <div
                className="absolute left-0 right-0 flex justify-center"
                style={{ top: "80px" }}
            >
                {isEditMode ? (
                    <div className="font-lora text-[48px] leading-[52px] tracking-[-1px] text-center text-[#1a1a1a]">
                        <EditableText
                            value={localHeading}
                            onSave={updateHeading}
                            isAdmin={true}
                            className="bg-white/50 border-b border-teal-300 px-4 py-2"
                        />
                    </div>
                ) : (
                    <h3
                        className="font-lora"
                        style={{
                            color: "#1a1a1a",
                            fontSize: "48px",
                            letterSpacing: "-1px",
                            lineHeight: "52px",
                            textAlign: "center"
                        }}
                    >
                        {localHeading}
                    </h3>
                )}
            </div>

            {/* Subheading - 156px from top */}
            <div
                className="absolute left-0 right-0 flex justify-center"
                style={{ top: "156px" }}
            >
                {isEditMode ? (
                    <div className="font-figtree text-[15px] leading-[26px] text-center text-[#1a1a1a]">
                        <EditableText
                            value={localSubheading}
                            onSave={updateSubheading}
                            isAdmin={true}
                            className="bg-white/50 border-b border-teal-300 px-4 py-2"
                        />
                    </div>
                ) : (
                    <p
                        className="font-figtree"
                        style={{
                            color: "#1a1a1a",
                            fontSize: "15px",
                            lineHeight: "26px",
                            textAlign: "center"
                        }}
                    >
                        {localSubheading}
                    </p>
                )}
            </div>

            {/* 6 Square Windows - 230px from top, 24px gap */}
            <div
                className="absolute left-0 right-0 flex justify-center items-center"
                style={{
                    top: "230px",
                    gap: "24px"
                }}
            >
                {localItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="relative overflow-hidden bg-gray-100 group"
                        style={{
                            width: "166px",
                            height: "166px",
                            borderRadius: "8px"
                        }}
                    >
                        <Image
                            src={item.image}
                            alt="Instagram look"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 166px, (max-width: 1200px) 332px, 664px"
                            quality={90}
                            unoptimized={item.image.includes('shopify') || item.image.includes('cdn.shopify')}
                        />

                        {/* Edit Mode Upload Overlay */}
                        {isEditMode && (
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                                <Upload size={24} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, index)}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
