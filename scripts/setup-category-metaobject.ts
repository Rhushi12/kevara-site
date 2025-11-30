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
    console.error("❌ Missing .env variables");
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

async function createDefinition(definition: any) {
    const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const result = await shopifyRequest(mutation, { definition });

    if (result.metaobjectDefinitionCreate.userErrors.length > 0) {
        console.error(`❌ Failed to create ${definition.type}:`, result.metaobjectDefinitionCreate.userErrors);
    } else {
        console.log(`✅ Metaobject Definition Created: ${result.metaobjectDefinitionCreate.metaobjectDefinition.type}`);
    }
}

async function main() {
    console.log("🚀 Creating Category Page Metaobject Definitions...");

    // 0. Hero Slide
    await createDefinition({
        name: "Hero Slide",
        type: "hero_slide",
        fieldDefinitions: [
            { key: "heading", name: "Heading", type: "single_line_text_field" },
            { key: "subheading", name: "Subheading", type: "single_line_text_field" },
            { key: "image", name: "Image", type: "file_reference" },
            { key: "button_text", name: "Button Text", type: "single_line_text_field" },
            { key: "link", name: "Link", type: "single_line_text_field" }
        ],
        capabilities: { publishable: { enabled: true } }
    });

    // 1. Shop Essential Tab
    await createDefinition({
        name: "Shop Essential Tab",
        type: "shop_essential_tab",
        fieldDefinitions: [
            { key: "title", name: "Title", type: "single_line_text_field" },
            { key: "products", name: "Products", type: "list.product_reference" }
        ],
        capabilities: { publishable: { enabled: true } }
    });

    // 2. Lookbook Section
    await createDefinition({
        name: "Lookbook Section",
        type: "lookbook_section",
        fieldDefinitions: [
            { key: "title", name: "Title", type: "multi_line_text_field" },
            { key: "subtitle", name: "Subtitle", type: "single_line_text_field" },
            { key: "image", name: "Image", type: "file_reference" },
            { key: "cta_text", name: "CTA Text", type: "single_line_text_field" },
            { key: "cta_link", name: "CTA Link", type: "single_line_text_field" }
        ],
        capabilities: { publishable: { enabled: true } }
    });

    // 3. Collection Grid Item
    await createDefinition({
        name: "Collection Grid Item",
        type: "collection_grid_item",
        fieldDefinitions: [
            { key: "title", name: "Title", type: "single_line_text_field" },
            { key: "image", name: "Image", type: "file_reference" },
            { key: "link", name: "Link", type: "single_line_text_field" },
            { key: "size", name: "Size", type: "single_line_text_field" } // "tall" or "wide"
        ],
        capabilities: { publishable: { enabled: true } }
    });

    // 4. Category Page Layout
    await createDefinition({
        name: "Category Page Layout",
        type: "category_page_layout",
        fieldDefinitions: [
            { key: "hero_slides", name: "Hero Slides", type: "list.metaobject_reference", validations: [{ name: "metaobject_definition_type", value: "hero_slide" }] },
            { key: "shop_essentials", name: "Shop Essentials", type: "list.metaobject_reference", validations: [{ name: "metaobject_definition_type", value: "shop_essential_tab" }] },
            { key: "lookbook", name: "Lookbook", type: "metaobject_reference", validations: [{ name: "metaobject_definition_type", value: "lookbook_section" }] },
            { key: "featured_product", name: "Featured Product", type: "product_reference" },
            { key: "collection_grid", name: "Collection Grid", type: "list.metaobject_reference", validations: [{ name: "metaobject_definition_type", value: "collection_grid_item" }] }
        ]
    });
}

main().catch(console.error);
