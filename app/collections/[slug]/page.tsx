"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import WomenShopEssentials from "@/components/WomenShopEssentials"; // Reusing generic components where possible
import LookbookFeature from "@/components/LookbookFeature";
import FeaturedProduct from "@/components/FeaturedProduct";
import CollectionGrid from "@/components/CollectionGrid";
import ScrollFadeBanner from "@/components/ScrollFadeBanner";
import PromoWindows from "@/components/PromoWindows";
import EssentialsHero from "@/components/EssentialsHero";
import FeaturedIn from "@/components/FeaturedIn";
import { PageContent, PageSection } from "@/types/page-editor";
import PremiumPreloader from "@/components/PremiumPreloader";
import UnderConstruction from "@/components/UnderConstruction";
import AdminPageBuilder from "@/components/admin/AdminPageBuilder";
import { Trash2 } from "lucide-react";

// Dynamic imports for template renderers
const Template2Renderer = dynamic(() => import("@/components/renderers/Template2Renderer"), {
    loading: () => <PremiumPreloader />,
    ssr: false
});

const Template3Renderer = dynamic(() => import("@/components/renderers/Template3Renderer"), {
    loading: () => <PremiumPreloader />,
    ssr: false
});

// Default Content for New Collections
const DEFAULT_COLLECTION_CONTENT: PageContent = {
    sections: [
        {
            id: "hero-1",
            type: "hero_slider",
            settings: {
                slides: [
                    {
                        id: "1",
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
                        heading: "New Collection",
                        subheading: "DISCOVER THE LATEST TRENDS",
                        buttonText: "SHOP NOW",
                        link: "#",
                    }
                ]
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

export default function CollectionPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { isAdmin } = useAuth();
    const router = useRouter();

    const [content, setContent] = useState<PageContent>(DEFAULT_COLLECTION_CONTENT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Page Content
    useEffect(() => {
        if (!slug) return;
        async function fetchContent() {
            try {
                const res = await fetch(`/api/builder/content?handle=${slug}`);
                if (res.ok) {
                    const data = await res.json();

                    // DEBUG: Log template type
                    console.log(`[CollectionPage] Loaded content for '${slug}', template_type:`, data?.template_type);

                    if (data && data.sections && data.sections.length > 0) {
                        setContent(data);
                    } else {
                        setNotFound(true);
                    }
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Failed to fetch page content:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        fetchContent();
    }, [slug]);

    // Save Page Content
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: slug, data: content }),
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
            const res = await fetch(`/api/builder/content?handle=${slug}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            alert("Page deleted successfully!");
            window.location.reload();
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

    // 404 Handling: Admin vs User
    if (notFound || !content) {
        if (isAdmin) {
            return <AdminPageBuilder slug={slug} />;
        } else {
            return <UnderConstruction />;
        }
    }

    // Template-based routing: Use full template layouts for template2/template3
    if (content.template_type === 'template2') {
        return <Template2Renderer content={content} slug={slug} />;
    }

    if (content.template_type === 'template3') {
        return <Template3Renderer content={content} slug={slug} />;
    }

    // Default collection page layout for other content
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
                        // Using WomenShopEssentials as a generic component since it's dynamic now
                        // Ideally we should rename it to ShopEssentials in a future refactor
                        return (
                            <WomenShopEssentials
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
                    case "scroll_banner":
                        return (
                            <ScrollFadeBanner
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "promo_windows":
                        return (
                            <PromoWindows
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "essentials_hero":
                        return (
                            <EssentialsHero
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "featured_in":
                        return (
                            <FeaturedIn
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
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
        const fetchRandom = () => {
            fetch('/api/products')
                .then(res => res.json())
                .then(data => {
                    if (data.products && data.products.length > 0) {
                        const randomIndex = Math.floor(Math.random() * data.products.length);
                        setProduct(data.products[randomIndex].node);
                    }
                })
                .catch(err => console.error("Failed to fetch random product", err));
        };

        if (handle) {
            fetch(`/api/products/${handle}`)
                .then(res => res.json())
                .then(data => {
                    if (data.product) {
                        setProduct(data.product);
                    } else {
                        fetchRandom();
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch featured product", err);
                    fetchRandom();
                });
        } else {
            fetchRandom();
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
