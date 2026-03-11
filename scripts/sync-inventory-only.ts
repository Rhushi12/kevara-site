import { shopifyFetch } from '../lib/shopify-admin';
import { syncProductInventory } from '../lib/shopify-product-sync';

async function syncAllInventory() {
    console.log("=== Fast Inventory Sync ===\n");

    // 1. Fetch ALL custom_product metaobjects to get their handles and stock
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

    const stockMap = new Map<string, number>();
    let cursor: string | null = null;
    let page = 1;

    do {
        const res = await shopifyFetch(query, { cursor });
        const edges = res.metaobjects?.edges || [];

        for (const edge of edges) {
            const handle = edge.node.handle;
            const stockField = edge.node.fields.find((f: any) => f.key === 'stock');
            const stock = stockField?.value ? parseInt(stockField.value, 10) : 0;
            stockMap.set(handle, stock);
        }

        console.log(`  Fetched page ${page}: ${edges.length} items. Total map size: ${stockMap.size}`);
        const pageInfo = res.metaobjects?.pageInfo;
        cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
        page++;
    } while (cursor);

    console.log(`\nFound ${stockMap.size} custom products with stock values. Retrieving Shopify Product IDs...\n`);

    // 2. Fetch all Shopify Shadow Products
    const productsMap = new Map<string, string>(); // handle -> productId
    let prodCursor: string | null = null;

    do {
        const prodQuery = `
          query GetExistingProducts($cursor: String) {
            products(first: 250, after: $cursor) {
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
        const res = await shopifyFetch(prodQuery, { cursor: prodCursor });
        const edges = res.products?.edges || [];

        for (const edge of edges) {
            productsMap.set(edge.node.handle, edge.node.id);
        }

        prodCursor = res.products?.pageInfo?.hasNextPage ? res.products.pageInfo.endCursor : null;
    } while (prodCursor);

    console.log(`Found ${productsMap.size} active Shopify shadow products.\n`);

    // 3. Sync Inventory
    let success = 0;
    let errors = 0;

    const handles = Array.from(stockMap.keys());
    for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        const stock = stockMap.get(handle) || 0;
        const productId = productsMap.get(handle);

        if (!productId) {
            continue; // No shadow product exists for this item yet
        }

        const progress = `[${i + 1}/${handles.length}]`;

        try {
            await syncProductInventory(productId, stock);
            console.log(`${progress} ✅ ${handle} → Synced to ${stock} units.`);
            success++;
        } catch (err: any) {
            console.error(`${progress} ❌ ${handle} → ${err.message}`);
            errors++;
        }

        if (i % 10 === 9) {
            await new Promise(r => setTimeout(r, 500)); // Rate limiting
        }
    }

    console.log("\n=== Sync Summary ===");
    console.log(`  Success: ${success}`);
    console.log(`  Errors:  ${errors}`);
    console.log(`  Total:   ${success + errors}`);
}

syncAllInventory();
