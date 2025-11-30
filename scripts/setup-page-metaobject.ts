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

async function main() {
    console.log("🚀 Creating 'collection_page_layout' Metaobject Definition...");

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

    const variables = {
        definition: {
            name: "Collection Page Layout",
            type: "collection_page_layout",
            fieldDefinitions: [
                { key: "hero_title", name: "Hero Title", type: "single_line_text_field" },
                { key: "hero_image", name: "Hero Image", type: "file_reference" },

                { key: "window_1_title", name: "Window 1 Title", type: "single_line_text_field" },
                { key: "window_1_subtitle", name: "Window 1 Subtitle", type: "single_line_text_field" },
                { key: "window_1_image", name: "Window 1 Image", type: "file_reference" },

                { key: "window_2_title", name: "Window 2 Title", type: "single_line_text_field" },
                { key: "window_2_subtitle", name: "Window 2 Subtitle", type: "single_line_text_field" },
                { key: "window_2_image", name: "Window 2 Image", type: "file_reference" }
            ]
        }
    };

    const result = await shopifyRequest(mutation, variables);

    if (result.metaobjectDefinitionCreate.userErrors.length > 0) {
        console.error("❌ Failed:", result.metaobjectDefinitionCreate.userErrors);
    } else {
        console.log("✅ Metaobject Definition Created:", result.metaobjectDefinitionCreate.metaobjectDefinition.type);
    }
}

main().catch(console.error);
