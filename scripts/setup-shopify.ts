import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Try loading .env.local manually since dotenv/config only loads .env by default
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
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

const MUTATION_CREATE_DEFINITION = `
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        type
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createDefinition(name: string, type: string, fields: any[]) {
    console.log(`🔨 Creating Definition: ${name}...`);

    const variables = {
        definition: {
            name,
            type,
            fieldDefinitions: fields,
            access: {
                storefront: "PUBLIC_READ"
            }
        }
    };

    const data = await shopifyRequest(MUTATION_CREATE_DEFINITION, variables);

    if (data.metaobjectDefinitionCreate.userErrors.length > 0) {
        // Ignore "already exists" errors, warn on others
        const error = data.metaobjectDefinitionCreate.userErrors[0].message;
        if (error.includes("taken")) {
            console.log(`ℹ️ ${name} already exists. Skipping.`);
        } else {
            console.warn(`⚠️ Warning for ${name}:`, error);
        }
    } else {
        console.log(`✅ Success! Created ${name}`);
    }
}

async function main() {
    console.log("🚀 Starting Shopify Metaobject Setup...");

    // 1. Hero Slide
    await createDefinition("Hero Slide", "hero_slide", [
        { key: "heading", name: "Heading", type: "single_line_text_field" },
        { key: "subheading", name: "Subheading", type: "single_line_text_field" },
        { key: "image", name: "Image", type: "file_reference" },
        { key: "button_text", name: "Button Text", type: "single_line_text_field" },
        { key: "link", name: "Link", type: "url" }
    ]);

    // 2. Marquee Item
    await createDefinition("Marquee Item", "marquee_item", [
        { key: "text", name: "Text", type: "single_line_text_field" }
    ]);

    // 3. Homepage Section (Editorial/Fabric)
    await createDefinition("Homepage Section", "homepage_section", [
        { key: "section_type", name: "Section Type", type: "single_line_text_field" },
        { key: "heading", name: "Heading", type: "single_line_text_field" },
        { key: "description", name: "Description", type: "multi_line_text_field" },
        { key: "image", name: "Image", type: "file_reference" },
        { key: "button_label", name: "Button Label", type: "single_line_text_field" }
    ]);

    // 4. Mega Menu Config
    await createDefinition("Mega Menu Configuration", "mega_menu_configuration", [
        { key: "trigger_name", name: "Trigger Name", type: "single_line_text_field" },
        { key: "layout_type", name: "Layout Type", type: "single_line_text_field" },
        { key: "promo_images", name: "Promo Images", type: "list.file_reference" },
        { key: "promo_headings", name: "Promo Headings", type: "list.single_line_text_field" },
        { key: "promo_links", name: "Promo Links", type: "list.url" },
        { key: "link_columns_json", name: "Link Columns JSON", type: "multi_line_text_field" }
    ]);

    console.log("🎉 Setup Complete!");
}

main();
