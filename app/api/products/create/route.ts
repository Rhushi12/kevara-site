import { NextRequest, NextResponse } from 'next/server';
import { createCustomProduct } from '@/lib/custom-products';
import { requireAdmin } from '@/lib/auth';

// Route segment config for App Router
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface CreateProductRequest {
    title: string;
    price: string;
    description?: string;
    imageUrls: string[];     // R2 public URLs
    videoUrl?: string;       // R2 public URL for video
    colors?: { name: string; hex: string }[];
    sizes?: string[];
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body: CreateProductRequest = await request.json();
        const { title, price, description, imageUrls, videoUrl, colors, sizes } = body;

        if (!title || !price) {
            return NextResponse.json({ error: "Title and Price are required" }, { status: 400 });
        }

        if (!imageUrls || imageUrls.length === 0) {
            return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
        }


        // Create custom product with R2 URLs directly
        // The createCustomProduct function needs to handle URLs instead of GIDs
        const product = await createCustomProduct({
            title,
            description: description || "",
            price,
            currency: "INR",
            imageUrls,          // Pass R2 URLs directly
            videoUrl,           // Pass R2 video URL
            colors,
            sizes,
            status: "ACTIVE"
        });


        if (!product) {
            throw new Error("Product creation failed - no product returned");
        }

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error("Failed to create product:", error);
        return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
    }
}
