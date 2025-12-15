"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import { useSizeGuideStore } from "@/lib/store";

interface FeaturedProductProps {
    product?: {
        title: string;
        priceRange?: {
            minVariantPrice: {
                amount: string;
                currencyCode: string;
            }
        };
        images: {
            edges: {
                node: {
                    url: string;
                    altText?: string;
                }
            }[]
        };
        handle: string;
        description?: string;
        colors?: { name: string; hex: string }[];
        sizes?: string[];
    } | null;
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function FeaturedProduct({
    product,
    isEditMode = false,
    onUpdate
}: FeaturedProductProps) {
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const { openSizeGuide } = useSizeGuideStore();

    // Initialize state when product changes
    useEffect(() => {
        if (product) {
            if (product.colors && product.colors.length > 0) {
                setSelectedColor(product.colors[0].name);
            }
            if (product.sizes && product.sizes.length > 0) {
                setSelectedSize(product.sizes[0]);
            }
            setSelectedImageIndex(0);
        }
    }, [product]);

    // Fetch all products for the dropdown in edit mode
    useEffect(() => {
        if (isEditMode) {
            fetch('/api/products')
                .then(res => res.json())
                .then(data => setAllProducts(data.products || []))
                .catch(err => console.error("Failed to fetch products for selector", err));
        }
    }, [isEditMode]);

    if (!product) {
        if (isEditMode) {
            return (
                <section className="py-24 bg-white text-center border-2 border-dashed border-gray-300 m-4 rounded-lg p-8">
                    <p className="text-gray-500 mb-4">No Featured Product Selected</p>
                    <select
                        className="p-2 border rounded-md"
                        onChange={(e) => onUpdate && onUpdate({ product_handle: e.target.value })}
                        defaultValue=""
                    >
                        <option value="" disabled>Select a product to feature</option>
                        {allProducts.map((p: any) => (
                            <option key={p.node.id} value={p.node.handle}>
                                {p.node.title}
                            </option>
                        ))}
                    </select>
                </section>
            );
        }
        return null;
    }

    const price = product.priceRange?.minVariantPrice.amount
        ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(product.priceRange.minVariantPrice.amount))
        : "Price Unavailable";

    const images = product.images?.edges?.map(e => e.node.url) || [];
    const colors = product.colors || [];
    const sizes = product.sizes || [];

    const nextImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    return (
        <section className="py-24 bg-white relative group/section">
            {isEditMode && (
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Change Featured Product</label>
                    <select
                        className="p-2 border rounded-md text-sm w-64"
                        onChange={(e) => onUpdate && onUpdate({ product_handle: e.target.value })}
                        value={product.handle}
                    >
                        {allProducts.map((p: any) => (
                            <option key={p.node.id} value={p.node.handle}>
                                {p.node.title}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-6xl">
                <h2 className="text-center text-xs md:text-sm font-bold tracking-[0.2em] text-slate-900 uppercase mb-12 font-figtree">
                    Featured Product
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Thumbnails (Span 1) */}
                    <div className="hidden md:flex flex-col gap-4 md:col-span-1">
                        {images.slice(0, 4).map((img, i) => (
                            <div
                                key={i}
                                className={`relative aspect-[3/4] w-full cursor-pointer transition-opacity ${selectedImageIndex === i ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                                onClick={() => setSelectedImageIndex(i)}
                            >
                                <Image
                                    src={img}
                                    alt={`Thumbnail ${i}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Image (Span 6) */}
                    <motion.div
                        className="md:col-span-6 relative aspect-[3/4] bg-gray-100 overflow-hidden group"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                {images[selectedImageIndex] && (
                                    <Image
                                        src={images[selectedImageIndex]}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Zones */}
                        <div
                            className="absolute inset-y-0 left-0 w-1/2 cursor-[w-resize] z-10"
                            onClick={prevImage}
                            title="Previous Image"
                        />
                        <div
                            className="absolute inset-y-0 right-0 w-1/2 cursor-[e-resize] z-10"
                            onClick={nextImage}
                            title="Next Image"
                        />

                        {/* Zoom Button */}
                        <button
                            onClick={() => setIsLightboxOpen(true)}
                            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform z-20"
                        >
                            <ZoomIn size={20} />
                        </button>
                    </motion.div>

                    {/* Product Details (Span 5) */}
                    {/* Product Details (Span 5) */}
                    <div className="md:col-span-5 flex flex-col h-full py-1">
                        <div className="flex flex-col gap-10">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-lora text-slate-900 mb-4 leading-tight">
                                    {product.title}
                                </h2>
                                {/* Hidden Price */}
                                <div className="text-2xl md:text-3xl text-slate-900 font-medium hidden">{price}</div>
                            </div>


                            <hr className="border-gray-100" />

                            {/* Color Selection */}
                            {colors.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold uppercase block mb-4">Color: {selectedColor}</span>
                                    <div className="flex gap-4">
                                        {colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color.name)}
                                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color.name
                                                    ? "border-[#006D77] scale-110"
                                                    : "border-transparent hover:border-slate-300"
                                                    }`}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {sizes.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <span className="text-xs font-bold uppercase">Size: {selectedSize}</span>
                                        <button
                                            onClick={openSizeGuide}
                                            className="text-xs underline text-slate-500 hover:text-slate-900"
                                        >
                                            Size Guide
                                        </button>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`h-12 w-12 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ${selectedSize === size
                                                    ? "bg-[#006D77] text-white shadow-md scale-105"
                                                    : "bg-white border border-gray-200 text-slate-600 hover:border-[#006D77] hover:text-[#006D77] hover:scale-105"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="mb-2">
                                <span className="text-xs font-bold uppercase block mb-4">Quantity:</span>
                                <div className="flex items-center border border-gray-200 w-40 rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-gray-50 transition-colors"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 h-12 flex items-center justify-center text-sm font-medium border-x border-gray-200">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-gray-50 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-auto pt-8">
                            {/* <LiquidButton
                                className="w-full bg-[#25D366] text-white hover:bg-[#128C7E] border-none"
                                onClick={() => window.open(`https://wa.me/919876543210?text=Hi, I'm interested in ${product.title} (Color: ${selectedColor}, Size: ${selectedSize})`, '_blank')}
                            >
                                Chat with WhatsApp
                            </LiquidButton> */}
                            <LiquidButton
                                className="w-full"
                                onClick={() => window.location.href = `mailto:contact@kevara.com?subject=Inquiry about ${product.title}&body=I'm interested in ${product.title} (Color: ${selectedColor}, Size: ${selectedSize})`}
                            >
                                Send us an Email
                            </LiquidButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        >
                            <ChevronLeft size={48} />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        >
                            <ChevronRight size={48} />
                        </button>

                        <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            {images[selectedImageIndex] && (
                                <Image
                                    src={images[selectedImageIndex]}
                                    alt="Zoomed View"
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
