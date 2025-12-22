"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";
import ProductPickerModal from "@/components/admin/ProductPickerModal";
import AddProductChoiceModal from "@/components/admin/AddProductChoiceModal";
import CreateProductModal from "@/components/admin/CreateProductModal";
import CarouselArrowButton from "@/components/ui/CarouselArrowButton";
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
        title = "Shop Essentials",
        description = "",
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
        { title: "WOMEN", products: [] },
        { title: "MEN", products: [] }
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

    const handleAddTab = () => {
        if (!onUpdate) return;
        const newTabs = [...tabs, { title: "New Category", products: [] }];
        const updated = { ...refreshedData, items: newTabs };
        setRefreshedData(updated);
        onUpdate(updated);
        setActiveTabIndex(newTabs.length - 1); // Switch to new tab
    };

    const handleRemoveTab = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent tab switching
        if (!onUpdate) return;

        if (confirm("Are you sure you want to delete this tab?")) {
            const newTabs = tabs.filter((_, i) => i !== index);
            const updated = { ...refreshedData, items: newTabs };
            setRefreshedData(updated);
            onUpdate(updated);

            // Adjust active tab if needed
            if (activeTabIndex >= newTabs.length) {
                setActiveTabIndex(Math.max(0, newTabs.length - 1));
            }
        }
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
                <div className="flex justify-center gap-8 mb-6 md:mb-10 border-b border-gray-200 mx-auto max-w-4xl px-4">
                    {tabs.map((tab: any, index: number) => (
                        <div key={index} className="relative group/tab">
                            <button
                                onClick={() => setActiveTabIndex(index)}
                                className={`pb-2 text-sm font-bold tracking-widest uppercase transition-colors relative
                                    ${activeTabIndex === index
                                        ? "border-b-2 border-slate-900 text-slate-900"
                                        : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"
                                    }`}
                            >
                                {isEditMode ? (
                                    <EditableText
                                        value={tab.title}
                                        onSave={(val) => updateTabTitle(index, val)}
                                        isAdmin={true}
                                        className="bg-transparent min-w-[80px] text-center"
                                    />
                                ) : (
                                    tab.title
                                )}
                            </button>

                            {/* Delete Tab Button */}
                            {isEditMode && (
                                <button
                                    onClick={(e) => handleRemoveTab(index, e)}
                                    className="absolute -top-4 -right-4 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover/tab:opacity-100 transition-opacity hover:bg-red-200"
                                    title="Remove Tab"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add Tab Button */}
                    {isEditMode && (
                        <button
                            onClick={handleAddTab}
                            className="pb-2 text-gray-400 hover:text-[#006D77] transition-colors flex items-center gap-1 border-b-2 border-transparent"
                            title="Add New Category"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-medium">ADD</span>
                        </button>
                    )}
                </div>
            </motion.div>


            {/* Products Carousel */}
            <div className="relative">
                {/* Navigation Arrows */}
                {activeTab.products && activeTab.products.length > 0 && (
                    <>
                        <CarouselArrowButton
                            direction="left"
                            onClick={() => {
                                const container = document.getElementById('products-carousel');
                                if (container) {
                                    container.scrollBy({ left: -300, behavior: 'smooth' });
                                }
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 -translate-x-1/2 hidden md:flex"
                            aria-label="Previous"
                        />
                        <CarouselArrowButton
                            direction="right"
                            onClick={() => {
                                const container = document.getElementById('products-carousel');
                                if (container) {
                                    container.scrollBy({ left: 300, behavior: 'smooth' });
                                }
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 translate-x-1/2 hidden md:flex"
                            aria-label="Next"
                        />
                    </>
                )}

                <div
                    id="products-carousel"
                    className="overflow-x-auto md:overflow-x-auto -mx-4 px-4 md:px-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden touch-manipulation"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTabIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="flex gap-3 md:gap-6 w-max"
                        >
                            {activeTab.products && activeTab.products.length > 0 ? (
                                activeTab.products.map((product: any, index: number) => (
                                    <motion.div
                                        key={product.id || index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="w-[170px] md:w-[300px] snap-center shrink-0 relative group/product"
                                    >
                                        <ProductCard product={{ node: product }} />
                                        {isEditMode && (
                                            <button
                                                onClick={() => removeProduct(product.id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/product:opacity-100 transition-opacity z-50"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="w-[170px] md:w-[300px] text-center py-12 text-gray-400">
                                    No products found in this collection.
                                </div>
                            )}

                            {/* Add Product Button */}
                            {isEditMode && (
                                <motion.button
                                    onClick={() => setIsChoiceModalOpen(true)}
                                    className="w-[170px] md:w-[300px] min-h-[300px] snap-center shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-[#006D77] hover:border-[#006D77] transition-colors"
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
