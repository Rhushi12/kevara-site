"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Upload, Plus, Trash2, Edit2 } from "lucide-react";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { authUpload } from "@/lib/auth-client";

interface CategoryItem {
    id: string;
    image: string;
    name: string;
    link: string;
}

interface CategoryCarouselProps {
    categories?: CategoryItem[];
    isEditMode?: boolean;
    onUpdate?: (categories: CategoryItem[]) => void;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
    { id: "1", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=166&h=208&fit=crop&q=80", name: "Dresses", link: "/collections/dresses" },
    { id: "2", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=166&h=208&fit=crop&q=80", name: "Jackets", link: "/collections/jackets" },
    { id: "3", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=166&h=208&fit=crop&q=80", name: "Shirts", link: "/collections/shirts" },
    { id: "4", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=166&h=208&fit=crop&q=80", name: "T-Shirts", link: "/collections/tshirts" },
    { id: "5", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=166&h=208&fit=crop&q=80", name: "Pants", link: "/collections/pants" },
    { id: "6", image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=166&h=208&fit=crop&q=80", name: "Skirts", link: "/collections/skirts" },
    { id: "7", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=166&h=208&fit=crop&q=80", name: "Knitwear", link: "/collections/knitwear" },
    { id: "8", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=166&h=208&fit=crop&q=80", name: "Tops", link: "/collections/tops" },
];

export default function CategoryCarousel({
    categories = DEFAULT_CATEGORIES,
    isEditMode = false,
    onUpdate
}: CategoryCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    const updateCategory = (index: number, field: keyof CategoryItem, value: string) => {
        if (!onUpdate) return;
        const newCategories = [...categories];
        newCategories[index] = { ...newCategories[index], [field]: value };
        onUpdate(newCategories);
    };

    const handleImageUpload = async (file: File) => {
        if (uploadingIndex === null || !onUpdate) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authUpload('/api/upload', formData);
            const result = await res.json();

            if (!result.success) throw new Error("Upload failed");

            const newCategories = [...categories];
            newCategories[uploadingIndex] = { ...newCategories[uploadingIndex], image: result.url };
            onUpdate(newCategories);
            setIsUploadModalOpen(false);
            setUploadingIndex(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image");
        }
    };

    const addCategory = () => {
        if (!onUpdate) return;
        const newCategory: CategoryItem = {
            id: Date.now().toString(),
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=166&h=208&fit=crop&q=80",
            name: "New Category",
            link: "/collections/new"
        };
        onUpdate([...categories, newCategory]);
    };

    const removeCategory = (index: number) => {
        if (!onUpdate || categories.length <= 1) return;
        const newCategories = categories.filter((_, i) => i !== index);
        onUpdate(newCategories);
        setEditingIndex(null);
    };

    return (
        <div
            className="w-full bg-[#FDFBF7] flex items-center justify-center relative h-[257px] my-10"
        >
            {/* Add Category Button (Edit Mode) */}
            {isEditMode && (
                <button
                    onClick={addCategory}
                    className="absolute -top-2 right-0 z-20 bg-[#006D77] hover:bg-[#005a63] text-white px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1 shadow-lg"
                >
                    <Plus size={14} /> Add Category
                </button>
            )}

            <div className="relative w-full h-full flex items-center">
                {/* Left Arrow */}
                {/* Arrows hidden on mobile - touch scroll instead */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-2 transition-all hidden md:block"
                        style={{ transform: "translateX(-50%)" }}
                    >
                        <ChevronLeft size={20} className="text-slate-700" />
                    </button>
                )}

                {/* Carousel Container - Smooth touch scroll on mobile */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex items-center overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory touch-pan-x"
                    style={{
                        gap: "22px",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingLeft: "40px",
                        paddingRight: "22px",
                        WebkitOverflowScrolling: "touch" // Momentum scrolling on iOS
                    }}
                >
                    {categories.map((category, index) => (
                        <div
                            key={category.id}
                            className="flex-shrink-0 flex flex-col items-center group relative snap-start"
                        >
                            {/* Edit Mode Controls */}
                            {isEditMode && (
                                <div className="absolute -top-2 -right-2 z-20 flex gap-1">
                                    <button
                                        onClick={() => {
                                            setUploadingIndex(index);
                                            setIsUploadModalOpen(true);
                                        }}
                                        className="bg-white hover:bg-gray-100 text-gray-700 p-1.5 rounded-full shadow-md transition-colors"
                                        title="Change Image"
                                    >
                                        <Upload size={12} />
                                    </button>
                                    <button
                                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                                        className={`p-1.5 rounded-full shadow-md transition-colors ${editingIndex === index ? 'bg-[#006D77] text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                                        title="Edit Details"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    {categories.length > 1 && (
                                        <button
                                            onClick={() => removeCategory(index)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Image */}
                            {isEditMode ? (
                                <div
                                    className="relative overflow-hidden bg-gray-100 cursor-pointer"
                                    style={{
                                        width: "166px",
                                        height: "208px",
                                        borderRadius: "4px"
                                    }}
                                    onClick={() => {
                                        setUploadingIndex(index);
                                        setIsUploadModalOpen(true);
                                    }}
                                >
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 166px, (max-width: 1200px) 332px, 664px"
                                        quality={90}
                                        unoptimized={category.image.includes('shopify') || category.image.includes('cdn.shopify')}
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload size={24} className="text-white" />
                                    </div>
                                </div>
                            ) : (
                                <Link href={category.link}>
                                    <div
                                        className="relative overflow-hidden bg-gray-100"
                                        style={{
                                            width: "166px",
                                            height: "208px",
                                            borderRadius: "4px"
                                        }}
                                    >
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 768px) 166px, (max-width: 1200px) 332px, 664px"
                                            quality={90}
                                            unoptimized={category.image.includes('shopify') || category.image.includes('cdn.shopify')}
                                        />
                                    </div>
                                </Link>
                            )}

                            {/* Category Name - Editable */}
                            {isEditMode && editingIndex === index ? (
                                <div style={{ marginTop: "21px" }} className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={category.name}
                                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                                        className="w-[166px] px-2 py-1 text-xs font-semibold text-center border border-[#006D77] rounded focus:outline-none focus:ring-1 focus:ring-[#006D77] uppercase"
                                        placeholder="Category Name"
                                    />
                                    <input
                                        type="text"
                                        value={category.link}
                                        onChange={(e) => updateCategory(index, "link", e.target.value)}
                                        className="w-[166px] px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                                        placeholder="/collections/..."
                                    />
                                </div>
                            ) : isEditMode ? (
                                <span
                                    onClick={() => setEditingIndex(index)}
                                    className="cursor-pointer hover:text-[#006D77] block"
                                    style={{
                                        color: "#1a1a1a",
                                        fontFamily: "var(--font-figtree), Figtree, sans-serif",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        letterSpacing: "1px",
                                        lineHeight: "23.4px",
                                        textAlign: "center",
                                        textTransform: "uppercase",
                                        marginTop: "21px",
                                        textDecoration: "underline"
                                    }}
                                >
                                    {category.name}
                                </span>
                            ) : (
                                <Link href={category.link}>
                                    <span
                                        className="block"
                                        style={{
                                            color: "#1a1a1a",
                                            fontFamily: "var(--font-figtree), Figtree, sans-serif",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            letterSpacing: "1px",
                                            lineHeight: "23.4px",
                                            textAlign: "center",
                                            textTransform: "uppercase",
                                            marginTop: "21px",
                                            textDecoration: "underline"
                                        }}
                                    >
                                        {category.name}
                                    </span>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                {/* Arrows hidden on mobile - touch scroll instead */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-2 transition-all hidden md:block"
                        style={{ transform: "translateX(50%)" }}
                    >
                        <ChevronRight size={20} className="text-slate-700" />
                    </button>
                )}
            </div>

            {/* Image Upload Modal */}
            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setUploadingIndex(null);
                }}
                onUpload={handleImageUpload}
                title="Upload Category Image"
                aspectRatio={166 / 208}
            />
        </div>
    );
}
