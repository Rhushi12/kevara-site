import { NextResponse } from 'next/server';
import { getProductByHandle } from '@/lib/shopify-admin';

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    try {
        const product = await getProductByHandle(params.slug);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        return NextResponse.json({ product });
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}
