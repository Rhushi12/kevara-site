import { NextResponse } from 'next/server';
import { deleteCustomProduct } from '@/lib/custom-products';

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        console.log(`[API] Deleting product with ID: ${id}`);
        const deletedId = await deleteCustomProduct(id);

        return NextResponse.json({ success: true, deletedId });
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}
