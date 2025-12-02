import { shopifyFetch } from '@/lib/shopify-admin';
import { savePageData } from './save-page-data';

/**
 * Removes a product from all page_content metaobjects
 * Called when a product is permanently deleted from the admin
 */
export async function removeProductFromAllPages(productId: string) {
    console.log(`[removeProductFromAllPages] Starting cascade deletion for product: ${productId}`);

    // Query all page_content metaobjects
    const query = `
    query GetAllPageContent {
      metaobjects(type: "page_content", first: 250) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;

    try {
        const result = await shopifyFetch(query);
        const metaobjects = result.metaobjects.edges;

        console.log(`[removeProductFromAllPages] Found ${metaobjects.length} page_content metaobjects`);

        let updatedCount = 0;

        // Process each page
        for (const edge of metaobjects) {
            const { handle, fields } = edge.node;

            // Find content_json field
            const contentField = fields.find((f: any) => f.key === 'content_json');
            if (!contentField || !contentField.value) {
                console.log(`[removeProductFromAllPages] Skipping ${handle} - no content_json`);
                continue;
            }

            // Parse content
            let content;
            try {
                content = JSON.parse(contentField.value);
            } catch (e) {
                console.error(`[removeProductFromAllPages] Failed to parse content for ${handle}`, e);
                continue;
            }

            // Remove product from content
            const updatedContent = removeProductFromContent(content, productId);

            // Check if anything changed
            const originalString = JSON.stringify(content);
            const updatedString = JSON.stringify(updatedContent);

            if (originalString !== updatedString) {
                console.log(`[removeProductFromAllPages] Updating ${handle} - product found and removed`);

                // Save updated content
                await savePageData(handle, updatedContent, 'page_content');
                updatedCount++;
            } else {
                console.log(`[removeProductFromAllPages] Skipping ${handle} - product not found`);
            }
        }

        console.log(`[removeProductFromAllPages] Cascade deletion complete. Updated ${updatedCount} pages.`);
        return { success: true, updatedCount };

    } catch (error) {
        console.error('[removeProductFromAllPages] Error during cascade deletion:', error);
        throw error;
    }
}

/**
 * Recursively removes product from content object
 */
function removeProductFromContent(obj: any, productId: string): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj
            .filter(item => {
                // If this is a product object with an id, filter it out if it matches
                if (item && typeof item === 'object' && item.id === productId) {
                    console.log(`[removeProductFromContent] Removing product ${productId}`);
                    return false;
                }
                return true;
            })
            .map(item => removeProductFromContent(item, productId));
    }

    // Handle objects
    const result: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = removeProductFromContent(obj[key], productId);
        }
    }
    return result;
}

/**
 * Removes orphaned product references from all pages
 * A product is "orphaned" if it's referenced in a page section but doesn't exist in custom_product metaobjects
 * This is useful for cleaning up after manual deletions or data inconsistencies
 */
export async function removeOrphanedProductsFromPages() {
    console.log('[removeOrphanedProductsFromPages] Starting orphaned product cleanup...');

    try {
        // Get all valid product IDs
        const { getCustomProducts } = await import('./custom-products');
        const allProducts = await getCustomProducts();
        const validProductIds = new Set<string>(allProducts.map((p: any) => p.node.id as string));

        console.log(`[removeOrphanedProductsFromPages] Found ${validProductIds.size} valid products`);

        // Query all page_content metaobjects
        const query = `
      query GetAllPageContent {
        metaobjects(type: "page_content", first: 250) {
          edges {
            node {
              id
              handle
              fields {
                key
                value
              }
            }
          }
        }
      }
    `;

        const result = await shopifyFetch(query);
        const metaobjects = result.metaobjects.edges;

        console.log(`[removeOrphanedProductsFromPages] Found ${metaobjects.length} pages to check`);

        let updatedCount = 0;
        let removedCount = 0;

        // Process each page
        for (const edge of metaobjects) {
            const { handle, fields } = edge.node;

            // Find content_json field
            const contentField = fields.find((f: any) => f.key === 'content_json');
            if (!contentField || !contentField.value) {
                continue;
            }

            // Parse content
            let content;
            try {
                content = JSON.parse(contentField.value);
            } catch (e) {
                console.error(`[removeOrphanedProductsFromPages] Failed to parse content for ${handle}`, e);
                continue;
            }

            // Remove orphaned products
            const { updatedContent, removedProducts } = removeOrphanedProductsFromContent(content, validProductIds);

            // Check if anything changed
            if (removedProducts > 0) {
                console.log(`[removeOrphanedProductsFromPages] Updating ${handle} - ${removedProducts} orphaned products removed`);

                // Save updated content
                await savePageData(handle, updatedContent, 'page_content');
                updatedCount++;
                removedCount += removedProducts;
            }
        }

        console.log(`[removeOrphanedProductsFromPages] Cleanup complete. Updated ${updatedCount} pages, removed ${removedCount} orphaned products.`);
        return { success: true, updatedCount, removedCount };

    } catch (error) {
        console.error('[removeOrphanedProductsFromPages] Error during cleanup:', error);
        throw error;
    }
}

/**
 * Recursively removes orphaned products from content object
 * Returns updated content and count of removed products
 */
function removeOrphanedProductsFromContent(obj: any, validProductIds: Set<string>): { updatedContent: any, removedProducts: number } {
    let removedProducts = 0;

    function processValue(value: any): any {
        if (!value || typeof value !== 'object') {
            return value;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value
                .filter(item => {
                    // If this is a product object with an id, check if it's valid
                    if (item && typeof item === 'object' && item.id) {
                        if (!validProductIds.has(item.id)) {
                            console.log(`[removeOrphanedProductsFromContent] Removing orphaned product ${item.id}`);
                            removedProducts++;
                            return false;
                        }
                    }
                    return true;
                })
                .map(item => processValue(item));
        }

        // Handle objects
        const result: any = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                result[key] = processValue(value[key]);
            }
        }
        return result;
    }

    const updatedContent = processValue(obj);
    return { updatedContent, removedProducts };
}
