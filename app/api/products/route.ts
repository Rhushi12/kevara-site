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

        let results: PromiseSettledResult<any>[] = [];

        // 1. Handle "Items" (Specific updates per product, e.g., suffixes)
        if (items && Array.isArray(items)) {
            const itemResults = await Promise.allSettled(items.map(async (item: any) => {
                if (!item.handle) throw new Error("Item handle missing");
                return updateCustomProduct(item);
            }));
            results = [...results, ...itemResults];
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
                const idResults = await Promise.allSettled(ids.map(id =>
                    updateCustomProduct({ handle: id, ...commonUpdateData })
                ));
                results = [...results, ...idResults];
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
