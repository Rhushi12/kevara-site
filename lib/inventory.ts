/**
 * lib/inventory.ts
 * 
 * Centralised inventory management for Kevara.
 * 
 * Stock is stored in TWO places:
 *   1. Shopify Metaobject (custom_product) → `stock` (global) + `variant_stock` (per-size JSON)
 *   2. Shopify Shadow Product → actual inventory quantities per variant
 * 
 * This module keeps both in sync on:
 *   - Order creation (decrement)
 *   - Return approval (increment)
 *   - RTO delivery / Delhivery webhook (increment via restock)
 */

import { shopifyFetch } from './shopify-admin';
import { getCustomProductByHandle, updateCustomProduct } from './custom-products';
import { syncProductInventory } from './shopify-product-sync';

const DEFAULT_LOCATION_ID = process.env.SHOPIFY_DEFAULT_LOCATION_ID || '';

// ─── Types ──────────────────────────────────────────────────

interface OrderLineItem {
    productId: string;      // Shopify numeric product ID (from webhook)
    variantId?: string;     // Shopify numeric variant ID
    variantTitle?: string;  // e.g. "M", "M / Blue"
    title: string;
    quantity: number;
    sku?: string;
}

interface RestockItem {
    inventoryItemId: string;
    quantity: number;
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Look up a Shopify product by its numeric ID and return its handle.
 * The handle is the same as the custom product metaobject handle.
 */
async function getProductHandleById(shopifyProductId: string): Promise<string | null> {
    try {
        const gid = shopifyProductId.startsWith('gid://')
            ? shopifyProductId
            : `gid://shopify/Product/${shopifyProductId}`;

        const query = `
            query getProductHandle($id: ID!) {
                product(id: $id) {
                    handle
                }
            }
        `;
        const data = await shopifyFetch(query, { id: gid });
        return data?.product?.handle || null;
    } catch (err: any) {
        console.error(`[Inventory] Failed to look up handle for product ${shopifyProductId}:`, err.message);
        return null;
    }
}

/**
 * Extract the size from a variant title like "M", "M / Blue", "Default Title".
 */
function extractSizeFromVariant(variantTitle?: string): string | null {
    if (!variantTitle || variantTitle === 'Default Title') return null;
    // Variant titles are formatted as "Size" or "Size / Color"
    const parts = variantTitle.split('/').map(s => s.trim());
    return parts[0] || null; // First part is always the size
}

// ─── Core Functions ─────────────────────────────────────────

/**
 * DECREMENT STOCK — Called when an order is placed.
 * 
 * For each line item:
 * 1. Look up the custom product handle from the Shopify product ID
 * 2. Fetch the current stock/variantStock from the metaobject
 * 3. Subtract the ordered quantity
 * 4. Update the metaobject
 * 5. Sync to Shopify shadow product inventory
 */
export async function decrementStockForOrder(items: OrderLineItem[]): Promise<void> {
    for (const item of items) {
        try {
            // 1. Find the custom product handle
            const handle = await getProductHandleById(item.productId);
            if (!handle) {
                console.warn(`[Inventory] Could not find handle for product ${item.productId}, skipping stock decrement`);
                continue;
            }

            // 2. Fetch current product data
            const product = await getCustomProductByHandle(handle);
            if (!product) {
                console.warn(`[Inventory] Custom product not found for handle ${handle}, skipping`);
                continue;
            }

            const currentStock = product.stock || 0;
            const currentVariantStock: Record<string, number> = product.variantStock || {};
            const size = extractSizeFromVariant(item.variantTitle);

            // 3. Calculate new stock values
            const newGlobalStock = Math.max(0, currentStock - item.quantity);
            const newVariantStock = { ...currentVariantStock };

            if (size && newVariantStock[size] !== undefined) {
                newVariantStock[size] = Math.max(0, newVariantStock[size] - item.quantity);
            }

            // 4. Update the metaobject
            await updateCustomProduct({
                handle,
                stock: newGlobalStock,
                variantStock: newVariantStock,
            });

            // 5. Sync to Shopify shadow product inventory
            const shadowProductId = await getShadowProductId(handle);
            if (shadowProductId) {
                await syncProductInventory(shadowProductId, newGlobalStock, newVariantStock);
            }

            console.log(
                `[Inventory] ✅ Decremented stock for "${item.title}" (${handle}):`,
                size ? `${size}: ${currentVariantStock[size] || 0} → ${newVariantStock[size] || 0}` : `global: ${currentStock} → ${newGlobalStock}`,
                `(ordered ${item.quantity})`
            );
        } catch (err: any) {
            console.error(`[Inventory] ❌ Failed to decrement stock for "${item.title}":`, err.message);
            // Don't throw — continue with other items
        }
    }
}

/**
 * INCREMENT STOCK — Called when a return is approved.
 * 
 * 1. Fetch the return record to get orderId + itemHandle
 * 2. Fetch the order to get the variant title (size) and quantity
 * 3. Increment the metaobject stock
 * 4. Sync to Shopify shadow product inventory
 */
export async function incrementStockForReturn(
    itemHandle: string,
    variantTitle?: string,
    quantity: number = 1
): Promise<void> {
    try {
        // 1. Fetch current product data
        const product = await getCustomProductByHandle(itemHandle);
        if (!product) {
            console.warn(`[Inventory] Custom product not found for handle ${itemHandle}, skipping restock`);
            return;
        }

        const currentStock = product.stock || 0;
        const currentVariantStock: Record<string, number> = product.variantStock || {};
        const size = extractSizeFromVariant(variantTitle);

        // 2. Calculate new stock values
        const newGlobalStock = currentStock + quantity;
        const newVariantStock = { ...currentVariantStock };

        if (size && newVariantStock[size] !== undefined) {
            newVariantStock[size] = (newVariantStock[size] || 0) + quantity;
        } else if (size) {
            // Size key didn't exist before — create it
            newVariantStock[size] = quantity;
        }

        // 3. Update the metaobject
        await updateCustomProduct({
            handle: itemHandle,
            stock: newGlobalStock,
            variantStock: newVariantStock,
        });

        // 4. Sync to Shopify shadow product inventory
        const shadowProductId = await getShadowProductId(itemHandle);
        if (shadowProductId) {
            await syncProductInventory(shadowProductId, newGlobalStock, newVariantStock);
        }

        console.log(
            `[Inventory] ✅ Incremented stock for "${itemHandle}":`,
            size ? `${size}: ${currentVariantStock[size] || 0} → ${newVariantStock[size] || 0}` : `global: ${currentStock} → ${newGlobalStock}`,
            `(returned ${quantity})`
        );
    } catch (err: any) {
        console.error(`[Inventory] ❌ Failed to increment stock for "${itemHandle}":`, err.message);
        throw err;
    }
}

/**
 * Get the Shopify Shadow Product GID from its handle.
 */
async function getShadowProductId(handle: string): Promise<string | null> {
    try {
        const query = `
            query getProductByHandle($handle: String!) {
                productByHandle(handle: $handle) {
                    id
                }
            }
        `;
        const data = await shopifyFetch(query, { handle });
        return data?.productByHandle?.id || null;
    } catch (err: any) {
        console.warn(`[Inventory] Could not find shadow product for handle "${handle}":`, err.message);
        return null;
    }
}

// ─── Delhivery Webhook Helpers ──────────────────────────────

/**
 * Fetches order line items from Firebase for restocking.
 * Used by the Delhivery webhook when RTO/return is delivered.
 */
export async function fetchOrderLineItemsForRestock(orderId: string): Promise<{
    orderName: string;
    items: { inventoryItemId: string; quantity: number; title: string }[];
} | null> {
    try {
        // Firebase Admin SDK
        const { db } = await import('@/lib/firebase-admin');

        // orderId from Delhivery might be the orderNumber or the Firebase doc ID
        let orderDoc = await db.collection('orders').doc(orderId).get();

        // If not found by doc ID, search by orderNumber
        if (!orderDoc.exists) {
            const snap = await db.collection('orders')
                .where('orderNumber', '==', parseInt(orderId) || orderId)
                .limit(1)
                .get();
            if (!snap.empty) {
                orderDoc = snap.docs[0];
            }
        }

        if (!orderDoc.exists) {
            console.warn(`[Inventory] Order not found: ${orderId}`);
            return null;
        }

        const order = orderDoc.data()!;
        const items: { inventoryItemId: string; quantity: number; title: string }[] = [];

        // For each line item, look up the inventory item ID from the shadow product
        for (const item of (order.items || [])) {
            try {
                const handle = await getProductHandleById(item.productId);
                if (!handle) continue;

                const shadowProductId = await getShadowProductId(handle);
                if (!shadowProductId) continue;

                // Fetch variant inventory item IDs
                const query = `
                    query getVariants($id: ID!) {
                        product(id: $id) {
                            variants(first: 100) {
                                edges {
                                    node {
                                        title
                                        inventoryItem { id }
                                    }
                                }
                            }
                        }
                    }
                `;
                const data = await shopifyFetch(query, { id: shadowProductId });
                const variants = data?.product?.variants?.edges || [];

                // Match variant by title
                const match = variants.find((v: any) => {
                    if (!item.variantTitle) return true; // Default variant
                    return v.node.title === item.variantTitle ||
                        v.node.title.includes(item.variantTitle);
                }) || variants[0];

                if (match?.node?.inventoryItem?.id) {
                    items.push({
                        inventoryItemId: match.node.inventoryItem.id,
                        quantity: item.quantity || 1,
                        title: item.title,
                    });
                }
            } catch (err: any) {
                console.warn(`[Inventory] Failed to get inventory item for ${item.title}:`, err.message);
            }
        }

        return {
            orderName: `#${order.orderNumber || orderId}`,
            items,
        };
    } catch (err: any) {
        console.error(`[Inventory] fetchOrderLineItemsForRestock error:`, err.message);
        return null;
    }
}

/**
 * Restocks inventory in Shopify using inventoryAdjustQuantities.
 * Used by the Delhivery webhook for RTO/return deliveries.
 */
export async function restockOrderItems(
    items: RestockItem[],
    reason: string = 'Restock from return'
): Promise<void> {
    if (!DEFAULT_LOCATION_ID) {
        console.warn('[Inventory] Skipping restock — no SHOPIFY_DEFAULT_LOCATION_ID set');
        return;
    }

    if (items.length === 0) return;

    try {
        const mutation = `
            mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
                inventoryAdjustQuantities(input: $input) {
                    inventoryAdjustmentGroup {
                        reason
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const changes = items.map(item => ({
            delta: item.quantity,
            inventoryItemId: item.inventoryItemId,
            locationId: DEFAULT_LOCATION_ID,
        }));

        const res = await shopifyFetch(mutation, {
            input: {
                name: 'available',
                reason: 'correction',
                changes,
            }
        });

        if (res.inventoryAdjustQuantities?.userErrors?.length > 0) {
            console.error('[Inventory] Restock errors:', res.inventoryAdjustQuantities.userErrors);
        } else {
            console.log(`[Inventory] ✅ Restocked ${items.length} item(s): ${reason}`);
        }
    } catch (err: any) {
        console.error(`[Inventory] Restock failed:`, err.message);
        throw err;
    }
}
