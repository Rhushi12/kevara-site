import { NextRequest, NextResponse } from 'next/server';
import { deleteCustomProduct } from '@/lib/custom-products';
import { removeProductFromAllPages } from '@/lib/remove-product-from-pages';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { id, handle } = await request.json();
        
        const targetHandle = handle || id;

        if (!targetHandle) {
            return NextResponse.json({ error: "Product handle is required" }, { status: 400 });
        }


        // Delete product from metaobjects and Shopify shadow products
        const deletedId = await deleteCustomProduct(targetHandle);

        // Remove product from all page sections using the returned Metaobject ID
        if (deletedId) {
            await removeProductFromAllPages(deletedId);
        }

        return NextResponse.json({ success: true, deletedId });
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}
