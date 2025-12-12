"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollFadeBanner from "@/components/ScrollFadeBanner";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import PromoWindows from "@/components/PromoWindows";
import ProductCard from "@/components/ProductCard";
import EssentialsHero from "@/components/EssentialsHero";
import FeaturedIn from "@/components/FeaturedIn";
import SizeGuidePanel from "@/components/SizeGuidePanel";
import PremiumPreloader from "@/components/PremiumPreloader";
import { Trash2, Filter, X } from "lucide-react";
import { PageContent, PageSection } from "@/types/page-editor";
import MobileDrawer from "@/components/options/MobileDrawer";
import ProductPicker from "@/components/admin/ProductPicker";

// Default Initial Content
import { TEMPLATE_2 } from "@/lib/templates";

const DEFAULT_CONTENT: PageContent = TEMPLATE_2;

export default function Template2Page() {
    const { isAdmin } = useAuth();
    const searchParams = useSearchParams();

    const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [sortedMode, setSortedMode] = useState(false);
    const [filterKeyword, setFilterKeyword] = useState("");
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        categories: [],
        priceRange: { min: "", max: "" },
        sizes: [],
        colors: []
    });
    const [selectedProductHandles, setSelectedProductHandles] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("featured");

    // URL Search Parameters
    const urlSearch = searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPrice = searchParams.get("price") || "";

    // Fetch Page Content
    useEffect(() => {
        async function fetchContent() {
            try {
                const res = await fetch("/api/builder/content?handle=template-2");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.sections && data.sections.length > 0) {
                        // Migration: Ensure essentials_hero section exists (replace old shop_essentials)
                        const hasEssentialsHero = data.sections.find((s: any) => s.type === "essentials_hero");
                        if (!hasEssentialsHero) {
                            // Find and replace shop_essentials with essentials_hero
                            const essentialsIndex = data.sections.findIndex((s: any) => s.type === "shop_essentials");
                            const newSection = {
                                id: "essentials-hero-1",
                                type: "essentials_hero",
                                settings: {
                                    label: "ESSENTIALS",
                                    heading: "More than basics",
                                    description: "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
                                    buttonText: "LEARN MORE",
                                    buttonLink: "/collections/essentials",
                                    image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
                                    imageTag: "Fighter"
                                }
                            };

                            if (essentialsIndex !== -1) {
                                // Replace shop_essentials with essentials_hero
                                data.sections[essentialsIndex] = newSection;
                            } else {
                                // Add it before featured_in section
                                const featuredIndex = data.sections.findIndex((s: any) => s.type === "featured_in");
                                if (featuredIndex !== -1) {
                                    data.sections.splice(featuredIndex, 0, newSection);
                                } else {
                                    data.sections.push(newSection);
                                }
                            }
                        }

                        setContent(data);
                        // Load sorting settings if they exist
                        if (data.sortedMode !== undefined) {
                            setSortedMode(data.sortedMode);
                        }
                        if (data.filterKeyword) {
                            setFilterKeyword(data.filterKeyword);
                        }
                        // Load selected products
                        if (data.selectedProductHandles) {
                            setSelectedProductHandles(data.selectedProductHandles);
                        }
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

    // Fetch Products for Grid
    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            }
        }
        fetchProducts();
    }, []);

    // Save Page Content
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...content,
                sortedMode,
                filterKeyword,
                selectedProductHandles
            };
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: "template-2", data: dataToSave }),
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
            const res = await fetch("/api/builder/content?handle=template-2", {
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

    // Filter products based on sidebar filters and sort settings
    const getDisplayedProducts = () => {
        let finalProducts = products;

        // 0. URL Search Filter (highest priority from search panel)
        if (urlSearch) {
            const query = urlSearch.toLowerCase();
            finalProducts = finalProducts.filter(product =>
                product.node.title.toLowerCase().includes(query)
            );
        }

        // 0b. URL Price Filter
        if (urlPrice && urlPrice !== "all") {
            finalProducts = finalProducts.filter(product => {
                const price = parseFloat(product.node.priceRange?.minVariantPrice?.amount || "0");
                switch (urlPrice) {
                    case "under-1000": return price < 1000;
                    case "1000-5000": return price >= 1000 && price <= 5000;
                    case "over-5000": return price > 5000;
                    default: return true;
                }
            });
        }

        // 1. Manual Selection Priority (only if no URL search)
        if (!urlSearch && selectedProductHandles.length > 0) {
            finalProducts = selectedProductHandles
                .map(handle => products.find(p => p.node.handle === handle))
                .filter(Boolean);
        }

        // 2. Keyword Filter (from Admin sort mode)
        if (sortedMode && filterKeyword && !urlSearch) {
            finalProducts = finalProducts.filter(product =>
                product.node.title.toLowerCase().includes(filterKeyword.toLowerCase())
            );
        }

        // 3. Sidebar Filters
        if (activeFilters.categories.length > 0 || activeFilters.priceRange.min || activeFilters.priceRange.max || activeFilters.sizes.length > 0 || activeFilters.colors.length > 0) {
            finalProducts = finalProducts.filter(product => {
                const node = product.node;
                if (activeFilters.categories.length > 0) {
                    const matchesCategory = activeFilters.categories.some(cat =>
                        node.title.toLowerCase().includes(cat.toLowerCase()) ||
                        (node.productType && node.productType.toLowerCase().includes(cat.toLowerCase()))
                    );
                    if (!matchesCategory) return false;
                }
                if (activeFilters.priceRange.min && parseFloat(node.priceRange.minVariantPrice.amount) < parseFloat(activeFilters.priceRange.min)) return false;
                if (activeFilters.priceRange.max && parseFloat(node.priceRange.minVariantPrice.amount) > parseFloat(activeFilters.priceRange.max)) return false;
                if (activeFilters.sizes.length > 0) {
                    const hasSize = node.variants.edges.some((v: any) => activeFilters.sizes.some(size => v.node.title.includes(size)));
                    if (!hasSize) return false;
                }
                if (activeFilters.colors.length > 0) {
                    const hasColor = node.variants.edges.some((v: any) => activeFilters.colors.some(color => v.node.title.includes(color)));
                    if (!hasColor) return false;
                }
                return true;
            });
        }

        // 4. Sorting Logic (URL sort takes priority)
        const effectiveSort = urlSort === "price-low" ? "price-asc"
            : urlSort === "price-high" ? "price-desc"
                : urlSort === "name" ? "name-asc"
                    : sortBy;

        if (effectiveSort !== "featured" && effectiveSort !== "default") {
            finalProducts = [...finalProducts].sort((a, b) => {
                const priceA = parseFloat(a.node.priceRange.minVariantPrice.amount);
                const priceB = parseFloat(b.node.priceRange.minVariantPrice.amount);
                const titleA = a.node.title.toLowerCase();
                const titleB = b.node.title.toLowerCase();

                switch (effectiveSort) {
                    case "price-asc":
                        return priceA - priceB;
                    case "price-desc":
                        return priceB - priceA;
                    case "name-asc":
                        return titleA.localeCompare(titleB);
                    case "name-desc":
                        return titleB.localeCompare(titleA);
                    case "newest":
                        return new Date(b.node.publishedAt || 0).getTime() - new Date(a.node.publishedAt || 0).getTime();
                    default:
                        return 0;
                }
            });
        }

        return finalProducts;
    };

    // Clear URL search
    const clearSearch = () => {
        window.history.replaceState({}, "", "/template-2");
        window.location.reload();
    };

    const displayedProducts = getDisplayedProducts();

    if (loading) return <PremiumPreloader />;

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <SizeGuidePanel />

            {/* Admin Controls */}
            {isAdmin && (
                <>
                    {/* Sorting Controls - Top Right */}
                    {isEditMode && (
                        <div className="fixed top-24 right-6 z-50 bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Product Sorting</h3>

                            {/* Sort Mode Toggle */}
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={() => setSortedMode(!sortedMode)}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${sortedMode
                                        ? 'bg-[#006D77] text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {sortedMode ? '✓ Sorted' : 'Unsorted'}
                                </button>
                            </div>

                            {/* Filter Keyword Input */}
                            {sortedMode && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">
                                        Filter by keyword (e.g., "T-shirt")
                                    </label>
                                    <input
                                        type="text"
                                        value={filterKeyword}
                                        onChange={(e) => setFilterKeyword(e.target.value)}
                                        placeholder="Enter keyword..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#006D77]"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Showing {displayedProducts.length} of {products.length} products
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Edit Controls - Bottom Right */}
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
                </>
            )}



            {/* Render Banner */}
            {content.sections.map((section) => {
                if (section.type === "scroll_banner") {
                    return (
                        <ScrollFadeBanner
                            key={section.id}
                            data={section.settings as any}
                            isEditMode={isEditMode}
                            onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                        />
                    );
                }
                return null;
            })}

            {/* Main Content Layout */}
            <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Filter Sidebar - Hidden on Mobile by default */}
                    <div className="lg:col-span-3">
                        <FilterSidebar
                            isOpen={isMobileFilterOpen}
                            onClose={() => setIsMobileFilterOpen(false)}
                            onFilterChange={setActiveFilters}
                            collapsedByDefault={true}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-12">
                        {/* Mobile Actions Bar - Sticky above Grid or inline */}
                        <div className="md:hidden sticky top-0 z-30 bg-[#FDFBF7] py-4 border-b border-gray-200 mb-6 flex gap-4">
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="flex-1 bg-white border border-gray-200 py-3 px-4 rounded-sm shadow-sm flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900"
                            >
                                <Filter size={16} /> Filters
                            </button>
                            <button
                                onClick={() => setIsMobileSortOpen(true)}
                                className="flex-1 bg-white border border-gray-200 py-3 px-4 rounded-sm shadow-sm flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                                Sort
                            </button>
                        </div>

                        {/* Mobile Filter Drawer */}
                        <MobileDrawer
                            isOpen={isMobileFilterOpen}
                            onClose={() => setIsMobileFilterOpen(false)}
                            title="Filters"
                        >
                            <FilterSidebar
                                isOpen={true}
                                onClose={() => setIsMobileFilterOpen(false)}
                                onFilterChange={setActiveFilters}
                                collapsedByDefault={false}
                                isMobile={true} // Add isMobile prop to handle internal layout/scrolling if needed
                            />
                        </MobileDrawer>

                        {/* Mobile Sort Drawer */}
                        <MobileDrawer
                            isOpen={isMobileSortOpen}
                            onClose={() => setIsMobileSortOpen(false)}
                            title="Sort By"
                        >
                            <div className="space-y-2 p-2">
                                {[
                                    { label: "Featured", value: "featured" },
                                    { label: "Price: Low to High", value: "price-asc" },
                                    { label: "Price: High to Low", value: "price-desc" },
                                    { label: "Name: A-Z", value: "name-asc" },
                                    { label: "Name: Z-A", value: "name-desc" },
                                    { label: "Newest Arrivals", value: "newest" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSortBy(option.value);
                                            setIsMobileSortOpen(false);
                                        }}
                                        className={`w-full text-left py-3 px-4 rounded-lg flex items-center justify-between transition-colors ${sortBy === option.value
                                            ? "bg-[#006D77]/10 text-[#006D77] font-bold"
                                            : "hover:bg-gray-50 text-gray-700 font-medium"
                                            }`}
                                    >
                                        {option.label}
                                        {sortBy === option.value && <div className="w-2 h-2 rounded-full bg-[#006D77]" />}
                                    </button>
                                ))}
                            </div>
                        </MobileDrawer>

                        {/* Promotional Windows */}
                        {content.sections.map((section) => {
                            if (section.type === "promo_windows") {
                                return (
                                    <PromoWindows
                                        key={section.id}
                                        data={section.settings as any}
                                        isEditMode={isEditMode}
                                        onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Product Grid */}
                        <div className="mb-4">
                            {/* URL Search Indicator */}
                            {urlSearch && (
                                <div className="bg-[#006D77]/10 border border-[#006D77]/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                                    <p className="text-sm text-[#006D77] font-medium">
                                        🔍 Showing results for: <span className="font-bold">"{urlSearch}"</span> - {displayedProducts.length} product{displayedProducts.length !== 1 ? "s" : ""} found
                                    </p>
                                    <button
                                        onClick={clearSearch}
                                        className="text-[#006D77] hover:text-[#005a63] p-1 hover:bg-[#006D77]/10 rounded-full transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {sortedMode && filterKeyword && !urlSearch && (
                                <div className="bg-[#006D77]/10 border border-[#006D77]/20 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-[#006D77] font-medium">
                                        📊 Filtered by: <span className="font-bold">"{filterKeyword}"</span> - Showing {displayedProducts.length} products
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-[repeat(3,314px)] justify-center gap-4 md:gap-6">
                                {displayedProducts.map((product, index) => (
                                    <ProductCard
                                        key={product.node.id || index}
                                        product={product}
                                        imageAspectRatio="w-full h-[264px] md:h-[392px]"
                                    />
                                ))}

                                {/* Add Product Card (Edit Mode) */}
                                {isEditMode && (
                                    <div className="w-full h-[392px] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#006D77] hover:bg-[#006D77]/5 transition-colors group cursor-pointer relative bg-gray-50">
                                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                                            <span className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-[#006D77]">Select Products</span>
                                        </div>
                                        <div className="pointer-events-auto">
                                            <ProductPicker
                                                selectedHandles={selectedProductHandles}
                                                onSelectionChange={setSelectedProductHandles}
                                                maxSelection={12} // Limit to 12 for grid
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {displayedProducts.length === 0 && !isEditMode && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">No products found matching "{filterKeyword}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Essentials Section */}
            {content.sections.map((section) => {
                if (section.type === "essentials_hero") {
                    return (
                        <EssentialsHero
                            key={section.id}
                            data={section.settings as any}
                            isEditMode={isEditMode}
                            onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                        />
                    );
                }
                return null;
            })}

            {/* Featured In Section */}
            {content.sections.map((section) => {
                if (section.type === "featured_in") {
                    return (
                        <FeaturedIn
                            key={section.id}
                            data={section.settings as any}
                            isEditMode={isEditMode}
                            onUpdate={(newSettings) => updateSection(section.id, newSettings)}
                        />
                    );
                }
                return null;
            })}

            <Footer />
        </main>
    );
}
