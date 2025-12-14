"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Edit2, ShoppingBag } from "lucide-react";
import ProductPicker from "@/components/admin/ProductPicker";
import { useQuickViewStore } from "@/lib/store";
import EditableText from "@/components/admin/EditableText";

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        slug?: string;
        priceRange?: {
            minVariantPrice?: {
                amount: string;
                currencyCode: string;
            };
        };
        images?: {
            edges: {
                node: {
                    url: string;
                    altText?: string;
                };
            }[];
        };
    };
}

interface SustainabilityProductsSectionProps {
    data?: {
        smallHeading?: string;
        heading?: string;
        description?: string;
        selectedProducts?: string[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityProductsSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityProductsSectionProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const { openQuickView } = useQuickViewStore();

    const {
        smallHeading = "SUSTAINABLE COLLECTION",
        heading = "Shop Our Eco-Friendly Favorites",
        description = "Each piece in our collection is thoughtfully designed with sustainability at its core. From organic fabrics to ethical production, discover fashion that feels as good as it looks.",
        selectedProducts = []
    } = data;

    // Fetch all products
    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/products");
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    // Filter products to show only selected ones
    const displayProducts = selectedProducts.length > 0
        ? products.filter(p => selectedProducts.includes(p.node?.handle))
        : products.slice(0, 4); // Default to first 4 if none selected

    return (
        <section className="w-full">
            <div
                className="w-full max-w-[1500px] mx-auto flex flex-col items-center px-4 md:px-8 py-8"
            >
                {/* Text Container */}
                <div
                    className="flex flex-col items-center text-center w-full md:w-[800px] px-4"
                >
                    {/* Small Heading */}
                    {isEditMode ? (
                        <EditableText
                            value={smallHeading}
                            onSave={(val) => updateField("smallHeading", val)}
                            isAdmin={true}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree text-center mb-4 bg-gray-100 border-b border-gray-300 px-2 py-1"
                        />
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
                            className="text-[13px] font-semibold tracking-[1px] leading-[16px] uppercase text-[#1a1a1a] font-figtree mb-4"
                        >
                            {smallHeading}
                        </motion.p>
                    )}

                    {/* Main Heading */}
                    <div className="mt-4 md:mt-6">
                        {isEditMode ? (
                            <EditableText
                                value={heading}
                                onSave={(val) => updateField("heading", val)}
                                isAdmin={true}
                                className="text-[32px] md:text-[48px] leading-[36px] md:leading-[52px] tracking-[-1px] text-[#1a1a1a] font-lora text-center bg-gray-100 border-b border-gray-300 px-2 py-1"
                            />
                        ) : (
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1, ease: [0.7, 0, 0.84, 0] }}
                                className="text-[32px] md:text-[48px] leading-[36px] md:leading-[52px] tracking-[-1px] text-[#1a1a1a] font-lora"
                            >
                                {heading}
                            </motion.h2>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mt-4 md:mt-6">
                        {isEditMode ? (
                            <EditableText
                                value={description}
                                onSave={(val) => updateField("description", val)}
                                isAdmin={true}
                                multiline={true}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree text-center bg-gray-100 border-b border-gray-300 px-2 py-1"
                            />
                        ) : (
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#1a1a1a] font-figtree mt-4"
                            >
                                {description}
                            </motion.p>
                        )}
                    </div>
                </div>

                {/* Edit Products Button */}
                {isEditMode && (
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#006D77] text-white rounded-lg hover:bg-[#005a63] transition-colors"
                    >
                        <Edit2 size={16} />
                        <span className="text-sm font-medium">Select Products</span>
                    </button>
                )}

                {/* Product Picker */}
                {isEditMode && showPicker && (
                    <div className="mt-4 w-full max-w-[1200px] bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                        <ProductPicker
                            selectedHandles={selectedProducts}
                            onSelectionChange={(handles) => updateField("selectedProducts", handles)}
                            maxSelection={4}
                        />
                    </div>
                )}

                {/* Products Grid */}
                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12 w-full"
                >
                    {loading ? (
                        // Loading skeleton
                        [...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-gray-100 animate-pulse rounded-sm w-full aspect-[291/364]"
                            />
                        ))
                    ) : displayProducts.length > 0 ? (
                        displayProducts.map((product, idx) => {
                            const { title, handle, slug, priceRange, images } = product.node;
                            const price = priceRange?.minVariantPrice?.amount || "0";
                            const currency = priceRange?.minVariantPrice?.currencyCode || "INR";
                            const imageUrl = images?.edges?.[0]?.node?.url;
                            const productSlug = slug || handle;

                            return (
                                <motion.div
                                    key={handle}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative w-full"
                                >
                                    {/* Product Image */}
                                    <Link href={`/products/${productSlug}`}>
                                        <div
                                            className="relative overflow-hidden rounded-sm bg-gray-100 w-full aspect-[291/364]"
                                        >
                                            {imageUrl ? (
                                                <Image
                                                    src={imageUrl}
                                                    alt={title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}

                                            {/* Quick View Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openQuickView(product as any);
                                                }}
                                                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ShoppingBag size={18} />
                                            </button>
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="mt-3 text-center">
                                        <Link href={`/products/${productSlug}`}>
                                            <h3 className="text-[14px] md:text-[15px] font-figtree text-[#1a1a1a] hover:text-[#006D77] transition-colors line-clamp-1">
                                                {title}
                                            </h3>
                                        </Link>
                                        <p className="text-[13px] md:text-[14px] font-figtree text-[#1a1a1a] mt-1">
                                            {new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: currency,
                                            }).format(parseFloat(price))}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 md:col-span-4 text-center py-12 text-gray-500">
                            No products selected. {isEditMode && "Click 'Select Products' above to choose products."}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
