import { NextResponse } from 'next/server';
import { getCustomProductBySlug } from '@/lib/custom-products';

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    try {
        // Use getCustomProductBySlug which checks both slug and handle fields in metaobjects
        const product = await getCustomProductBySlug(params.slug);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        return NextResponse.json({ product });
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}
