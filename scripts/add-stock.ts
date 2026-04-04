/**
 * scripts/add-stock.ts
 * 
 * Adds 100 stock to every custom product (both global stock and per-variant stock).
 * 
 * Usage: npx tsx scripts/add-stock.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local BEFORE importing shopify-admin (it reads env at module level)
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { shopifyFetch } from '../lib/shopify-admin';

const STOCK_TO_ADD = 100;

interface MetaobjectField {
  key: string;
  value: string;
}

interface MetaobjectNode {
  id: string;
  handle: string;
  fields: MetaobjectField[];
}

async function upsertMetaobject(type: string, handle: string, fields: { key: string; value: string }[]) {
  const mutation = `
    mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id }
        userErrors { field message }
      }
    }
  `;

  const result = await shopifyFetch(mutation, {
    handle: { type, handle },
    metaobject: { fields },
  });

  if (result.metaobjectUpsert?.userErrors?.length > 0) {
    throw new Error(result.metaobjectUpsert.userErrors.map((e: any) => e.message).join(', '));
  }
  return result.metaobjectUpsert.metaobject.id;
}

async function getAllCustomProducts(): Promise<MetaobjectNode[]> {
  const products: MetaobjectNode[] = [];
  let cursor: string | null = null;
  let page = 1;

  const query = `
    query GetAllMetaobjects($cursor: String) {
      metaobjects(type: "custom_product", first: 50, after: $cursor) {
        edges {
          node {
            id
            handle
            fields { key value }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  do {
    const res = await shopifyFetch(query, { cursor });
    const edges = res.metaobjects?.edges || [];
    for (const edge of edges) {
      products.push(edge.node);
    }
    console.log(`  Fetched page ${page}: ${edges.length} products (total: ${products.length})`);
    const pageInfo = res.metaobjects?.pageInfo;
    cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    page++;
  } while (cursor);

  return products;
}

async function addStockToAllProducts() {
  console.log(`\n=== Adding ${STOCK_TO_ADD} stock to ALL products ===\n`);

  const products = await getAllCustomProducts();
  console.log(`\nFound ${products.length} products. Updating stock...\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;

    try {
      // Extract current values
      const getField = (key: string) => product.fields.find(f => f.key === key)?.value;

      const title = getField('title') || product.handle;
      const currentStock = parseInt(getField('stock') || '0', 10);
      const currentVariantStockRaw = getField('variant_stock');
      let currentVariantStock: Record<string, number> = {};

      try {
        if (currentVariantStockRaw) {
          currentVariantStock = JSON.parse(currentVariantStockRaw);
        }
      } catch {
        // ignore parse errors
      }

      // Calculate new values
      const newStock = currentStock + STOCK_TO_ADD;
      const newVariantStock: Record<string, number> = {};
      for (const [size, qty] of Object.entries(currentVariantStock)) {
        newVariantStock[size] = (qty || 0) + STOCK_TO_ADD;
      }

      // Build update fields
      const fields: { key: string; value: string }[] = [
        { key: 'stock', value: String(newStock) },
      ];

      if (Object.keys(newVariantStock).length > 0) {
        fields.push({ key: 'variant_stock', value: JSON.stringify(newVariantStock) });
      }

      await upsertMetaobject('custom_product', product.handle, fields);

      const variantInfo = Object.keys(newVariantStock).length > 0
        ? ` | variants: ${JSON.stringify(newVariantStock)}`
        : '';
      console.log(`${progress} ✅ "${title}" — stock: ${currentStock} → ${newStock}${variantInfo}`);
      success++;
    } catch (err: any) {
      console.error(`${progress} ❌ ${product.handle} — ${err.message}`);
      errors++;
    }

    // Rate limiting: pause every 10 products
    if (i % 10 === 9) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Errors:  ${errors}`);
  console.log(`  📦 Total:   ${products.length}`);
}

addStockToAllProducts().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
