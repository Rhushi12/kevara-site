"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { PageContent, PageSection } from "@/types/page-editor";
import { Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

// ─── CRITICAL (above-the-fold): loaded eagerly ───
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import PremiumPreloader from "@/components/PremiumPreloader";
import UnderConstruction from "@/components/UnderConstruction";
import LazySection from "@/components/LazySection";

// ─── DEFERRED (below-the-fold): loaded lazily via next/dynamic ───
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const WomenShopEssentials = dynamic(() => import("@/components/WomenShopEssentials"), { ssr: false });
const LookbookFeature = dynamic(() => import("@/components/LookbookFeature"), { ssr: false });
const FeaturedProduct = dynamic(() => import("@/components/FeaturedProduct"), { ssr: false });
const CollectionGrid = dynamic(() => import("@/components/CollectionGrid"), { ssr: false });
const AdminPageBuilder = dynamic(() => import("@/components/admin/AdminPageBuilder"), { ssr: false });
const ShopByOccasion = dynamic(() => import("@/components/ShopByOccasion"), { ssr: false });
const CleanGrid = dynamic(() => import("@/components/CleanGrid"), { ssr: false });
const ShopCategory = dynamic(() => import("@/components/ShopCategory"), { ssr: false });
const ScrollFadeBanner = dynamic(() => import("@/components/ScrollFadeBanner"), { ssr: false });
const PromoWindows = dynamic(() => import("@/components/PromoWindows"), { ssr: false });
const EssentialsHero = dynamic(() => import("@/components/EssentialsHero"), { ssr: false });
const FeaturedIn = dynamic(() => import("@/components/FeaturedIn"), { ssr: false });
const SalesSplit = dynamic(() => import("@/components/SalesSplit"), { ssr: false });
const VideoPromo = dynamic(() => import("@/components/VideoPromo"), { ssr: false });
const FabricFeature = dynamic(() => import("@/components/FabricFeature"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/Testimonials"), { ssr: false });
const Features = dynamic(() => import("@/components/Features"), { ssr: false });
const AboutUsSection = dynamic(() => import("@/components/AboutUsSection"), { ssr: false });
const Template2Renderer = dynamic(() => import("@/components/renderers/Template2Renderer"), { ssr: false });
const Template3Renderer = dynamic(() => import("@/components/renderers/Template3Renderer"), { ssr: false });

interface PageRendererProps {
    slug: string;
    initialContent?: PageContent | null;
}

export default function PageRenderer({ slug, initialContent }: PageRendererProps) {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    const [content, setContent] = useState<PageContent | null>(initialContent || null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // If initialContent provided, loading is false initially
    const [loading, setLoading] = useState(!initialContent);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const { showToast } = useToast();

    // Fetch Page Content (only if not provided initially or slug changes)
    useEffect(() => {
        if (!slug) return;
        // Skip fetch if we have initial content matching the slug (basic check)
        // Note: Ideally we'd compare more robustly, but for now assuming if initialContent is passed, it's correct
        if (initialContent) {
            setLoading(false);
            return;
        }

        async function fetchContent() {
            try {
                const res = await fetch(`/api/builder/content?handle=${slug}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();

                    // Handle Redirects
                    if (data.type === "redirect" && data.target) {
                        setIsRedirecting(true);
                        router.replace(data.target); // Use replace to avoid history stack issues
                        return; // proper return, finally block will run but we handle it
                    }

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
                // If we are redirecting, we DON'T want to set loading to false, 
                // because we want to show the loader until the page changes.
                // However, we can't easily access the state inside useEffect closure if checking 'isRedirecting',
                // but we know if we hit the redirect block we return.
                // Actually, 'finally' runs anyway.
                // So we need to control this.
                setLoading((prev) => false);
            }
        }
        fetchContent();
    }, [slug, router]);

    // Save Page Content
    const saveChanges = async () => {
        if (!content) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: slug, data: content }),
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast("Changes saved successfully!", "success");
            setIsEditMode(false);
            // Force refresh to ensure the page gets the latest data from server
            window.location.reload();
        } catch (error) {
            console.error("Failed to save:", error);
            showToast("Failed to save changes.", "error");
        } finally {
            setIsSaving(false);
        }
    };


    // Delete Page
    const deletePage = async () => {
        if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) return;

        // Get metaobject_id from content if available
        const metaobjectId = (content as any)?.metaobject_id;
        if (!metaobjectId) {
            showToast("Cannot delete: page ID not found", "error");
            console.error("[deletePage] No metaobject_id in content:", content);
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/builder/content?handle=${slug}&id=${encodeURIComponent(metaobjectId)}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || "Failed to delete");
            }
            showToast("Page deleted successfully!", "success");
            window.location.reload(); // Reload to trigger 404/AdminPageBuilder
        } catch (error: any) {
            console.error("Failed to delete:", error);
            showToast(`Failed to delete page: ${error.message}`, "error");
        } finally {
            setIsDeleting(false);
        }
    };


    // Update Section Helper
    const updateSection = useCallback((sectionId: string, newSettings: any) => {
        setContent((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map((section) =>
                    section.id === sectionId
                        ? { ...section, settings: { ...section.settings, ...newSettings } }
                        : section
                ),
            };
        });
    }, []);

    // Handle Redirect Loading State override
    // If isRedirecting is true, we force return loader
    if (loading || isRedirecting || authLoading) return <PremiumPreloader />;

    // 404 Handling: Admin vs User
    if (notFound || !content) {
        if (isAdmin) {
            // Only show builder if we are sure we are not redirecting
            return <AdminPageBuilder slug={slug} />;
        } else {
            return <UnderConstruction />;
        }
    }

    // New Template Renderers
    // Check if the content specifies a template type that requires a specialized renderer
    if (content.template_type === 'template2') {
        return <Template2Renderer content={content} slug={slug} />;
    }

    if (content.template_type === 'template3') {
        return <Template3Renderer content={content} slug={slug} />;
    }

    // Default Renderer (Template 1 logic / Generic Section Loop)
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

            {/* Dynamic Section Rendering — first 3 sections render instantly, the rest lazy-load on scroll */}
            {content.sections.map((section, index) => {
                const sectionContent = (() => {
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
                    case "shop_by_occasion":
                        return (
                            <ShopByOccasion
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "clean_grid":
                        return (
                            <CleanGrid
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
                    case "shop_category":
                        return (
                            <ShopCategory
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "sales_split":
                        return (
                            <SalesSplit
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    // case "editorial_section":
                    //    return <EditorialSection key={section.id} />; // Removed as per user request
                    case "video_promo":
                        return (
                            <VideoPromo
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                            />
                        );
                    case "fabric_feature":
                        return <FabricFeature key={section.id} />; // TODO: Make editable
                    case "testimonials":
                        return <Testimonials key={section.id} />; // TODO: Make editable
                    case "features":
                        return <Features key={section.id} />; // TODO: Make editable
                    case "about_us":
                        return (
                            <AboutUsSection
                                key={section.id}
                                data={section.settings as any}
                                isEditMode={isEditMode}
                                onUpdate={(newSettings) => updateSection(section.id, newSettings)}
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
                })();

                if (!sectionContent) return null;

                // First 3 sections render immediately (above-the-fold)
                // Remaining sections are wrapped with LazySection for viewport-triggered loading
                if (index < 3) {
                    return <div key={section.id}>{sectionContent}</div>;
                }

                return (
                    <LazySection key={section.id} minHeight="300px">
                        {sectionContent}
                    </LazySection>
                );
            })}

            <LazySection minHeight="200px">
                <Footer />
            </LazySection>
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
