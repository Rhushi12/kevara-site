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
    console.log("🚀 Restoring homepage from backup...\n");

    // Read the rich backup file
    const backupFile = 'full-backup-page_1764850881768_c5v4xb.json';

    if (!fs.existsSync(backupFile)) {
        console.error(`❌ Backup file not found: ${backupFile}`);
        process.exit(1);
    }

    const backupContent = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    // Change the slug to 'homepage'
    backupContent.slug = 'homepage';

    console.log(`📄 Backup loaded: ${backupContent.sections?.length || 0} sections`);
    console.log(`   Section types:`);
    backupContent.sections?.forEach((s: any, i: number) => {
        console.log(`     ${i + 1}. ${s.type}`);
    });

    // Update the homepage metaobject
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
        handle: { type: "page_content", handle: "homepage" },
        metaobject: {
            fields: [
                { key: "content_json", value: JSON.stringify(backupContent) }
            ],
            capabilities: {
                publishable: {
                    status: "ACTIVE"
                }
            }
        }
    };

    console.log("\n⏳ Uploading to Shopify...");

    const result = await shopifyRequest(mutation, variables);

    if (result.metaobjectUpsert.userErrors.length > 0) {
        console.error("❌ Failed to restore homepage:", result.metaobjectUpsert.userErrors);
        process.exit(1);
    }

    console.log("\n✅ HOMEPAGE RESTORED SUCCESSFULLY!");
    console.log(`   Metaobject ID: ${result.metaobjectUpsert.metaobject.id}`);
    console.log(`   Handle: ${result.metaobjectUpsert.metaobject.handle}`);
    console.log("\n🎉 Visit your homepage to see the restored content!");
}

main().catch(console.error);
