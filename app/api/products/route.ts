import { NextResponse } from 'next/server';
import { getCustomProducts } from '@/lib/custom-products';

export async function GET() {
    try {
        const products = await getCustomProducts(); // Fetch all custom products

        // Add cache headers for 60 seconds, stale-while-revalidate for 5 minutes
        const response = NextResponse.json({ products });
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
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
        const { ids, status, sizes, price, colors } = await request.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs array required" }, { status: 400 });
        }

        const { updateCustomProduct } = await import('@/lib/custom-products');

        // Construct update data
        const updateData: any = {};
        if (status) updateData.status = status;
        if (sizes) updateData.sizes = sizes;
        if (price) updateData.price = price;
        if (colors) updateData.colors = colors;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        // Bulk Update
        const results = await Promise.allSettled(ids.map(id =>
            updateCustomProduct({ handle: id, ...updateData })
        ));

        const failed = results.filter(r => r.status === 'rejected');

        if (failed.length > 0) {
            console.error(`Failed to update ${failed.length} products`);
        }

        return NextResponse.json({ success: true, updatedCount: ids.length - failed.length });

    } catch (error: any) {
        console.error("Failed to update products:", error);
        return NextResponse.json({ error: error.message || "Failed to update products" }, { status: 500 });
    }
}
