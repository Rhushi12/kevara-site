"use client";

import CollectionGrid from "@/components/CollectionGrid";
import FeaturedProduct from "@/components/FeaturedProduct";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import LookbookFeature from "@/components/LookbookFeature";
import Navbar from "@/components/Navbar";
import WomenShopEssentials from "@/components/WomenShopEssentials";

const WOMEN_HERO_SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
        heading: "SS21': Embrace the lighter days",
        subheading: "NEW COLLECTION",
        buttonText: "SHOP NOW",
        link: "/collections/women",
    },
];

export default function WomenPage() {
    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <HeroSlider slides={WOMEN_HERO_SLIDES} />
            <WomenShopEssentials />
            <LookbookFeature />
            <FeaturedProduct />
            <CollectionGrid />
            <Footer />
        </main>
    );
}
