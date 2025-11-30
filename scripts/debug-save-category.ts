import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function main() {
    // Dynamic import to ensure env vars are loaded first
    const { updateCategoryPage } = await import('../lib/shopify-admin');

    console.log("Starting debug save for 'women' category page...");

    const dummyData = {
        banner: {
            title: "Debug Banner Title",
            image_url: "https://images.unsplash.com/photo-1617137968427-85924c800a22",
        },
        shopEssentials: [],
        lookbook: {
            title: "Debug Lookbook",
            subtitle: "Debug Subtitle"
        },
        collectionGrid: [],
        featuredProduct: null
    };

    try {
        const result = await updateCategoryPage("women", dummyData);
        console.log("✅ Update successful! Result ID:", result);
    } catch (error: any) {
        console.error("❌ Update failed!");
        console.error(error);
        if (error.message) {
            console.error("Error Message:", error.message);
        }
    }
}

main().catch(console.error);
