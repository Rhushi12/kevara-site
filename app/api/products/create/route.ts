import { NextResponse } from 'next/server';
import { createProduct } from '@/lib/shopify-admin';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const files = formData.getAll('images') as File[];

        if (!title || !price) {
            return NextResponse.json({ error: "Title and Price are required" }, { status: 400 });
        }

        const product = await createProduct({
            title,
            description,
            price,
            images: files
        });

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error("Failed to create product:", error);
        return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
    }
}
