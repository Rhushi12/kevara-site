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

const SHOPIFY_GRAPHQL_URL = `https://${domain}/admin/api/2024-07/graphql.json`;

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
    console.log("📋 Checking ALL page_content entries for rich content...\n");

    const listQuery = `
    query {
      metaobjects(type: "page_content", first: 100) {
        edges {
          node {
            id
            handle
            updatedAt
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;

    const listData = await shopifyRequest(listQuery);
    const pages = listData.metaobjects.edges;

    console.log(`Found ${pages.length} total entries\n`);

    // Check each one for rich content (non-empty settings)
    for (const edge of pages) {
        const node = edge.node;
        const contentField = node.fields.find((f: any) => f.key === 'content_json');

        if (!contentField?.value) continue;

        try {
            const parsed = JSON.parse(contentField.value);
            const slug = parsed.slug || 'N/A';
            const sectionCount = parsed.sections?.length || 0;

            // Check if any section has non-empty settings (indicating customization)
            let hasRichContent = false;
            let richSections: string[] = [];

            if (parsed.sections) {
                for (const section of parsed.sections) {
                    const settings = section.settings || {};

                    // Check for non-empty arrays or custom values
                    for (const [key, value] of Object.entries(settings)) {
                        if (Array.isArray(value) && value.length > 0) {
                            hasRichContent = true;
                            richSections.push(`${section.type}: ${key}=${value.length} items`);
                        } else if (typeof value === 'string' && value.length > 100) {
                            hasRichContent = true;
                            richSections.push(`${section.type}: ${key}=${value.length} chars`);
                        }
                    }
                }
            }

            const updatedDate = new Date(node.updatedAt);
            const timeStr = updatedDate.toLocaleString('en-IN');

            if (hasRichContent || slug === 'homepage') {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🔥 POTENTIAL MATCH: ${node.handle}`);
                console.log(`   Slug: ${slug}`);
                console.log(`   Sections: ${sectionCount}`);
                console.log(`   Updated: ${timeStr}`);
                console.log(`   ID: ${node.id}`);

                if (hasRichContent) {
                    console.log(`   Rich content found in:`);
                    richSections.forEach(s => console.log(`     - ${s}`));
                }

                // Save to file
                const filename = `full-backup-${node.handle}.json`;
                fs.writeFileSync(filename, JSON.stringify(parsed, null, 2));
                console.log(`   📁 Saved to: ${filename}`);
            }
        } catch (e) {
            // ignore parse errors
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log("✅ Done checking all entries");
}

main().catch(console.error);
