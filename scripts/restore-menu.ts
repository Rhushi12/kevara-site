import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

const SHOPIFY_GRAPHQL_URL = `https://${domain}/admin/api/2024-01/graphql.json`;

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

// --- Image Upload Logic ---

async function migrateImageToShopify(imageUrl: string): Promise<string> {
    console.log(`   ⬇️ Fetching image: ${imageUrl}`);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const filename = `restored-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

    // Step A: Staged Upload
    const stagedUploadQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
      }
    }
  `;
    const stagedVariables = {
        input: [{
            resource: "FILE",
            filename: filename,
            mimeType: contentType,
            httpMethod: "POST",
            acl: "private"
        }]
    };
    const stagedData = await shopifyRequest(stagedUploadQuery, stagedVariables);
    const target = stagedData.stagedUploadsCreate.stagedTargets[0];

    // Step B: Upload to Signed URL
    const formData = new FormData();
    target.parameters.forEach((p: any) => formData.append(p.name, p.value));
    const blob = new Blob([buffer], { type: contentType });
    formData.append("file", blob as any, filename);

    await fetch(target.url, {
        method: "POST",
        body: formData,
    });

    // Step C: Create File
    const fileCreateQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
        }
      }
    }
  `;
    const fileVariables = {
        files: [{
            originalSource: target.resourceUrl,
            contentType: "IMAGE"
        }]
    };
    const fileData = await shopifyRequest(fileCreateQuery, fileVariables);
    const fileId = fileData.fileCreate.files[0].id;
    console.log(`   ✅ Uploaded to Shopify: ${fileId}`);
    return fileId;
}

// --- Original Menu Data ---
const MENU_DATA = [
    {
        id: "new-arrivals",
        label: "New Arrivals",
        href: "/collections/new-arrivals",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "CLOTHING",
                items: [
                    { label: "New In", href: "/collections/new-in" },
                    { label: "Best Sellers", href: "/collections/best-sellers" },
                    { label: "Back in Stock", href: "/collections/back-in-stock" },
                    { label: "Coming Soon", href: "/collections/coming-soon" },
                    { label: "Trending Now", href: "/collections/trending" },
                    { label: "Online Exclusives", href: "/collections/online-exclusives" },
                    { label: "Limited Edition", href: "/collections/limited-edition" },
                    { label: "Last Chance", href: "/collections/last-chance" },
                    { label: "Gift Cards", href: "/collections/gift-cards" },
                ],
            },
            {
                title: "COLLECTIONS",
                items: [
                    { label: "Spring 2024", href: "/collections/spring-2024" },
                    { label: "Summer Essentials", href: "/collections/summer-essentials" },
                    { label: "Workwear Edit", href: "/collections/workwear-edit" },
                    { label: "Occasion Wear", href: "/collections/occasion-wear" },
                    { label: "Vacation Shop", href: "/collections/vacation" },
                    { label: "Wedding Guest", href: "/collections/wedding-guest" },
                    { label: "Festival Edit", href: "/collections/festival" },
                    { label: "Denim Guide", href: "/collections/denim-guide" },
                ],
            },
        ],
        images: [
            {
                label: "New Season",
                src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
                href: "/collections/new-in",
            },
            {
                label: "Trending",
                src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
                href: "/collections/trending",
            },
            {
                label: "Editor's Pick",
                src: "https://images.unsplash.com/photo-1485230946086-1d99d529a132?q=80&w=800&auto=format&fit=crop",
                href: "/collections/editors-pick",
            },
            {
                label: "Summer Vibes",
                src: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/summer-vibes",
            },
            {
                label: "Essentials",
                src: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop",
                href: "/collections/essentials",
            },
        ],
    },
    {
        id: "women",
        label: "Women",
        href: "/women",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "CLOTHING",
                items: [
                    { label: "New Arrivals", href: "/collections/women-new" },
                    { label: "Best Sellers", href: "/collections/women-best-sellers" },
                    { label: "Dresses", href: "/collections/women-dresses" },
                    { label: "Tops & Shirts", href: "/collections/women-tops" },
                    { label: "Trousers & Shorts", href: "/collections/women-bottoms" },
                    { label: "Jackets & Coats", href: "/collections/women-jackets" },
                    { label: "Knitwear", href: "/collections/women-knitwear" },
                    { label: "Denim", href: "/collections/women-denim" },
                    { label: "Skirts", href: "/collections/women-skirts" },
                    { label: "Activewear", href: "/collections/women-activewear" },
                    { label: "Swimwear", href: "/collections/women-swimwear" },
                    { label: "Loungewear", href: "/collections/women-loungewear" },
                    { label: "Linen Collection", href: "/collections/women-linen" },
                    { label: "Occasion Wear", href: "/collections/women-occasion" },
                    { label: "Workwear", href: "/collections/women-workwear" },
                ],
            },
            {
                title: "ACCESSORIES",
                items: [
                    { label: "Bags", href: "/collections/women-bags" },
                    { label: "Jewelry", href: "/collections/women-jewelry" },
                    { label: "Shoes", href: "/collections/women-shoes" },
                    { label: "Scarves", href: "/collections/women-scarves" },
                    { label: "Belts", href: "/collections/women-belts" },
                    { label: "Sunglasses", href: "/collections/women-sunglasses" },
                    { label: "Hats", href: "/collections/women-hats" },
                    { label: "Hair Accessories", href: "/collections/women-hair" },
                ],
            },
            {
                title: "COLLECTIONS",
                items: [
                    { label: "Spring 2024", href: "/collections/spring-2024" },
                    { label: "Summer Essentials", href: "/collections/summer-essentials" },
                    { label: "Minimalist Edit", href: "/collections/minimalist" },
                    { label: "Vacation Shop", href: "/collections/vacation" },
                    { label: "Wedding Guest", href: "/collections/wedding-guest" },
                ],
            },
        ],
        images: [
            {
                label: "New Season",
                src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-new",
            },
            {
                label: "Best Sellers",
                src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-best-sellers",
            },
            {
                label: "Editor's Pick",
                src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-editors-pick",
            },
            {
                label: "Dresses",
                src: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-dresses",
            },
            {
                label: "Accessories",
                src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-accessories",
            },
        ],
    },
    {
        id: "collections",
        label: "Collections",
        href: "/collections/all",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "FEATURED",
                items: [
                    { label: "Home Sanctuary", href: "/collections/home-sanctuary" },
                    { label: "Urban Explorer", href: "/collections/urban-explorer" },
                    { label: "Minimalist", href: "/collections/minimalist" },
                ],
            },
        ],
        images: [
            {
                label: "New Collection",
                src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/new",
            },
            {
                label: "Lookbook",
                src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
                href: "/pages/lookbook",
            },
            {
                label: "Sale",
                src: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop",
                href: "/collections/sale",
            },
        ],
    },
    {
        id: "about",
        label: "About",
        href: "/about",
        shopify_layout_type: "visual",
        images: [
            {
                label: "Our Story",
                src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                href: "/about/story",
            },
            {
                label: "Sustainability",
                src: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=800&auto=format&fit=crop",
                href: "/about/sustainability",
            },
            {
                label: "Craftsmanship",
                src: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop",
                href: "/about/craftsmanship",
            },
        ],
    },
];

async function main() {
    console.log("🚀 Restoring Original Menu Data...");

    const menuTabs: any[] = [];
    const allFileIds: string[] = [];

    for (const item of MENU_DATA) {
        console.log(`Processing menu item: ${item.label}`);

        const menuItem: any = {
            id: item.id,
            label: item.label,
            href: item.href,
            shopify_layout_type: item.shopify_layout_type,
            columns: item.columns || [],
            carousel: []
        };

        // Handle Images
        if (item.images && Array.isArray(item.images)) {
            for (const img of item.images) {
                if (img.src) {
                    try {
                        const shopifyId = await migrateImageToShopify(img.src);
                        allFileIds.push(shopifyId);
                        menuItem.carousel.push({
                            ...img,
                            src: shopifyId
                        });
                    } catch (err) {
                        console.error(`   ❌ Failed to migrate image ${img.src}:`, err);
                        menuItem.carousel.push(img);
                    }
                }
            }
        }

        menuTabs.push(menuItem);
    }

    console.log("📤 Uploading to Shopify Metaobject...");

    const finalJson = { menu_tabs: menuTabs };

    const upsertMutation = `
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
        handle: { type: "global_mega_menu", handle: "main-menu" },
        metaobject: {
            fields: [
                { key: "menu_structure_json", value: JSON.stringify(finalJson) },
                { key: "all_menu_images", value: JSON.stringify(allFileIds) }
            ]
        }
    };

    const result = await shopifyRequest(upsertMutation, variables);
    if (result.metaobjectUpsert.userErrors.length > 0) {
        console.error("❌ Metaobject Upsert Failed:", result.metaobjectUpsert.userErrors);
    } else {
        console.log("🎉 Restoration Complete! Metaobject ID:", result.metaobjectUpsert.metaobject.id);
    }
}

main().catch(console.error);
