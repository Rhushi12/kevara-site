"use client";

import CollectionGrid from "@/components/CollectionGrid";
import FeaturedProduct from "@/components/FeaturedProduct";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import LookbookFeature from "@/components/LookbookFeature";
import MenShopEssentials from "@/components/MenShopEssentials";
import Navbar from "@/components/Navbar";

const MEN_HERO_SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=2070&auto=format&fit=crop",
        heading: "Modern Classics: Redefined",
        subheading: "TIMELESS STYLE FOR THE CONTEMPORARY MAN",
        buttonText: "SHOP MEN",
        link: "/collections/men",
    },
];

const MEN_LOOKBOOK_DATA = {
    title: "Urban Explorer <br /> Lookbook",
    subtitle: "Autumn Winter 21'",
    image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=1000&auto=format&fit=crop",
    ctaText: "Explore",
    ctaLink: "/pages/lookbook-men"
};

const MEN_FEATURED_PRODUCT = {
    title: "Classic Oxford Shirt",
    price: "$85.00",
    images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", // Placeholder, ideally replace with men's shirt images
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop"
    ],
    collection: "Essentials Collection",
    rating: 4,
    reviews: 24
};

export default function MenPage() {
    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <HeroSlider slides={MEN_HERO_SLIDES} />
            <MenShopEssentials />
            <LookbookFeature
                title={MEN_LOOKBOOK_DATA.title}
                subtitle={MEN_LOOKBOOK_DATA.subtitle}
                image={MEN_LOOKBOOK_DATA.image}
                ctaText={MEN_LOOKBOOK_DATA.ctaText}
                ctaLink={MEN_LOOKBOOK_DATA.ctaLink}
            />
            <FeaturedProduct product={MEN_FEATURED_PRODUCT} />
            <CollectionGrid />
            <Footer />
        </main>
    );
}
