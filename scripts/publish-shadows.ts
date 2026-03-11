import { shopifyFetch } from '../lib/shopify-admin';

const HEADLESS_PUBLICATION_ID = "gid://shopify/Publication/212278116387";

async function publishAllShadows() {
    console.log("=== Shadow Product Publisher ===");
    console.log("Fetching all products from Admin API...\n");

    // 1. Get all products
    const query = `
      query GetAllProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            node {
              id
              handle
              status
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let allProducts: any[] = [];
    let cursor: string | null = null;
    let page = 1;

    do {
        const res = await shopifyFetch(query, { cursor });
        const edges = res.products?.edges || [];
        allProducts.push(...edges);
        console.log(`  Page ${page}: fetched ${edges.length} products (total: ${allProducts.length})`);

        const pageInfo = res.products?.pageInfo;
        cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
        page++;
    } while (cursor);

    console.log(`\nTotal products found: ${allProducts.length}\n`);

    let activated = 0;
    let published = 0;
    let errors = 0;

    for (const edge of allProducts) {
        const product = edge.node;

        // Step 1: Activate DRAFT products
        if (product.status === "DRAFT") {
            try {
                const activateMutation = `
                    mutation activateProduct($input: ProductInput!) {
                        productUpdate(input: $input) {
                            product { id status }
                            userErrors { field message }
                        }
                    }
                `;
                const activateRes = await shopifyFetch(activateMutation, {
                    input: { id: product.id, status: "ACTIVE" }
                });
                if (activateRes.productUpdate?.userErrors?.length > 0) {
                    console.error(`  ❌ Activate failed ${product.handle}:`, activateRes.productUpdate.userErrors);
                    errors++;
                    continue;
                }
                console.log(`  ✅ Activated: ${product.handle}`);
                activated++;
            } catch (err: any) {
                console.error(`  ❌ Activate exception ${product.handle}:`, err.message);
                errors++;
                continue;
            }
        }

        // Step 2: Publish to Headless channel
        try {
            const publishMutation = `
                mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
                    publishablePublish(id: $id, input: $input) {
                        publishable {
                            ... on Product { id }
                        }
                        userErrors { field message }
                    }
                }
            `;
            const pubRes = await shopifyFetch(publishMutation, {
                id: product.id,
                input: [{ publicationId: HEADLESS_PUBLICATION_ID }]
            });

            if (pubRes.publishablePublish?.userErrors?.length > 0) {
                console.error(`  ❌ Publish failed ${product.handle}:`, pubRes.publishablePublish.userErrors);
                errors++;
            } else {
                console.log(`  ✅ Published: ${product.handle}`);
                published++;
            }
        } catch (err: any) {
            console.error(`  ❌ Publish exception ${product.handle}:`, err.message);
            errors++;
        }
    }

    console.log("\n=== Summary ===");
    console.log(`  Activated: ${activated}`);
    console.log(`  Published: ${published}`);
    console.log(`  Errors:    ${errors}`);
    console.log(`  Total:     ${allProducts.length}`);
}

publishAllShadows();
