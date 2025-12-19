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

async function shopifyFetch(query: string, variables: any = {}) {
    const url = `https://${domain}/admin/api/2024-07/graphql.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token!,
        },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
    });
    const json = await response.json();
    if (json.errors) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
    }
    return json.data;
}

async function main() {
    console.log("🔍 Debugging delete page issue...\n");

    // 1. List all page_content metaobjects
    const query = `
        query {
            metaobjects(type: "page_content", first: 50) {
                edges {
                    node {
                        id
                        handle
                        fields {
                            key
                            value
                        }
                    }
                }
            }
        }
    `;

    const data = await shopifyFetch(query);
    const edges = data.metaobjects?.edges || [];

    console.log(`📄 Found ${edges.length} page_content metaobjects\n`);

    // For each, parse and show slug
    for (const edge of edges.slice(0, 10)) {
        const metaobject = edge.node;
        const contentJsonField = metaobject.fields.find((f: any) => f.key === "content_json");

        let slug = "N/A";
        if (contentJsonField?.value) {
            try {
                const parsed = JSON.parse(contentJsonField.value);
                slug = parsed.slug || "NOT SET";
            } catch (e) {
                slug = "PARSE ERROR";
            }
        }

        console.log(`  Handle: ${metaobject.handle}`);
        console.log(`     ID: ${metaobject.id}`);
        console.log(`   Slug: ${slug}`);
        console.log("");
    }
}

main().catch(console.error);
