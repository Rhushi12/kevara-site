"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import WomenShopEssentials from "@/components/WomenShopEssentials";
import { Trash2 } from "lucide-react";
import LookbookFeature from "@/components/LookbookFeature";
import FeaturedProduct from "@/components/FeaturedProduct";
import CollectionGrid from "@/components/CollectionGrid";
import SizeGuidePanel from "@/components/SizeGuidePanel";
import { PageContent, PageSection } from "@/types/page-editor";
import PremiumPreloader from "@/components/PremiumPreloader";

// Default Initial Content (if empty)
import { TEMPLATE_1 } from "@/lib/templates";

// Default Initial Content (if empty)
const DEFAULT_CONTENT: PageContent = TEMPLATE_1;

export default function Template1Page() {
    const { isAdmin } = useAuth();
    const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Page Content
    useEffect(() => {
        async function fetchContent() {
            try {
                const res = await fetch("/api/builder/content?handle=template-1");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.sections && data.sections.length > 0) {
                        // Ensure featured_product section exists (migration for existing pages)
                        const hasFeatured = data.sections.find((s: any) => s.type === "featured_product");
                        if (!hasFeatured) {
                            // Insert it before the last section (Collection Grid) or at the end
                            const gridIndex = data.sections.findIndex((s: any) => s.type === "collection_grid");
                            const newSection = {
                                id: "featured-1",
                                type: "featured_product",
                                settings: { product_handle: "" }
                            };

                            if (gridIndex !== -1) {
                                data.sections.splice(gridIndex, 0, newSection);
                            } else {
                                data.sections.push(newSection);
                            }
                        }
                        setContent(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch page content:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    // Save Page Content
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: "template-1", data: content }),
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Changes saved successfully!");
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Page
    const deletePage = async () => {
        if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/builder/content?handle=template-1", {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            alert("Page deleted successfully!");
            window.location.reload(); // Reload to reset state
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete page.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Update Section Helper
    const updateSection = useCallback((sectionId: string, newSettings: any) => {
        setContent((prev) => ({
            ...prev,
            sections: prev.sections.map((section) =>
                section.id === sectionId
                    ? { ...section, settings: { ...section.settings, ...newSettings } }
                    : section
            ),
        }));
    }, []);

    if (loading) return <PremiumPreloader />;

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <SizeGuidePanel />

            {/* Admin Controls */}
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => setIsEditMode(false)}
                                className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deletePage}
                                disabled={isDeleting}
                                className="bg-red-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={isSaving}
                                className="bg-[#006D77] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#005a63] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
                        >
                            Edit Page
                        </button>
                    )}
                </div>
            )}

            {/* Dynamic Section Rendering */}
            {content.sections.map((section) => {
                switch (section.type) {
                    case "hero_slider":
                        return (
                            <HeroSlider
                                key={section.id}
                                slides={(section.settings as any).slides || []}
                                isEditMode={isEditMode}
                                onUpdate={(newSlides) => updateSection(section.id, { slides: newSlides })}
                            />
                        );
                    case "shop_essentials":
                        return (
                            <WomenShopEssentials
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "lookbook":
                        return (
                            <LookbookFeature
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newData) => updateSection(section.id, newData)}
                            />
                        );
                    case "featured_product":
                        return (
                            <FeaturedProductWrapper
                                key={section.id}
                                section={section}
                                isEditMode={isEditMode}
                                onUpdate={(newData) => updateSection(section.id, newData)}
                            />
                        );
                    case "collection_grid":
                        return (
                            <CollectionGrid
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newData) => updateSection(section.id, newData)}
                            />
                        );
                    default:
                        return null;
                }
            })}

            <Footer />
        </main>
    );
}

// Wrapper to handle data fetching for Featured Product
function FeaturedProductWrapper({ section, isEditMode, onUpdate }: { section: PageSection, isEditMode: boolean, onUpdate: (data: any) => void }) {
    const [product, setProduct] = useState<any>(null);
    const handle = (section.settings as any).product_handle;

    useEffect(() => {
        if (handle) {
            fetch(`/api/products/${handle}`)
                .then(res => res.json())
                .then(data => setProduct(data.product))
                .catch(err => console.error("Failed to fetch featured product", err));
        } else {
            // Fetch random product if no handle is selected
            fetch('/api/products')
                .then(res => res.json())
                .then(data => {
                    if (data.products && data.products.length > 0) {
                        const randomIndex = Math.floor(Math.random() * data.products.length);
                        setProduct(data.products[randomIndex].node);
                    }
                })
                .catch(err => console.error("Failed to fetch random product", err));
        }
    }, [handle]);

    return (
        <FeaturedProduct
            product={product}
            isEditMode={isEditMode}
            onUpdate={onUpdate}
        />
    );
}
