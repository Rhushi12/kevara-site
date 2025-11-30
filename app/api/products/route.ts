import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/shopify-admin';

export async function GET() {
    try {
        const products = await getProducts(50); // Fetch top 50 products
        return NextResponse.json({ products });
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const { deleteProduct } = await import('@/lib/shopify-admin');
        await deleteProduct(id);

        return NextResponse.json({ success: true, deletedId: id });
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}
