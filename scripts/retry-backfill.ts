import { shopifyFetch } from '../lib/shopify-admin';
import { syncMetaobjectToShopifyProduct } from '../lib/shopify-product-sync';

async function retryBackfill() {
    console.log("=== Retry Backfill (failed + leftover only) ===\n");

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

    let allHandles: string[] = [];
    let cursor: string | null = null;
    let page = 1;

    do {
        const res = await shopifyFetch(query, { cursor });
        const edges = res.metaobjects?.edges || [];
        for (const edge of edges) {
            const productIdField = edge.node.fields.find((f: any) => f.key === 'product_id');
            if (productIdField?.value) {
                allHandles.push(productIdField.value);
            }
        }
        console.log(`  Page ${page}: fetched ${edges.length} metaobjects (total: ${allHandles.length})`);
        const pageInfo = res.metaobjects?.pageInfo;
        cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
        page++;
    } while (cursor);

    // 2. Check which ones already have a published shadow product
    console.log(`\nChecking ${allHandles.length} handles against existing Shopify products...\n`);
    const needsSync: string[] = [];

    for (const handle of allHandles) {
        const checkQuery = `
            query checkProduct($handle: String!) {
                productByHandle(handle: $handle) {
                    id
                    status
                    variants(first: 1) {
                        edges { node { id } }
                    }
                }
            }
        `;
        const res = await shopifyFetch(checkQuery, { handle });
        const product = res.productByHandle;

        // Skip if product exists, is ACTIVE, and has at least 1 variant
        if (product?.id && product?.status === "ACTIVE" && product?.variants?.edges?.length > 0) {
            continue; // Already synced
        }

        needsSync.push(handle);
    }

    console.log(`Found ${needsSync.length} products needing sync (out of ${allHandles.length} total)\n`);

    // 3. Sync only the ones that need it
    let success = 0;
    let errors = 0;

    for (let i = 0; i < needsSync.length; i++) {
        const handle = needsSync[i];
        const progress = `[${i + 1}/${needsSync.length}]`;

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

        // Rate limit
        if (i % 5 === 4) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log("\n=== Retry Summary ===");
    console.log(`  Synced:  ${success}`);
    console.log(`  Failed:  ${errors}`);
    console.log(`  Skipped: ${allHandles.length - needsSync.length} (already synced)`);
    console.log(`  Total:   ${allHandles.length}`);
}

retryBackfill();
