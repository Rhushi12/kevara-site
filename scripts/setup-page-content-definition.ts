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
    console.log("🚀 Creating Page Content Metaobject Definition...");

    // Page Content Definition
    await createDefinition({
        name: "Page Content",
        type: "page_content",
        fieldDefinitions: [
            {
                key: "page_handle",
                name: "Page Handle",
                type: "single_line_text_field",
                description: "Unique identifier for the page (e.g., 'home', 'about')"
            },
            {
                key: "content_json",
                name: "Content JSON",
                type: "json",
                description: "The complete layout structure of the page"
            },
            {
                key: "page_assets",
                name: "Page Assets",
                type: "list.file_reference",
                description: "Anchor for all images/videos to prevent deletion"
            }
        ],
        capabilities: {
            publishable: { enabled: true }
        }
    });
}

main().catch(console.error);
