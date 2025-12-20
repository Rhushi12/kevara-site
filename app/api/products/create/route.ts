import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToShopify } from '@/lib/shopify-admin';
import { createCustomProduct } from '@/lib/custom-products';
import { requireAdmin } from '@/lib/auth';

// Route segment config for App Router
export const maxDuration = 60; // 60 seconds timeout for file uploads
export const dynamic = 'force-dynamic';

// Helper for safe JSON parsing
function parseJsonSafe(str: string | null): any | undefined {
    if (!str) return undefined;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn('[API] Failed to parse JSON:', e);
        return undefined;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const files = formData.getAll('images') as File[];
        const videoFile = formData.get('video') as File | null;
        const colorsJson = formData.get('colors') as string | null;
        const sizesJson = formData.get('sizes') as string | null;

        if (!title || !price) {
            return NextResponse.json({ error: "Title and Price are required" }, { status: 400 });
        }

        // Safe JSON parsing with try-catch
        const colors = parseJsonSafe(colorsJson);
        const sizes = parseJsonSafe(sizesJson);


        // Upload all images to Shopify Files in parallel
        const validFiles = files.filter(f => f instanceof File && f.size > 0);
        console.log(`[API] Received ${files.length} files, ${validFiles.length} valid`);

        // Log each file's details for debugging
        validFiles.forEach((file, i) => {
            console.log(`[API] File ${i}: name="${file.name}", type="${file.type}", size=${file.size}, hasArrayBuffer=${typeof file.arrayBuffer === 'function'}`);
        });

        // Use Promise.all to upload concurrently
        const imageGids = await Promise.all(validFiles.map(async (file, index) => {
            console.log(`[API] Uploading file ${index + 1}/${validFiles.length}: ${file.name}`);
            const gid = await uploadFileToShopify(file);
            console.log(`[API] File ${index + 1} uploaded, GID: ${gid}`);
            return gid;
        }));

        // Upload video if provided
        let videoGid: string | undefined;
        if (videoFile && videoFile instanceof File && videoFile.size > 0) {
            console.log(`[API] Uploading video: ${videoFile.name}`);
            videoGid = await uploadFileToShopify(videoFile);
        }


        console.log(`[API] Uploaded ${imageGids.length} images and ${videoGid ? 1 : 0} video. Creating custom product...`);

        // Create custom product with all data
        const product = await createCustomProduct({
            title,
            description,
            price,
            currency: "INR",
            imageGids,
            videoGid,
            colors,
            sizes,
            status: "ACTIVE"
        });

        console.log(`[API] Custom product created successfully:`, product?.handle);

        if (!product) {
            throw new Error("Product creation failed - no product returned");
        }

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error("Failed to create product:", error);
        return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
    }
}
