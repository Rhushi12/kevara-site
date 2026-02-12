"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import CarouselArrowButton from "@/components/ui/CarouselArrowButton";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { Plus, Trash2, Upload } from "lucide-react";
import { authUpload } from "@/lib/auth-client";

interface Category {
    id: number | string;
    title: string;
    image: string;
    link: string;
    image_id?: string;
}

interface ShopCategoryProps {
    data?: {
        sectionTitle?: string;
        categories?: Category[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 1,
        title: "Outerwear",
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/outerwear",
    },
    {
        id: 2,
        title: "T-shirts",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/t-shirts",
    },
    {
        id: 3,
        title: "Skirts",
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/skirts",
    },
    {
        id: 4,
        title: "Dresses",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/dresses",
    },
    {
        id: 5,
        title: "Pants",
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/pants",
    },
    {
        id: 6,
        title: "Accessories",
        image: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=1000&auto=format&fit=crop",
        link: "/collections/accessories",
    },
];

export default function ShopCategory({ data, isEditMode = false, onUpdate }: ShopCategoryProps) {
    const carousel = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null); // Ref for scroll tracking
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    // Zoom out effect: Starts at 1.05x when entering viewport, scales down to 1x
    const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const sectionTitle = data?.sectionTitle || "Discover";
    const categories = data?.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES;

    // ... existing handlers ...
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!carousel.current) return;
        setIsDragging(true);
        setStartX(e.pageX - carousel.current.offsetLeft);
        setScrollLeft(carousel.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !carousel.current) return;
        e.preventDefault();
        const x = e.pageX - carousel.current.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.current.scrollLeft = scrollLeft - walk;
    };

    const updateTitle = (newTitle: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, sectionTitle: newTitle, categories });
    };

    const updateCategory = (index: number, field: string, value: string) => {
        if (!onUpdate) return;
        const newCategories = [...categories];
        newCategories[index] = { ...newCategories[index], [field]: value };
        onUpdate({ ...data, sectionTitle, categories: newCategories });
    };

    const addCategory = () => {
        if (!onUpdate) return;
        const newCategory: Category = {
            id: Date.now(),
            title: "New Category",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop",
            link: "/collections/new",
        };
        onUpdate({ ...data, sectionTitle, categories: [...categories, newCategory] });
    };

    const removeCategory = (index: number) => {
        if (!onUpdate || categories.length <= 1) return;
        const newCategories = categories.filter((_, i) => i !== index);
        onUpdate({ ...data, sectionTitle, categories: newCategories });
    };

    const handleImageUpload = async (file: File) => {
        if (!onUpdate || uploadingIndex === null) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authUpload('/api/upload', formData);
            const result = await res.json();

            if (!result.success) throw new Error("Upload failed");

            const newCategories = [...categories];
            newCategories[uploadingIndex] = {
                ...newCategories[uploadingIndex],
                image: result.url,
                image_id: result.fileId
            };
            onUpdate({ ...data, sectionTitle, categories: newCategories });
            setIsUploadModalOpen(false);
            setUploadingIndex(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image");
        }
    };

    return (
        <section ref={sectionRef} className="py-12 md:py-20 overflow-hidden">
            <motion.div
                style={{ scale }}
                className="w-full bg-[#003B40] min-h-[631px] group/section relative py-[80px]"
            >
                <div className="container mx-auto h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center justify-center mb-12 relative">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { staggerChildren: 0.2 }
                                }
                            }}
                            className="text-center"
                        >
                            <motion.div
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            >
                                {isEditMode ? (
                                    <EditableText
                                        value={sectionTitle}
                                        onSave={updateTitle}
                                        isAdmin={true}
                                        className="text-sm font-bold tracking-[0.2em] text-white uppercase bg-transparent border-b border-white/20"
                                    />
                                ) : (
                                    <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase">
                                        {sectionTitle}
                                    </h2>
                                )}
                            </motion.div>
                        </motion.div>

                        {isEditMode && (
                            <button
                                onClick={addCategory}
                                className="absolute right-4 top-0 bg-[#006D77] hover:bg-[#005a63] text-white px-4 py-2 rounded-full text-sm transition-colors shadow-lg flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Category
                            </button>
                        )}
                    </div>

                    <div className="relative w-full group/carousel">

                        {/* Arrows hidden on mobile - touch scroll instead */}
                        <CarouselArrowButton
                            direction="left"
                            onClick={() => {
                                if (carousel.current) {
                                    carousel.current.scrollBy({ left: -360, behavior: 'smooth' });
                                }
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 -translate-x-1/2 hidden md:flex"
                            aria-label="Previous"
                        />
                        <CarouselArrowButton
                            direction="right"
                            onClick={() => {
                                if (carousel.current) {
                                    carousel.current.scrollBy({ left: 360, behavior: 'smooth' });
                                }
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 translate-x-1/2 hidden md:flex"
                            aria-label="Next"
                        />

                        {/* Carousel container - smooth touch scroll on mobile */}
                        <div
                            ref={carousel}
                            className="overflow-x-auto cursor-grab active:cursor-grabbing scrollbar-hide snap-x snap-mandatory touch-manipulation"
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            style={{
                                scrollBehavior: isDragging ? 'auto' : 'smooth',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            <div
                                className="grid grid-flow-col items-center gap-[40px] pl-[40px] pr-[68px]"
                                style={{
                                    justifyContent: "start",
                                    gridAutoColumns: "319.491px",
                                    gridTemplateColumns: `repeat(${categories.length}, 319.489px)`,
                                    gridTemplateRows: "406.807px",
                                    width: "max-content"
                                }}
                            >
                                {categories.map((category, index) => (
                                    <motion.div
                                        key={category.id}
                                        className="relative group/card rounded-md overflow-hidden w-full h-full snap-start"
                                    >
                                        {isEditMode ? (
                                            <div className="block w-full h-full relative">
                                                <motion.div
                                                    className="w-full h-full"
                                                    whileHover={{ scale: 1.03 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <Image
                                                        src={category.image}
                                                        alt={category.title}
                                                        fill
                                                        className="object-cover pointer-events-none"
                                                        draggable={false}
                                                    />
                                                </motion.div>

                                                {/* Edit Overlay */}
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center gap-4">
                                                    <EditableText
                                                        value={category.title}
                                                        onSave={(val) => updateCategory(index, "title", val)}
                                                        isAdmin={true}
                                                        className="font-lora text-center text-white text-2xl bg-transparent border-b border-white/20"
                                                    />
                                                    <EditableText
                                                        value={category.link}
                                                        onSave={(val) => updateCategory(index, "link", val)}
                                                        isAdmin={true}
                                                        className="text-sm text-white/70 bg-transparent border-b border-white/20"
                                                        placeholder="/collections/..."
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setUploadingIndex(index);
                                                            setIsUploadModalOpen(true);
                                                        }}
                                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <Upload size={14} />
                                                        Change Image
                                                    </button>
                                                    {categories.length > 1 && (
                                                        <button
                                                            onClick={() => removeCategory(index)}
                                                            className="bg-red-500/80 hover:bg-red-600/80 text-white p-2 rounded-full transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <Link href={category.link} className="block w-full h-full" draggable={false}>
                                                <motion.div
                                                    className="w-full h-full"
                                                    whileHover={{ scale: 1.03 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <Image
                                                        src={category.image}
                                                        alt={category.title}
                                                        fill
                                                        className="object-cover pointer-events-none"
                                                        draggable={false}
                                                    />
                                                </motion.div>

                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                                                    <h4
                                                        className="font-lora drop-shadow-md text-center"
                                                        style={{
                                                            fontSize: "36px",
                                                            lineHeight: "40px",
                                                            letterSpacing: "-0.8px",
                                                            color: "#fff"
                                                        }}
                                                    >
                                                        {category.title}
                                                    </h4>
                                                </div>
                                            </Link>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setUploadingIndex(null);
                }}
                onUpload={handleImageUpload}
                aspectRatio={320 / 407}
            />
        </section>
    );
}
