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

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;

if (!domain || !token) {
    console.error("❌ Missing .env variables: SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
    process.exit(1);
}

const SHOPIFY_GRAPHQL_URL = `https://${domain}/admin/api/2024-07/graphql.json`;

// Page 1: 11:57 am - new-in
const PAGE_NEW_IN = {
    "sections": [
        { "id": "hero-home", "type": "hero_slider", "settings": { "slides": [{ "id": "slide-1", "image": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop", "heading": "New Season Arrivals", "subheading": "DISCOVER THE LATEST TRENDS", "buttonText": "SHOP COLLECTION", "link": "/collections/all" }] } },
        { "id": "shop-occasion-home", "type": "shop_by_occasion", "settings": { "title": "Shop Essentials", "tab1Label": "Women", "tab2Label": "Men", "tab1Products": [], "tab2Products": [] } },
        { "id": "shop-category-home", "type": "shop_category", "settings": {} },
        { "id": "sales-split-home", "type": "sales_split", "settings": {} },
        { "id": "collection-grid-home", "type": "collection_grid", "settings": { "items": [] } },
        { "id": "clean-grid-home", "type": "clean_grid", "settings": { "title": "Latest Arrivals", "products": [] } },
        { "id": "video-promo-home", "type": "video_promo", "settings": {} },
        { "id": "about-us-home", "type": "about_us", "settings": { "label": "ABOUT US", "heading": "Our Story", "description": "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.", "buttonText": "LEARN MORE", "buttonLink": "/pages/about-us", "image": "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop", "imageTag": "Philosophy" } },
        { "id": "testimonials-home", "type": "testimonials", "settings": {} },
        { "id": "features-home", "type": "features", "settings": {} }
    ],
    "slug": "new-in"
};

// Page 2: 11:56 am - new-arrivals
const PAGE_NEW_ARRIVALS = {
    "template_type": "template1",
    "sections": [
        { "id": "hero-1", "type": "hero_slider", "settings": { "slides": [{ "id": "slide-1", "image": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop", "heading": "New Season Arrivals", "subheading": "DISCOVER THE LATEST TRENDS", "buttonText": "SHOP COLLECTION", "link": "/pages/coming-soon" }] } },
        { "id": "essentials-1", "type": "shop_essentials", "settings": { "title": "Dress up in the heat", "description": "SS21 Series of Comfortable textures. With luxurious, natural-looking makeup, we find reasons for the face. New textures and colors bring new inspiration to your everyday life.", "items": [] } },
        { "id": "lookbook-1", "type": "lookbook", "settings": { "title": "Summer 2025 \n Collection", "subtitle": "LOOKBOOK", "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop", "cta_text": "VIEW LOOKBOOK", "cta_link": "/pages/coming-soon" } },
        { "id": "featured-1", "type": "featured_product", "settings": { "product_handle": "" } },
        { "id": "grid-1", "type": "collection_grid", "settings": { "items": [] } }
    ],
    "slug": "new-arrivals"
};

async function shopifyRequest(query: string, variables: any = {}) {
    const response = await fetch(SHOPIFY_GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token!,
        },
        body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
        console.error("API Error:", JSON.stringify(json.errors, null, 2));
        throw new Error("Shopify API Request Failed");
    }
    return json.data;
}

async function restorePage(pageData: any) {
    const slug = pageData.slug;
    console.log(`\n🔄 Restoring page: ${slug}`);

    // Generate a unique handle for the metaobject
    const uniqueHandle = `page_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const mutation = `
    mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const variables = {
        handle: { type: "page_content", handle: uniqueHandle },
        metaobject: {
            fields: [
                { key: "content_json", value: JSON.stringify(pageData) }
            ],
            capabilities: {
                publishable: {
                    status: "ACTIVE"
                }
            }
        }
    };

    const result = await shopifyRequest(mutation, variables);

    if (result.metaobjectUpsert.userErrors.length > 0) {
        console.error(`❌ Failed to restore ${slug}:`, result.metaobjectUpsert.userErrors);
        return null;
    }

    console.log(`✅ Page restored: ${slug}`);
    console.log(`   Metaobject Handle: ${result.metaobjectUpsert.metaobject.handle}`);
    console.log(`   Metaobject ID: ${result.metaobjectUpsert.metaobject.id}`);
    return result.metaobjectUpsert.metaobject;
}

async function main() {
    console.log("🚀 Restoring pages from Shopify backup...\n");

    // Restore both pages
    await restorePage(PAGE_NEW_IN);
    await restorePage(PAGE_NEW_ARRIVALS);

    console.log("\n🎉 Page restoration complete!");
}

main().catch(console.error);
