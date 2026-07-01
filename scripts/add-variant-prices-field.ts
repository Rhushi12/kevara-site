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

async function shopifyFetch(query: string, variables?: any) {
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
        body: JSON.stringify({ query, variables }),
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
    console.log(`Checking custom_product definition on domain: ${domain}`);

    try {
        // First get the definition ID for custom_product
        const getDefQuery = `
        query {
            metaobjectDefinitionByType(type: "custom_product") {
                id
                fieldDefinitions {
                    key
                    type {
                        name
                    }
                }
            }
        }`;
        
        const dataId = await shopifyFetch(getDefQuery);
        
        if (!dataId.metaobjectDefinitionByType) {
            console.error("custom_product definition not found.");
            return;
        }

        const definitionId = dataId.metaobjectDefinitionByType.id;
        const fields = dataId.metaobjectDefinitionByType.fieldDefinitions;
        
        const hasVariantPrices = fields.some((f: any) => f.key === "variant_prices");
        
        if (hasVariantPrices) {
            console.log("variant_prices field already exists. No update needed.");
            return;
        }
        
        console.log("Updating custom_product definition to add variant_prices...");

        const updateMutation = `
        mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
            metaobjectDefinition {
              id
              name
              type
            }
            userErrors {
              field
              message
            }
          }
        }`;

        const variables = {
            id: definitionId,
            definition: {
                fieldDefinitions: [
                    {
                        create: {
                            key: "variant_prices",
                            name: "Variant Prices",
                            type: "json"
                        }
                    }
                ]
            }
        };

        const result = await shopifyFetch(updateMutation, variables);

        if (result.metaobjectDefinitionUpdate.userErrors.length > 0) {
            console.error("Failed to update definition:", result.metaobjectDefinitionUpdate.userErrors);
        } else {
            console.log("Successfully added variant_prices to custom_product!");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
