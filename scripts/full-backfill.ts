import { shopifyFetch } from '../lib/shopify-admin';
import { syncMetaobjectToShopifyProduct } from '../lib/shopify-product-sync';

async function fullBackfill() {
    console.log("=== Full Shadow Product Backfill ===\n");

    // 1. Fetch ALL custom_product metaobject handles
    const query = `
      query GetAllMetaobjects($cursor: String) {
        metaobjects(type: "custom_product", first: 50, after: $cursor) {
          edges {
            node {
              handle
              fields {
                key
                value
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let allHandles: { handle: string; productId: string }[] = [];
    let cursor: string | null = null;
    let page = 1;

    do {
        const res = await shopifyFetch(query, { cursor });
        const edges = res.metaobjects?.edges || [];

        for (const edge of edges) {
            const productIdField = edge.node.fields.find((f: any) => f.key === 'product_id');
            if (productIdField?.value) {
                allHandles.push({ handle: productIdField.value, productId: productIdField.value });
            }
        }

        console.log(`  Page ${page}: fetched ${edges.length} metaobjects (total: ${allHandles.length})`);
        const pageInfo = res.metaobjects?.pageInfo;
        cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
        page++;
    } while (cursor);

    console.log(`\nTotal metaobjects to sync: ${allHandles.length}\n`);

    // 2. Sync each one
    let success = 0;
    let errors = 0;

    for (let i = 0; i < allHandles.length; i++) {
        const { handle } = allHandles[i];
        const progress = `[${i + 1}/${allHandles.length}]`;

        try {
            const result = await syncMetaobjectToShopifyProduct(handle);
            if (result) {
                console.log(`${progress} ✅ ${handle} → ${result.productId} (${result.variants.length} variants)`);
                success++;
            } else {
                console.error(`${progress} ❌ ${handle} → sync returned null`);
                errors++;
            }
        } catch (err: any) {
            console.error(`${progress} ❌ ${handle} → ${err.message}`);
            errors++;
        }

        // Rate limit protection: small delay between requests
        if (i % 5 === 4) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log("\n=== Backfill Summary ===");
    console.log(`  Success: ${success}`);
    console.log(`  Errors:  ${errors}`);
    console.log(`  Total:   ${allHandles.length}`);
}

fullBackfill();
