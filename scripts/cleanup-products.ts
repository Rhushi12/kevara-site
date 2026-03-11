require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function shopifyFetch(query, variables = {}) {
    const res = await fetch('https://bkbkiz-7h.myshopify.com/admin/api/2024-01/graphql.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.NEXT_PRIVATE_SHOPIFY_ADMIN_TOKEN || ''
        },
        body: JSON.stringify({ query, variables })
    });
    return res.json();
}

async function deleteAllProducts() {
    console.log("Fetching all products to delete...");
    let hasNextPage = true;
    let cursor = null;
    let totalDeleted = 0;

    while (hasNextPage) {
        const query = `
            query getProducts($cursor: String) {
                products(first: 50, after: $cursor) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const data = await shopifyFetch(query, { cursor });
        const products = data?.data?.products?.edges || [];

        if (products.length === 0) {
            console.log("No more products found.");
            break;
        }

        for (const edge of products) {
            const id = edge.node.id;
            const title = edge.node.title;
            console.log(`Deleting ${title} (${id})...`);

            const deleteMutation = `
                mutation productDelete($input: ProductDeleteInput!) {
                    productDelete(input: $input) {
                        deletedProductId
                        userErrors { field message }
                    }
                }
            `;

            const delRes = await shopifyFetch(deleteMutation, { input: { id } });
            if (delRes?.data?.productDelete?.userErrors?.length > 0) {
                console.error(`Error deleting ${id}:`, delRes.data.productDelete.userErrors);
            } else {
                totalDeleted++;
            }
        }

        hasNextPage = data?.data?.products?.pageInfo?.hasNextPage;
        cursor = data?.data?.products?.pageInfo?.endCursor;
    }

    console.log(`Successfully deleted ${totalDeleted} products.`);
}

deleteAllProducts().catch(console.error);
