"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CollectionHero from "@/components/CollectionHero";
import StickyFilter from "@/components/StickyFilter";
import FocalSection from "@/components/FocalSection";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";

// Helper to format slug to title
const formatTitle = (slug: string) => {
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

// Mock images for the "Two Windows" section
const COLLECTION_WINDOWS = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
        title: "Editor's Pick",
        subtitle: "TRENDING NOW"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        title: "New Arrivals",
        subtitle: "JUST LANDED"
    }
];

export default function CollectionPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const title = slug ? formatTitle(slug) : "Collection";

    // Use a relevant image based on slug or default
    const heroImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <CollectionHero title={title} image={heroImage} />

            <div className="container mx-auto px-4 py-16">
                <div className="flex flex-col lg:flex-row gap-8 relative">
                    {/* Sticky Sidebar (Left) */}
                    <div className="w-full lg:w-1/4">
                        <StickyFilter />
                    </div>

                    {/* Main Content (Right) */}
                    <div className="w-full lg:w-3/4">
                        {/* Two Windows Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                            {COLLECTION_WINDOWS.map((window) => (
                                <div key={window.id} className="relative aspect-[4/5] group overflow-hidden cursor-pointer">
                                    <Image
                                        src={window.image}
                                        alt={window.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute bottom-8 left-8 text-white">
                                        <span className="text-xs font-bold tracking-widest uppercase mb-2 block">
                                            {window.subtitle}
                                        </span>
                                        <h3 className="text-2xl font-lora">
                                            {window.title}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                            {/* Duplicating mock products to fill the grid */}
                            {[...MOCK_SHOPIFY_PRODUCTS, ...MOCK_SHOPIFY_PRODUCTS, ...MOCK_SHOPIFY_PRODUCTS].slice(0, 9).map((product, index) => (
                                <ProductCard key={`${product.node.id}-${index}`} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <FocalSection />
            <Footer />
        </main>
    );
}
