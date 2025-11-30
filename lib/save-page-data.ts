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
export function extractMediaGids(data: any): string[] {
    const gids = new Set<string>();
    // Matches MediaImage, Video, and GenericFile GIDs
    const gidPattern = /gid:\/\/shopify\/(?:MediaImage|Video|GenericFile)\/\d+/;

    function traverse(obj: any) {
        if (!obj) return;

        if (typeof obj === 'string') {
            if (gidPattern.test(obj)) gids.add(obj);
        } else if (Array.isArray(obj)) {
            obj.forEach(traverse);
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(traverse);
        }
    }

    traverse(data);
    return Array.from(gids);
}

// ==============================================================================
// 2. MAIN FUNCTION: The Robust Save
// ==============================================================================
export async function savePageData(handle: string, jsonData: any, type: string = "page_content") {
    if (!domain || !token) throw new Error("Configuration Error: Missing SHOPIFY_ADMIN_API_URL or SHOPIFY_ACCESS_TOKEN.");

    // A. Extract Assets to prevent Garbage Collection
    const assetIds = extractMediaGids(jsonData);
    console.log(`[Save] Found ${assetIds.length} assets to link for ${handle}`);

    // B. The Mutation (Using 'metaobjectUpsert' to avoid duplicates)
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

    // C. The Variables (Strictly typed for Shopify)
    const variables: UpsertVariables = {
        handle: {
            type: type, // MUST match your Definition Handle exactly
            handle: handle        // e.g. "page-home"
        },
        metaobject: {
            capabilities: {
                publishable: {
                    status: "ACTIVE" // <--- CRITICAL FIX: Forces live publish
                }
            },
            fields: [
                {
                    key: "page_handle",
                    value: handle
                },
                {
                    key: "content_json", // Matches our definition
                    value: JSON.stringify(jsonData)
                },
                {
                    key: "page_assets",
                    // <--- CRITICAL FIX: Must stringify the array for List fields
                    value: JSON.stringify(assetIds)
                }
            ]
        }
    };

    // D. The Network Call
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

        // E. High-Level GraphQL Error Handling (Syntax, Throttling)
        if (result.errors && result.errors.length > 0) {
            const messages = result.errors.map(e => e.message).join("; ");
            throw new Error(`GraphQL Execution Failure: ${messages}`);
        }

        const { metaobjectUpsert } = result.data;

        // F. UserError Handling (Business Logic Validation)
        if (metaobjectUpsert.userErrors && metaobjectUpsert.userErrors.length > 0) {
            const errorDetails = metaobjectUpsert.userErrors
                .map(e => `Field [${e.field.join('.')}] - ${e.message} (${e.code})`)
                .join("; ");
            throw new ShopifyGraphQLError(`Metaobject Validation Failed: ${errorDetails}`, metaobjectUpsert.userErrors);
        }

        // G. Success State
        if (!metaobjectUpsert.metaobject) {
            throw new Error("Upsert completed but returned null metaobject. Check permissions.");
        }

        console.log("✅ Success! Saved & Published:", metaobjectUpsert.metaobject.handle);
        return metaobjectUpsert.metaobject;

    } catch (error) {
        // Log the error with context for server-side monitoring
        console.error(` Failed for handle '${handle}':`, error);
        throw error;
    }
}
