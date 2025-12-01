"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";
import ProductPickerModal from "@/components/admin/ProductPickerModal";
import AddProductChoiceModal from "@/components/admin/AddProductChoiceModal";
import CreateProductModal from "@/components/admin/CreateProductModal";
import { Plus } from "lucide-react";

interface WomenShopEssentialsProps {
    data?: {
        title?: string;
        description?: string;
        items?: any[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function WomenShopEssentials({ data = {}, isEditMode = false, onUpdate }: WomenShopEssentialsProps) {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshedData, setRefreshedData] = useState(data);

    const {
        title = "Dress up in the heat",
        description = "SS21 Series of Comfortable textures. With luxurious, natural-looking makeup, we find reasons for the face. New textures and colors bring new inspiration to your everyday life.",
        items = []
    } = refreshedData;

    // Refresh product data to get fresh images from Shopify
    useEffect(() => {
        async function refreshProducts() {
            if (!data.items || data.items.length === 0) return;

            try {
                // Fetch fresh products to get current images
                const res = await fetch('/api/products');
                if (!res.ok) return;
                const { products } = await res.json();

                // Create a map of product ID to full product data
                const productMap = new Map();
                products.forEach((p: any) => {
                    productMap.set(p.node.id, p.node);
                });

                // Update each tab's products with fresh data
                const updatedItems = data.items.map((tab: any) => ({
                    ...tab,
                    products: (tab.products || []).map((product: any) => {
                        const freshProduct = productMap.get(product.id);
                        // Use fresh product if available, otherwise keep existing
                        return freshProduct || product;
                    })
                }));

                setRefreshedData({ ...data, items: updatedItems });
            } catch (error) {
                console.error('Failed to refresh product data:', error);
                setRefreshedData(data);
            }
        }

        refreshProducts();
    }, [data]);

    // Ensure we have at least one tab if empty
    const tabs = items.length > 0 ? items : [
        { title: "Dresses", products: [] },
        { title: "Shirts", products: [] },
        { title: "Shorts", products: [] }
    ];

    const activeTab = tabs[activeTabIndex];

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        const updated = { ...refreshedData, [field]: value };
        setRefreshedData(updated);
        onUpdate(updated);
    };

    const updateTabTitle = (index: number, newTitle: string) => {
        if (!onUpdate) return;
        const newTabs = [...tabs];
        newTabs[index] = { ...newTabs[index], title: newTitle };
        const updated = { ...refreshedData, items: newTabs };
        setRefreshedData(updated);
        onUpdate(updated);
    };

    const handleAddProducts = (selectedProducts: any[]) => {
        if (!onUpdate) return;
        const newTabs = [...tabs];
        const currentProducts = newTabs[activeTabIndex].products || [];

        // Merge new products, avoiding duplicates
        const existingIds = new Set(currentProducts.map((p: any) => p.id));
        const newProductNodes = selectedProducts.map(p => p.node ? p.node : p).filter(p => !existingIds.has(p.id));

        newTabs[activeTabIndex] = {
            ...newTabs[activeTabIndex],
            products: [...currentProducts, ...newProductNodes]
        };

        const updated = { ...refreshedData, items: newTabs };
        setRefreshedData(updated);
        onUpdate(updated);
    };

    const handleCreateSuccess = (newProduct: any) => {
        // Add the newly created product directly to the list
        handleAddProducts([newProduct]);
    };

    const removeProduct = (productId: string) => {
        if (!onUpdate) return;
        const newTabs = [...tabs];
        newTabs[activeTabIndex] = {
            ...newTabs[activeTabIndex],
            products: newTabs[activeTabIndex].products.filter((p: any) => p.id !== productId)
        };
        const updated = { ...refreshedData, items: newTabs };
        setRefreshedData(updated);
        onUpdate(updated);
    };

    return (
        <section className="container mx-auto px-4 pt-12 pb-12 md:py-24 group/section overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 md:mb-12"
            >
                {isEditMode ? (
                    <EditableText
                        value={title}
                        onSave={(val) => updateField("title", val)}
                        isAdmin={true}
                        className="text-[32px] md:text-5xl font-lora text-slate-900 mb-4 bg-transparent border-b border-gray-300 w-full max-w-2xl mx-auto text-center"
                    />
                ) : (
                    <h2 className="text-[32px] md:text-5xl font-lora text-slate-900 mb-4">
                        {title}
                    </h2>
                )}

                {isEditMode ? (
                    <EditableText
                        value={description}
                        onSave={(val) => updateField("description", val)}
                        isAdmin={true}
                        className="text-sm text-slate-500 max-w-2xl mx-auto mb-8 bg-transparent border-b border-gray-300 w-full text-center"
                    />
                ) : (
                    <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-8">
                        {description}
                    </p>
                )}

                {/* Toggle */}
                <div className="flex justify-center gap-8 border-b border-gray-200 max-w-xs mx-auto relative">
                    {tabs.map((tab: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setActiveTabIndex(index)}
                            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTabIndex === index ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {isEditMode ? (
                                <EditableText
                                    value={tab.title}
                                    onSave={(val) => updateTabTitle(index, val)}
                                    isAdmin={true}
                                    className="bg-transparent border-b border-gray-300"
                                />
                            ) : (
                                tab.title
                            )}
                            {activeTabIndex === index && (
                                <motion.div
                                    layoutId="activeTabUnderlineWomen"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>


            {/* Products Carousel */}
            <div className="relative">
                {/* Navigation Arrows */}
                {activeTab.products && activeTab.products.length > 4 && (
                    <>
                        <button
                            onClick={() => {
                                const container = document.getElementById('products-carousel');
                                if (container) {
                                    container.scrollBy({ left: -300, behavior: 'smooth' });
                                }
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hidden md:flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                const container = document.getElementById('products-carousel');
                                if (container) {
                                    container.scrollBy({ left: 300, behavior: 'smooth' });
                                }
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hidden md:flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </>
                )}

                <div
                    id="products-carousel"
                    className="overflow-x-auto md:overflow-x-auto -mx-4 px-4 md:px-8 snap-x snap-mandatory"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTabIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="flex gap-4 md:gap-6 w-max"
                        >
                            {activeTab.products && activeTab.products.length > 0 ? (
                                activeTab.products.map((product: any, index: number) => (
                                    <motion.div
                                        key={product.id || index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="w-[280px] md:w-[300px] snap-center shrink-0 relative group/product"
                                    >
                                        <ProductCard product={{ node: product }} />
                                        {isEditMode && (
                                            <button
                                                onClick={() => removeProduct(product.id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/product:opacity-100 transition-opacity z-10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="w-full text-center py-12 text-gray-400">
                                    No products found in this collection.
                                </div>
                            )}

                            {/* Add Product Button */}
                            {isEditMode && (
                                <motion.button
                                    onClick={() => setIsChoiceModalOpen(true)}
                                    className="w-[280px] md:w-[300px] min-h-[400px] snap-center shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-[#006D77] hover:border-[#006D77] transition-colors"
                                >
                                    <Plus size={48} />
                                    <span className="mt-4 font-medium">Add Product</span>
                                </motion.button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex justify-center mt-12">
                <LiquidButton href="/collections/women">
                    View All
                </LiquidButton>
            </div>

            <AddProductChoiceModal
                isOpen={isChoiceModalOpen}
                onClose={() => setIsChoiceModalOpen(false)}
                onSelectExisting={() => {
                    setIsChoiceModalOpen(false);
                    setIsProductPickerOpen(true);
                }}
                onCreateNew={() => {
                    setIsChoiceModalOpen(false);
                    setIsCreateModalOpen(true);
                }}
            />

            <ProductPickerModal
                isOpen={isProductPickerOpen}
                onClose={() => setIsProductPickerOpen(false)}
                onSelect={handleAddProducts}
                initialSelection={activeTab.products?.map((p: any) => p.id) || []}
            />

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </section>
    );
}
