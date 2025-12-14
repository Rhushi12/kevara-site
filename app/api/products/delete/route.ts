import { NextRequest, NextResponse } from 'next/server';
import { deleteCustomProduct } from '@/lib/custom-products';
import { removeProductFromAllPages } from '@/lib/remove-product-from-pages';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        console.log(`[API] Deleting product with ID: ${id}`);

        // Delete product from metaobjects
        const deletedId = await deleteCustomProduct(id);

        // Remove product from all page sections
        console.log(`[API] Removing product from all page sections...`);
        await removeProductFromAllPages(id);

        return NextResponse.json({ success: true, deletedId });
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}
