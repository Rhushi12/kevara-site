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
    console.log("Deleting Hero Slide Definition...");

    // 1. Get Definition ID
    const queryId = `
    query {
      metaobjectDefinitionByType(type: "hero_slide") {
        id
      }
    }
  `;
    const dataId = await shopifyRequest(queryId);
    const definitionId = dataId.metaobjectDefinitionByType?.id;

    if (!definitionId) {
        console.error("❌ Hero Slide Definition NOT FOUND");
        return;
    }
    console.log("Found Definition ID:", definitionId);

    // 2. Delete Definition
    const mutation = `
    mutation MetaobjectDefinitionDelete($id: ID!) {
      metaobjectDefinitionDelete(id: $id) {
        deletedId
        userErrors {
          field
          message
        }
      }
    }
  `;

    const result = await shopifyRequest(mutation, { id: definitionId });

    if (result.metaobjectDefinitionDelete.userErrors.length > 0) {
        console.error("❌ Failed to delete definition:", result.metaobjectDefinitionDelete.userErrors);
    } else {
        console.log("✅ Definition Deleted Successfully!");
    }
}

main().catch(console.error);
