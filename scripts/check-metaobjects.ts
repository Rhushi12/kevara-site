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
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

async function shopifyFetch(query: string) {
    if (!domain || !accessToken) {
        throw new Error("Missing Shopify credentials");
    }
    const url = `https://${domain}/admin/api/2024-07/graphql.json`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        throw new Error(`Shopify API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.errors) {
        throw new Error("GraphQL Error: " + JSON.stringify(json.errors));
    }
    return json.data;
}

async function main() {
    console.log(`Checking metaobjects on domain: ${domain}`);

    const query = `
    query {
        metaobjectDefinitions(first: 20) {
            edges {
                node {
                    type
                    name
                    fieldDefinitions {
                        key
                        type {
                            name
                        }
                    }
                }
            }
        }
    }`;

    try {
        const data = await shopifyFetch(query);
        const definitions = data.metaobjectDefinitions.edges.map((edge: any) => edge.node);
        const relevantTypes = ["category_page_layout", "shop_essential_tab", "lookbook_section", "collection_grid_item", "hero_slide"];
        const filtered = definitions.filter((def: any) => relevantTypes.includes(def.type));

        console.log(JSON.stringify(filtered, null, 2));
    } catch (error) {
        console.error("Error fetching definitions:", error);
    }
}

main();
