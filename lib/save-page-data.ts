import 'dotenv/config'; // Ensure dotenv is installed if running as script

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;

// --- Type Definitions ---

interface ShopifyUserError {
    field: string[];
    message: string;
    code: string;
}

interface GraphQLResponse<T> {
    data: T;
    errors?: {
        message: string;
        locations?: { line: number; column: number };
        path?: string[];
        extensions?: any;
    }[];
}

interface MetaobjectUpsertResponse {
    metaobjectUpsert: {
        metaobject: {
            id: string;
            handle: string;
            updatedAt: string;
        } | null;
        userErrors: ShopifyUserError[];
    };
}

interface UpsertVariables {
    handle: {
        type: string;
        handle: string;
    };
    metaobject: {
        capabilities: {
            publishable: {
                status: "ACTIVE";
            };
        };
        fields: {
            key: string;
            value: string;
        }[];
    };
}

// --- Helper Utilities ---

class ShopifyGraphQLError extends Error {
    constructor(message: string, public userErrors?: ShopifyUserError[]) {
        super(message);
        this.name = "ShopifyGraphQLError";
    }
}

// ==============================================================================
// 1. HELPER: Recursively find all Image GIDs (Fixes "Disappearing Images")
// ==============================================================================


function getHomeSanctuaryValue(data: any, field: "title" | "subtitle"): string {
    if (!data || !data.sections) return "";
    const section = data.sections.find((s: any) => s.type === "collection_grid");
    return section?.settings?.[field] || "";
}

function getHomeSanctuaryImage(data: any, index: number): string {
    if (!data || !data.sections) return "";
    const section = data.sections.find((s: any) => s.type === "collection_grid");
    const items = section?.settings?.items || [];
    return items[index]?.image_id || "";
}

function getLookbookValue(data: any, field: "title" | "subtitle" | "cta_text" | "cta_link" | "image_id"): string {
    if (!data || !data.sections) return "";
    const section = data.sections.find((s: any) => s.type === "lookbook");
    return section?.settings?.[field] || "";
}

// ==============================================================================
// 2. MAIN FUNCTION: The Robust Save
// ==============================================================================
import { getPageContent } from './shopify-admin';
import { extractMediaGids } from './shopify-utils';

export async function savePageData(slug: string, jsonData: any, type: string = "page_content") {
    if (!domain || !token) throw new Error("Configuration Error: Missing SHOPIFY_ADMIN_API_URL or SHOPIFY_ACCESS_TOKEN.");

    // A. Check if page exists by slug to get its unique handle
    let uniqueHandle = slug;

    // Only do lookup for page_content type, others might still use direct handles
    if (type === "page_content") {
        try {
            const existingPage = await getPageContent(slug);
            if (existingPage && existingPage.metaobject_handle) {
                uniqueHandle = existingPage.metaobject_handle;
            } else {
                // Generate new unique handle if not found
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 8);
                uniqueHandle = `page_${timestamp}_${random}`;
            }
        } catch (error) {
            console.error(`[Save] Error looking up existing page:`, error);
            // Fallback to slug as handle if lookup fails (legacy behavior)
            uniqueHandle = slug;
        }
    }

    // B. Extract Assets to prevent Garbage Collection
    const assetIds = extractMediaGids(jsonData);

    // C. The Mutation (Using 'metaobjectUpsert' to avoid duplicates)
    const mutation = `
    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

    // D. The Variables (Strictly typed for Shopify)
    const variables: UpsertVariables = {
        handle: {
            type: type, // MUST match your Definition Handle exactly
            handle: uniqueHandle        // Unique handle
        },
        metaobject: {
            capabilities: {
                publishable: {
                    status: "ACTIVE" // <--- CRITICAL FIX: Forces live publish
                }
            },
            fields: [
                {
                    key: "content_json", // Matches our definition
                    value: JSON.stringify({ ...jsonData, slug }) // Inject slug into JSON
                },
                {
                    key: "page_assets",
                    // <--- CRITICAL FIX: Must stringify the array for List fields
                    value: JSON.stringify(assetIds)
                }
            ]
        }
    };

    // E. The Network Call
    try {
        const response = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": token,
            },
            body: JSON.stringify({ query: mutation, variables }),
            cache: "no-store" // <--- CRITICAL FIX: Kills Next.js Cache
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const result: GraphQLResponse<MetaobjectUpsertResponse> = await response.json();

        // F. High-Level GraphQL Error Handling (Syntax, Throttling)
        if (result.errors && result.errors.length > 0) {
            const messages = result.errors.map(e => e.message).join("; ");
            throw new Error(`GraphQL Execution Failure: ${messages}`);
        }

        const { metaobjectUpsert } = result.data;

        // G. UserError Handling (Business Logic Validation)
        if (metaobjectUpsert.userErrors && metaobjectUpsert.userErrors.length > 0) {
            const errorDetails = metaobjectUpsert.userErrors
                .map(e => `Field [${e.field.join('.')}] - ${e.message} (${e.code})`)
                .join("; ");
            throw new ShopifyGraphQLError(`Metaobject Validation Failed: ${errorDetails}`, metaobjectUpsert.userErrors);
        }

        // H. Success State
        if (!metaobjectUpsert.metaobject) {
            throw new Error("Upsert completed but returned null metaobject. Check permissions.");
        }

        return metaobjectUpsert.metaobject;

    } catch (error) {
        // Log the error with context for server-side monitoring
        console.error(` Failed for slug '${slug}':`, error);
        throw error;
    }
}
