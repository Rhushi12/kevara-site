import { shopifyFetch } from './shopify-admin';
import { getCustomProductByHandle } from './custom-products';

// The Publication ID for the "Headless" sales channel (Custom App).
// Products MUST be published here for the Storefront API to see them.
const HEADLESS_PUBLICATION_ID = "gid://shopify/Publication/212278116387";

// Default Location ID — used for inventory quantity assignment.
// To find yours: Shopify Admin → Settings → Locations → click the location → ID in the URL.
// This should be set via env var in production.
const DEFAULT_LOCATION_ID = process.env.SHOPIFY_DEFAULT_LOCATION_ID || "";

/**
 * Parses a price string that may contain a range (e.g. "715-825") or non-numeric chars.
 * Returns the highest numeric value as a clean string.
 */
function parsePrice(raw: string): string {
    // Split by dash to handle ranges like "715-825"
    const parts = raw.split('-').map(p => p.trim());
    const numbers = parts
        .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
        .filter(n => !isNaN(n));

    if (numbers.length === 0) return '0';
    return String(Math.max(...numbers));
}

/**
 * Staged Upload: Downloads an image and pushes it directly into Shopify's internal bucket.
 * Bypasses Cloudflare WAF/bot detection that causes "Media processing failed" errors.
 */
async function stagedUploadImage(imageUrl: string, productTitle: string): Promise<string | null> {
    try {
        // Phase 1: Binary Acquisition
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/jpeg, image/png, image/webp, */*',
            }
        });
        if (!response.ok) {
            console.error(`[Staged Upload] Failed to fetch image: ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const size = buffer.length;
        const extension = mimeType.split('/')[1] || 'jpg';
        const filename = `shadow-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

        // Phase 2: Staging Target Generation
        const stagedRes = await shopifyFetch(`
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                stagedUploadsCreate(input: $input) {
                    stagedTargets {
                        url
                        resourceUrl
                        parameters { name value }
                    }
                    userErrors { field message }
                }
            }
        `, { input: [{ filename, mimeType, httpMethod: "POST", resource: "FILE", fileSize: size.toString() }] });

        const data = stagedRes?.stagedUploadsCreate;
        if (!data || data.userErrors?.length > 0) {
            console.error(`[Staged Upload] Target error:`, data?.userErrors);
            return null;
        }

        const target = data.stagedTargets[0];

        // Phase 3: Upload to Shopify's staging bucket
        const formData = new FormData();
        target.parameters.forEach((param: any) => formData.append(param.name, param.value));
        formData.append('file', new Blob([buffer], { type: mimeType }), filename);

        const uploadRes = await fetch(target.url, { method: 'POST', body: formData });
        if (uploadRes.status !== 201 && uploadRes.status !== 204) {
            console.error(`[Staged Upload] Upload failed (HTTP ${uploadRes.status})`);
            return null;
        }

        return target.resourceUrl;
    } catch (err: any) {
        console.error(`[Staged Upload] Exception:`, err.message);
        return null;
    }
}

/**
 * Creates or updates a real Shopify "Shadow Product" based on a Custom Product Metaobject.
 * Always ACTIVE, auto-published to Headless channel, includes images via Staged Uploads.
 */
export async function syncMetaobjectToShopifyProduct(customProductHandle: string) {
    try {
        // 1. Fetch the latest metadata from the custom_product metaobject
        const customProduct = await getCustomProductByHandle(customProductHandle);
        if (!customProduct) {
            console.error(`[Sync] Custom product not found: ${customProductHandle}`);
            return null;
        }

        const { title, descriptionHtml, priceRange, colors, sizes, images } = customProduct;
        const rawPrice = String(priceRange?.minVariantPrice?.amount || '0');

        // Handle price ranges like "715-825" — take the highest value
        const price = parsePrice(rawPrice);

        // 2. Check if a Shadow Product already exists for this handle
        const existingQuery = `
            query getProductByHandle($handle: String!) {
              productByHandle(handle: $handle) {
                id
              }
            }
        `;
        const existingRes = await shopifyFetch(existingQuery, { handle: customProductHandle });
        const productId = existingRes.productByHandle?.id;

        // 3. Build product options (Size, Color)
        // Sanitize: trim, remove empty/invalid names, deduplicate
        const productOptionsInput: any[] = [];
        let colorList = colors && colors.length > 0
            ? [...new Set(colors.map((c: any) => (c.name || '').trim()).filter((n: string) => n.length > 0))]
            : [];
        let sizeList = sizes && sizes.length > 0
            ? [...new Set(sizes.map((s: string) => (s || '').trim()).filter((n: string) => n.length > 0))]
            : [];

        if (sizeList.length > 0) {
            productOptionsInput.push({
                name: "Size",
                values: (sizeList as string[]).map((s) => ({ name: s }))
            });
        }
        if (colorList.length > 0) {
            productOptionsInput.push({
                name: "Color",
                values: (colorList as string[]).map((c) => ({ name: c }))
            });
        }

        // 4. Build variants input (cartesian product of Size × Color)
        const variantsInput: any[] = [];

        if (sizeList.length === 0 && colorList.length === 0) {
            // No options — single default variant
            productOptionsInput.push({ name: "Title", values: [{ name: "Default Title" }] });
            variantsInput.push({ price, optionValues: [{ optionName: "Title", name: "Default Title" }], inventoryPolicy: "DENY" });
        } else {
            // Ensure at least one value per dimension for the loop
            if (sizeList.length === 0) sizeList = ["Default Size"];
            if (colorList.length === 0) colorList = ["Default Color"];

            // Add default options if we forced them
            if (!productOptionsInput.find((o: any) => o.name === "Size") && sizeList[0] === "Default Size") {
                productOptionsInput.push({ name: "Size", values: [{ name: "Default Size" }] });
            }
            if (!productOptionsInput.find((o: any) => o.name === "Color") && colorList[0] === "Default Color") {
                productOptionsInput.push({ name: "Color", values: [{ name: "Default Color" }] });
            }

            for (const size of sizeList) {
                for (const color of colorList) {
                    const optionValues: any[] = [];
                    if (productOptionsInput.find((o: any) => o.name === "Size")) {
                        optionValues.push({ optionName: "Size", name: size });
                    }
                    if (productOptionsInput.find((o: any) => o.name === "Color")) {
                        optionValues.push({ optionName: "Color", name: color });
                    }
                    variantsInput.push({ price, optionValues, inventoryPolicy: "DENY" });
                }
            }
        }

        // 5. Build the productSet payload
        const productSetInput: any = {
            title,
            handle: customProductHandle,
            descriptionHtml: descriptionHtml || '',
            status: "ACTIVE", // CRITICAL: Must be ACTIVE for Storefront checkout
            variants: variantsInput,
        };

        // 6. Upload images via Staged Uploads API
        if (images?.edges?.length > 0) {
            console.log(`[Sync] Uploading ${images.edges.length} images via Staged Uploads...`);
            const validFiles: any[] = [];
            for (const edge of images.edges) {
                const url = edge.node.url;
                const alt = edge.node.altText || title;
                const resourceUrl = await stagedUploadImage(url, title);
                if (resourceUrl) {
                    validFiles.push({ contentType: "IMAGE", originalSource: resourceUrl, alt });
                }
            }
            if (validFiles.length > 0) {
                productSetInput.files = validFiles;
            }
        }

        if (productOptionsInput.length > 0) {
            productSetInput.productOptions = productOptionsInput;
        }
        if (productId) {
            productSetInput.id = productId;
        }

        // 6. Execute productSet (synchronous by default)
        const productSetMutation = `
            mutation productSet($input: ProductSetInput!) {
              productSet(input: $input, synchronous: true) {
                product {
                  id
                  variants(first: 100) {
                    edges {
                      node {
                        id
                        title
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                }
                userErrors { field message }
              }
            }
        `;

        const setResult = await shopifyFetch(productSetMutation, { input: productSetInput });

        if (setResult.productSet?.userErrors?.length > 0) {
            console.error("[Sync] ProductSet Error:", setResult.productSet.userErrors);
            return null;
        }

        const newProductId = setResult.productSet.product.id;
        const variants = setResult.productSet.product.variants.edges;

        console.log(`[Sync] ✅ Shadow Product created/updated: ${newProductId} (${variants.length} variants)`);

        // 7. Publish to the Headless sales channel
        await publishToHeadlessChannel(newProductId);

        // 8. Set inventory quantities (for both new products and updates)
        if (DEFAULT_LOCATION_ID) {
            const stock = customProduct.stock || 0;
            const variantStock = customProduct.variantStock || {};
            // Always dispatch a sync to ensure inventory matches the metaobject
            await syncProductInventory(newProductId, stock, variantStock);
        }

        return {
            productId: newProductId,
            variants: variants.map((v: any) => ({
                id: v.node.id,
                title: v.node.title,
                options: v.node.selectedOptions
            }))
        };

    } catch (error) {
        console.error(`[Sync] Exception syncing product ${customProductHandle}:`, error);
        throw error;
    }
}

/**
 * Publishes a product to the Headless sales channel so it's visible to the Storefront API.
 */
async function publishToHeadlessChannel(productId: string) {
    const mutation = `
        mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
            publishablePublish(id: $id, input: $input) {
                publishable {
                    ... on Product { id }
                }
                userErrors { field message }
            }
        }
    `;

    try {
        const res = await shopifyFetch(mutation, {
            id: productId,
            input: [{ publicationId: HEADLESS_PUBLICATION_ID }]
        });

        if (res.publishablePublish?.userErrors?.length > 0) {
            console.error("[Publish] Error:", res.publishablePublish.userErrors);
        } else {
            console.log(`[Publish] ✅ Published ${productId} to Headless channel`);
        }
    } catch (err: any) {
        console.error(`[Publish] Failed for ${productId}:`, err.message);
    }
}

/**
 * Sets a specific inventory quantity for each variant of a shadow product.
 */
export async function syncProductInventory(productId: string, stock: number, variantStock?: Record<string, number>) {
    if (!DEFAULT_LOCATION_ID) {
        console.warn("[Inventory] Skipping sync — no SHOPIFY_DEFAULT_LOCATION_ID env var set.");
        return;
    }

    try {
        // Fetch variant inventory item IDs AND their titles/options
        const query = `
            query getInventoryItems($id: ID!) {
                product(id: $id) {
                    variants(first: 100) {
                        edges {
                            node {
                                id
                                title
                                selectedOptions {
                                    name
                                    value
                                }
                                inventoryItem {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await shopifyFetch(query, { id: productId });
        const variantEdges = result?.product?.variants?.edges || [];

        if (variantEdges.length === 0) return;

        const hasVariantStock = variantStock && Object.keys(variantStock).length > 0;

        // Build quantities input — match each variant to its specific stock
        const quantities = variantEdges.map((v: any) => {
            const variantTitle = v.node.title; // e.g. "M" or "M / Black"
            const sizeOption = v.node.selectedOptions?.find((o: any) => o.name === "Size");
            const sizeName = sizeOption?.value;

            let quantity = Number(stock) || 0; // Default fallback = global stock

            if (hasVariantStock) {
                // Try matching by size name first (most common use case)
                if (sizeName && variantStock![sizeName] !== undefined) {
                    quantity = Number(variantStock![sizeName]);
                }
                // Fallback: try matching by full variant title (e.g. "M / Black")
                else if (variantStock![variantTitle] !== undefined) {
                    quantity = Number(variantStock![variantTitle]);
                }
            }

            return {
                inventoryItemId: v.node.inventoryItem.id,
                locationId: DEFAULT_LOCATION_ID,
                quantity: quantity
            };
        });

        const mutation = `
            mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
                inventorySetQuantities(input: $input) {
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

        const res = await shopifyFetch(mutation, {
            input: {
                name: "available",
                reason: "correction",
                ignoreCompareQuantity: true,
                quantities
            }
        });

        if (res.inventorySetQuantities?.userErrors?.length > 0) {
            console.error("[Inventory] Error setting quantities:", res.inventorySetQuantities.userErrors);
        } else {
            const stockSummary = hasVariantStock
                ? `per-variant stock for ${variantEdges.length} variants`
                : `${stock} units for ${variantEdges.length} variants`;
            console.log(`[Inventory] ✅ Set ${stockSummary} on ${productId}`);
        }
    } catch (err: any) {
        console.error(`[Inventory] Failed to sync quantities:`, err.message);
    }
}

