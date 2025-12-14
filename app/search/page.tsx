"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import PremiumPreloader from "@/components/PremiumPreloader";
import { Filter, Search, X } from "lucide-react";
import MobileDrawer from "@/components/options/MobileDrawer";

function SearchPageContent() {
    const { isAdmin } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        categories: [],
        priceRange: { min: "", max: "" },
        sizes: [],
        colors: []
    });
    const [sortBy, setSortBy] = useState("featured");

    // URL Search Parameters
    const urlSearch = searchParams.get("q") || searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPrice = searchParams.get("price") || "";

    // Local search input
    const [searchInput, setSearchInput] = useState(urlSearch);

    // Fetch Products
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
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Update search input when URL changes
    useEffect(() => {
        setSearchInput(urlSearch);
    }, [urlSearch]);

    // Handle search submit
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    // Filter products
    const getDisplayedProducts = useCallback(() => {
        let finalProducts = products;

        // URL Search Filter
        if (urlSearch) {
            const query = urlSearch.toLowerCase();
            finalProducts = finalProducts.filter(product =>
                product.node.title.toLowerCase().includes(query)
            );
        }

        // URL Price Filter
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

        // Sidebar Filters
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

        // Sorting
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
                    case "price-asc": return priceA - priceB;
                    case "price-desc": return priceB - priceA;
                    case "name-asc": return titleA.localeCompare(titleB);
                    case "name-desc": return titleB.localeCompare(titleA);
                    default: return 0;
                }
            });
        }

        return finalProducts;
    }, [products, urlSearch, urlPrice, urlSort, activeFilters, sortBy]);

    const displayedProducts = getDisplayedProducts();

    if (loading) return <PremiumPreloader />;

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />

            {/* Search Header - Light Teal Background */}
            <div
                className="w-full flex justify-center"
                style={{ backgroundColor: '#E8F5F3' }}
            >
                <div
                    className="w-full flex flex-col items-center justify-center px-4 md:px-6 py-10 md:py-0"
                    style={{
                        maxWidth: '1374px',
                        minHeight: '200px'
                    }}
                >
                    {/* Results Heading */}
                    <h1 className="text-[28px] md:text-[42px] font-lora text-[#1a1a1a] mb-6 md:mb-8 text-center">
                        {urlSearch ? (
                            <>Results for "<span className="italic">{urlSearch}</span>"</>
                        ) : (
                            "Search Products"
                        )}
                    </h1>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="w-full max-w-[500px]">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-4 md:px-5 py-3 md:py-4 pr-12 md:pr-14 bg-white border border-gray-200 text-[#1a1a1a] text-sm md:text-base font-figtree focus:outline-none focus:border-[#006D77] transition-colors"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#006D77] transition-colors"
                            >
                                <Search size={20} className="md:w-[22px] md:h-[22px]" />
                            </button>
                        </div>
                    </form>

                    {/* Tabs */}
                    <div className="flex gap-6 md:gap-8 mt-6 md:mt-8">
                        <button className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#1a1a1a] pb-2 border-b-2 border-[#1a1a1a]">
                            Products ({displayedProducts.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-3">
                        <FilterSidebar
                            isOpen={isMobileFilterOpen}
                            onClose={() => setIsMobileFilterOpen(false)}
                            onFilterChange={setActiveFilters}
                            collapsedByDefault={true}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Mobile Actions Bar */}
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
                                isMobile={true}
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

                        {/* Product Grid */}
                        <div>
                            {displayedProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-[repeat(3,314px)] justify-center gap-4 md:gap-6">
                                    {displayedProducts.map((product, index) => (
                                        <ProductCard
                                            key={product.node.id || index}
                                            product={product}
                                            imageAspectRatio="w-full h-[264px] md:h-[392px]"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-gray-50 rounded-lg">
                                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-xl font-lora text-gray-600 mb-2">
                                        {urlSearch ? `No results for "${urlSearch}"` : "Start searching"}
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        {urlSearch ? "Try different keywords or check the spelling" : "Enter a search term above to find products"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<PremiumPreloader />}>
            <SearchPageContent />
        </Suspense>
    );
}
