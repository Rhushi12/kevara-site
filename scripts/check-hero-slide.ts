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
    console.log("Checking Hero Slide Definition...");
    const query = `
    query {
      metaobjectDefinitionByType(type: "hero_slide") {
        id
        type
        fieldDefinitions {
          key
          name
          type {
            name
          }
        }
      }
    }
  `;

    const data = await shopifyRequest(query);
    if (data.metaobjectDefinitionByType) {
        console.log("✅ Found Hero Slide Definition:");
        console.log(JSON.stringify(data.metaobjectDefinitionByType, null, 2));
    } else {
        console.error("❌ Hero Slide Definition NOT FOUND");
    }
}

main().catch(console.error);
