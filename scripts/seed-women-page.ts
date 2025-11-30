import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { updateCategoryPage } from '../lib/shopify-admin';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Ensure domain is set for shopify-admin.ts to use
if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STORE_DOMAIN) {
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
}

// Mock Data matching the original hardcoded page
const INITIAL_DATA = {
    heroSlides: [
        {
            heading: "SS21': Embrace the lighter days",
            subheading: "NEW COLLECTION",
            buttonText: "SHOP NOW",
            link: "/collections/women",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
        }
    ],
    shopEssentials: [
        { title: "Dresses", products: [] },
        { title: "Shirts", products: [] },
        { title: "Shorts", products: [] }
    ],
    lookbook: {
        title: "Home Sanctuary <br /> Lookbook",
        subtitle: "Spring Summer 21'",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        cta_text: "Discover",
        cta_link: "/pages/lookbook"
    },
    featuredProduct: null, // Can't easily link a product without ID, leaving null for now
    collectionGrid: [
        {
            title: "Women's Resort",
            link: "/collections/women",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop",
            size: "tall"
        },
        {
            title: "Men's Casual",
            link: "/collections/men",
            image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=1000&auto=format&fit=crop",
            size: "wide"
        },
        {
            title: "Home Essentials",
            link: "/collections/home",
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
            size: "wide"
        }
    ]
};

async function main() {
    console.log("🚀 Seeding Women Page Data...");
    try {
        const id = await updateCategoryPage("women", INITIAL_DATA);
        console.log(`✅ Successfully seeded Women Page. ID: ${id}`);
    } catch (error) {
        console.error("❌ Failed to seed data:", error);
    }
}

main().catch(console.error);
