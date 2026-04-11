import { NextResponse } from 'next/server';
import { getCustomProducts } from '@/lib/custom-products';

export async function GET() {
    try {
        const products = await getCustomProducts(); // Fetch all custom products

        // Add cache headers for 60 seconds, stale-while-revalidate for 5 minutes
        const response = NextResponse.json({ products });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id, ids } = await request.json();

        const { deleteCustomProduct } = await import('@/lib/custom-products');

        if (ids && Array.isArray(ids)) {
            // Bulk Delete
            const results = await Promise.allSettled(ids.map(id => deleteCustomProduct(id)));
            const failed = results.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
                console.error(`Failed to delete ${failed.length} products`);
            }

            return NextResponse.json({ success: true, deletedCount: ids.length - failed.length });
        } else if (id) {
            // Single Delete
            await deleteCustomProduct(id);
            return NextResponse.json({ success: true, deletedId: id });
        } else {
            return NextResponse.json({ error: "Product ID or IDs required" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { ids, items, status, sizes, price, colors } = await request.json();

        // Check for either uniform bulk update (ids) or specific item updates (items)
        if ((!ids || !Array.isArray(ids)) && (!items || !Array.isArray(items))) {
            return NextResponse.json({ error: "IDs array or Items array required" }, { status: 400 });
        }

        const { updateCustomProduct } = await import('@/lib/custom-products');
        const { syncMetaobjectToShopifyProduct } = await import('@/lib/shopify-product-sync');

        // Helper: check if an update is stock-only (no need to sync shadow product)
        const isStockOnlyUpdate = (item: any) => {
            const keys = Object.keys(item).filter(k => k !== 'handle');
            return keys.every(k => k === 'stock' || k === 'variantStock');
        };

        // Helper: process items in sequential batches to avoid Shopify rate limiting
        const BATCH_SIZE = 3;
        const BATCH_DELAY_MS = 1000;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        let results: PromiseSettledResult<any>[] = [];

        // 1. Handle "Items" (Specific updates per product, e.g., stock/variantStock)
        if (items && Array.isArray(items)) {
            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const batch = items.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.allSettled(batch.map(async (item: any) => {
                    if (!item.handle) throw new Error("Item handle missing");
                    const res = await updateCustomProduct(item);
                    // Skip expensive Shopify sync for stock-only updates
                    if (!isStockOnlyUpdate(item)) {
                        await syncMetaobjectToShopifyProduct(item.handle);
                    }
                    return res;
                }));
                results = [...results, ...batchResults];
                // Delay between batches to respect rate limits
                if (i + BATCH_SIZE < items.length) {
                    await delay(BATCH_DELAY_MS);
                }
            }
        }

        // 2. Handle "IDs" (Uniform updates to many products)
        if (ids && Array.isArray(ids)) {
            // Construct common update data
            const commonUpdateData: any = {};
            if (status) commonUpdateData.status = status;
            if (sizes) commonUpdateData.sizes = sizes;
            if (price) commonUpdateData.price = price;
            if (colors) commonUpdateData.colors = colors;

            if (Object.keys(commonUpdateData).length > 0) {
                for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                    const batch = ids.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.allSettled(batch.map(async (id) => {
                        const res = await updateCustomProduct({ handle: id, ...commonUpdateData });
                        await syncMetaobjectToShopifyProduct(id);
                        return res;
                    }));
                    results = [...results, ...batchResults];
                    if (i + BATCH_SIZE < ids.length) {
                        await delay(BATCH_DELAY_MS);
                    }
                }
            }
        }

        const failed = results.filter(r => r.status === 'rejected');
        const successCount = results.length - failed.length;

        if (failed.length > 0) {
            console.error(`Failed to update ${failed.length} products`);
        }

        return NextResponse.json({ success: true, updatedCount: successCount });

    } catch (error: any) {
        console.error("Failed to update products:", error);
        return NextResponse.json({ error: error.message || "Failed to update products" }, { status: 500 });
    }
}
