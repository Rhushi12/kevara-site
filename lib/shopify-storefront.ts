/**
 * Shopify Storefront API Client
 * 
 * This client is used exclusively for Customer-facing operations (Cart, Checkout, Customer Auth).
 * It uses the NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN and operates via the Storefront GraphQL API.
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

const endpoint = `https://${domain}/api/2024-01/graphql.json`;

type ShopifyFetchParams = {
    query: string;
    variables?: Record<string, any>;
};

/**
 * Execute a Storefront GraphQL Request
 */
export async function storefrontFetch({ query, variables }: ShopifyFetchParams) {
    if (!domain || !storefrontToken) {
        throw new Error("Missing Shopify Storefront domain or token.");
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': storefrontToken,
                // Add buyer IP/browser context headers here later if proxying checkout
            },
            body: JSON.stringify({ query, variables }),
            // Storefront API generally caches well natively, but carts mutate often:
            cache: 'no-store',
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Storefront API error (${response.status}): ${text}`);
        }

        const json = await response.json();

        if (json.errors) {
            console.error('Storefront GraphQL Errors:', json.errors);
            throw new Error('Storefront API GraphQL execution failed.');
        }

        return { status: response.status, body: json };
    } catch (error) {
        console.error('Error fetching Storefront API:', error);
        throw error;
    }
}
