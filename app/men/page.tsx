"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import MenShopEssentials from "@/components/MenShopEssentials";
import LookbookFeature from "@/components/LookbookFeature";
import FeaturedProduct from "@/components/FeaturedProduct";
import CollectionGrid from "@/components/CollectionGrid";
import { PageContent, PageSection } from "@/types/page-editor";

// Default Initial Content (Migrated from hardcoded data)
const DEFAULT_CONTENT: PageContent = {
    sections: [
        {
            id: "hero-1",
            type: "hero_slider",
            settings: {
                slides: [
                    {
                        id: "1",
                        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=2070&auto=format&fit=crop",
                        heading: "Modern Classics: Redefined",
                        subheading: "TIMELESS STYLE FOR THE CONTEMPORARY MAN",
                        buttonText: "SHOP MEN",
                        link: "/collections/men",
                    }
                ]
            }
        },
        {
            id: "essentials-1",
            type: "shop_essentials",
            settings: {
                title: "Refined for the Gentleman",
                items: [
                    { id: "tab-1", title: "Shirts", image: "", link: "" },
                    { id: "tab-2", title: "Trousers", image: "", link: "" },
                    { id: "tab-3", title: "Jackets", image: "", link: "" }
                ]
            }
        },
        {
            id: "lookbook-1",
            type: "lookbook",
            settings: {
                title: "Urban Explorer <br /> Lookbook",
                subtitle: "Autumn Winter 21'",
                image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=1000&auto=format&fit=crop",
                cta_text: "Explore",
                cta_link: "/pages/lookbook-men"
            }
        },
        {
            id: "featured-1",
            type: "featured_product",
            settings: {
                product_handle: "classic-oxford-shirt"
            }
        },
        {
            id: "grid-1",
            type: "collection_grid",
            settings: {
                items: []
            }
        }
    ]
};

export default function MenPage() {
    const { isAdmin } = useAuth();
    const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Page Content
    useEffect(() => {
        async function fetchContent() {
            try {
                const res = await fetch("/api/builder/content?handle=men");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.sections && data.sections.length > 0) {
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
                body: JSON.stringify({ handle: "men", data: content }),
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

    if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">Loading...</div>;

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />

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
                            <MenShopEssentials
                                key={section.id}
                                data={(section.settings as any).items || []}
                                isEditMode={isEditMode}
                                onUpdate={(newItems) => updateSection(section.id, { items: newItems })}
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
                                data={(section.settings as any).items || []}
                                isEditMode={isEditMode}
                                onUpdate={(newItems) => updateSection(section.id, { items: newItems })}
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
        }
    }, [handle]);

    return (
        <FeaturedProduct
            product={product}
            isEditMode={isEditMode}
        />
    );
}
